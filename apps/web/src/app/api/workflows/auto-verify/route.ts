/**
 * Auto-Verification Workflow
 * Runs every 10 minutes
 * Checks pending deposits and attempts auto-verification
 * Future: Integrate with bKash/Nagad APIs for automatic verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  verifyQStashSignature,
  createWorkflowExecution,
  updateWorkflowStatus,
  logWorkflowStep,
} from '@/lib/upstash/workflows';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase admin client is managed via createServiceClient

interface AutoVerifyPayload {
  workflowType: 'auto_verification';
  timestamp: string;
}

/**
 * Check MFS transaction status via API
 * Placeholder for future bKash/Nagad API integration
 */
async function checkMfsTransactionStatus(
  provider: string,
  txnId: string,
  senderNumber: string,
  amount: number
): Promise<{ verified: boolean; reason?: string }> {
  // This is a placeholder for actual MFS API integration
  // In production, you would integrate with:
  // - bKash API
  // - Nagad API  
  // - Rocket API

  // For now, return false to always use manual verification
  return { verified: false, reason: 'Auto-verification not configured' };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let executionId: string | null = null;

  try {
    // Verify QStash signature
    const signature = request.headers.get('upstash-signature') || '';
    const body = await request.text();

    if (!verifyQStashSignature(signature, body)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const data: AutoVerifyPayload = JSON.parse(body);

    // Create workflow execution record
    executionId = await createWorkflowExecution('auto_verification', { timestamp: data.timestamp });
    if (executionId) {
      await updateWorkflowStatus(executionId, 'running');
    }

    const supabase = await createServiceClient();

    // Step 1: Get pending deposits older than 10 minutes
    await logWorkflowStep(executionId!, 'fetch_pending', 'started');
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: pendingDeposits, error: fetchError } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('status', 'pending')
      .eq('auto_verification_attempted', false)
      .lt('created_at', tenMinutesAgo)
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      await logWorkflowStep(executionId!, 'fetch_pending', 'failed', {}, fetchError.message);
      throw fetchError;
    }

    const deposits = pendingDeposits || [];
    await logWorkflowStep(executionId!, 'fetch_pending', 'completed', {
      count: deposits.length
    });

    if (deposits.length === 0) {
      await updateWorkflowStatus(executionId!, 'completed');
      return NextResponse.json({
        success: true,
        message: 'No pending deposits to verify',
        executionId,
        processed: 0,
        autoVerified: 0,
      });
    }

    // Step 2: Process each deposit
    await logWorkflowStep(executionId!, 'process_deposits', 'started');

    let autoVerified = 0;
    let manualQueue = 0;
    let failed = 0;

    for (const deposit of deposits) {
      try {
        // Mark as attempted
        await supabase
          .from('deposit_requests')
          .update({
            auto_verification_attempted: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', deposit.id);

        // Check MFS status (placeholder)
        const verificationResult = await checkMfsTransactionStatus(
          deposit.mfs_provider,
          deposit.txn_id,
          deposit.sender_number,
          parseFloat(deposit.bdt_amount.toString())
        );

        if (verificationResult.verified) {
          // Auto-verify the deposit
          const { error: verifyError } = await supabase.rpc('verify_and_credit_deposit', {
            p_deposit_id: deposit.id,
            p_user_id: deposit.user_id,
            p_usdt_amount: parseFloat(deposit.usdt_amount.toString()),
            p_admin_notes: 'Auto-verified by system',
          });

          if (!verifyError) {
            autoVerified++;

            // Update with auto-approved status
            await supabase
              .from('deposit_requests')
              .update({
                status: 'auto_approved',
                auto_verification_result: {
                  verified: true,
                  verified_at: new Date().toISOString(),
                },
              })
              .eq('id', deposit.id);

            // Notify user
            await supabase.from('notifications').insert({
              user_id: deposit.user_id,
              type: 'deposit_auto_verified',
              title: 'ডিপোজিট অটো-ভেরিফাইড',
              message: `আপনার ৳${deposit.bdt_amount} ডিপোজিট স্বয়ংক্রিয়ভাবে ভেরিফাই হয়েছে। ${deposit.usdt_amount} USDT ক্রেডিট করা হয়েছে।`,
            });
          } else {
            failed++;
          }
        } else {
          // Move to manual queue
          manualQueue++;

          await supabase
            .from('deposit_requests')
            .update({
              status: 'under_review',
              auto_verification_result: {
                verified: false,
                reason: verificationResult.reason,
                attempted_at: new Date().toISOString(),
              },
            })
            .eq('id', deposit.id);
        }
      } catch (error) {
        console.error(`Error processing deposit ${deposit.id}:`, error);
        failed++;
      }
    }

    await logWorkflowStep(executionId!, 'process_deposits', 'completed', {
      autoVerified,
      manualQueue,
      failed,
    });

    // Step 3: Send summary to admins if there are results
    if (autoVerified > 0 || manualQueue > 0) {
      await logWorkflowStep(executionId!, 'send_summary', 'started');

      const { data: admins } = await supabase
        .from('admin_roles')
        .select('user_id');

      const summaryMessage = `🔍 অটো-ভেরিফিকেশন সামারি

মোট চেক করা হয়েছে: ${deposits.length}
✅ অটো-ভেরিফাইড: ${autoVerified}
👁️ ম্যানুয়াল রিভিউতে পাঠানো: ${manualQueue}
❌ ব্যর্থ: ${failed}

সময়: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}`;

      for (const admin of admins || []) {
        await supabase.from('notifications').insert({
          user_id: admin.user_id,
          type: 'admin_auto_verify_summary',
          title: 'অটো-ভেরিফিকেশন সামারি',
          message: summaryMessage,
        });
      }

      await logWorkflowStep(executionId!, 'send_summary', 'completed');
    }

    // Mark workflow as completed
    const duration = Date.now() - startTime;
    if (executionId) {
      await updateWorkflowStatus(executionId, 'completed');
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-verification completed',
      executionId,
      duration: `${duration}ms`,
      stats: {
        processed: deposits.length,
        autoVerified,
        manualQueue,
        failed,
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Auto-verification workflow error:', error);

    if (executionId) {
      await updateWorkflowStatus(
        executionId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow failed',
        executionId,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    workflow: 'auto_verification',
    schedule: '*/10 * * * * (Every 10 minutes)',
    note: 'Placeholder for future bKash/Nagad API integration',
    timestamp: new Date().toISOString(),
  });
}
