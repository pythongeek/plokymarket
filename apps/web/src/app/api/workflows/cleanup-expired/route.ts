import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';

// POST /api/workflows/cleanup-expired
// Cleanup expired pending deposits (runs daily at midnight)
export async function POST(request: Request) {
  try {
    // Verify QStash signature
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    
    // Find expired pending deposits (older than 24 hours)
    const { data: expiredDeposits, error: fetchError } = await supabase
      .from('deposit_requests')
      .select('id, user_id, bdt_amount, created_at')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

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
      .lt('expires_at', new Date().toISOString());

    if (updateError) {
      console.error('Failed to cleanup expired deposits:', updateError);
      return NextResponse.json(
        { error: 'Failed to cleanup expired deposits' },
        { status: 500 }
      );
    }

    // Create notifications for users
    const notifications = expiredDeposits.map(deposit => ({
      user_id: deposit.user_id,
      type: 'deposit_expired',
      title: 'ডিপোজিট রিকোয়েস্ট মেয়াদ শেষ',
      message: `আপনার ৳${deposit.bdt_amount} ডিপোজিট রিকোয়েস্ট মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন রিকোয়েস্ট করুন।`,
      created_at: new Date().toISOString()
    }));

    await supabase.from('notifications').insert(notifications);

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
