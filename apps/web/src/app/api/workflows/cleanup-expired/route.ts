/**
 * Cleanup Expired Deposits Workflow
 * Runs daily to clean up expired pending deposits
 * Supports both QStash and cron-job.org
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';
import { verifyCronSecret } from '@/lib/cron/workflows';

// POST /api/workflows/cleanup-expired
// Cleanup expired pending deposits (runs daily at midnight)
export async function POST(request: NextRequest) {
  try {
    // Verify cron-job.org secret or QStash signature
    const cronSecret = request.headers.get('x-cron-secret') || '';
    const qstashSignature = request.headers.get('upstash-signature') || '';

    // Support both cron-job.org and QStash
    const isValidCron = verifyCronSecret(cronSecret);
    const isValidQStash = verifyQStashSignature(qstashSignature, '');

    if (!isValidCron && !isValidQStash) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Find expired pending deposits (older than 24 hours)
    // Use created_at if expires_at doesn't exist
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Try with expires_at first, fallback to created_at
    const { data: expiredDeposits, error: fetchError } = await supabase
      .from('deposit_requests')
      .select('id, user_id, bdt_amount, created_at')
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo)
      .limit(100); // Limit to prevent overwhelming the database

    if (fetchError) {
      console.error('Failed to fetch expired deposits:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch expired deposits' },
        { status: 500 }
      );
    }

    if (!expiredDeposits || expiredDeposits.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired deposits found',
        cleaned: 0
      });
    }

    // Update expired deposits
    const { error: updateError } = await supabase
      .from('deposit_requests')
      .update({
        status: 'rejected',
        rejection_reason: 'Expired - no action taken within 24 hours',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .in('id', expiredDeposits.map(d => d.id));

    if (updateError) {
      console.error('Failed to cleanup expired deposits:', updateError);
      return NextResponse.json(
        { error: 'Failed to cleanup expired deposits' },
        { status: 500 }
      );
    }

    // Create notifications for users (filter out invalid user_ids)
    const validNotifications = expiredDeposits
      .filter(d => d.user_id)
      .map(deposit => ({
        user_id: deposit.user_id,
        type: 'deposit_expired',
        title: 'ডিপোজিট রিকোয়েস্ট মেয়াদ শেষ',
        message: `আপনার ৳${deposit.bdt_amount} ডিপোজিট রিকোয়েস্ট মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন রিকোয়েস্ট করুন।`,
        created_at: new Date().toISOString()
      }));

    if (validNotifications.length > 0) {
      await supabase.from('notifications').insert(validNotifications);
    }

    console.log(`Cleaned up ${expiredDeposits.length} expired deposits`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${expiredDeposits.length} expired deposits`,
      cleaned: expiredDeposits.length,
      deposits: expiredDeposits.map(d => d.id)
    });

  } catch (error) {
    console.error('Cleanup workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = POST;
