// @ts-nocheck
/**
 * Withdrawal Processing Workflow
 * Triggered when a withdrawal request is submitted
 * Validates balance, creates hold, and notifies admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  verifyQStashSignature,
  createWorkflowExecution,
  updateWorkflowStatus,
  logWorkflowStep,
  formatBanglaDate
} from '@/lib/upstash/workflows';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase admin client is managed via createServiceClient

interface WithdrawalWorkflowPayload {
  workflowType: 'withdrawal_processing';
  payload: {
    withdrawalId: string;
    userId: string;
    usdtAmount: number;
    bdtAmount: number;
    mfsProvider: string;
    recipientNumber: string;
    recipientName?: string;
  };
  timestamp: string;
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

    const data: WithdrawalWorkflowPayload = JSON.parse(body);
    const { payload } = data;

    // Create workflow execution record
    executionId = await createWorkflowExecution('withdrawal_processing', payload);
    if (executionId) {
      await updateWorkflowStatus(executionId, 'running');
    }

    const supabase = await createServiceClient();

    // Step 1: Check user balance
    await logWorkflowStep(executionId!, 'check_balance', 'started');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, email, full_name')
      .eq('id', payload.userId)
      .single();

    if (profileError) {
      await logWorkflowStep(executionId!, 'check_balance', 'failed', {}, profileError.message);
      throw profileError;
    }

    if (!profile || parseFloat(profile.balance.toString()) < payload.usdtAmount) {
      await logWorkflowStep(executionId!, 'check_balance', 'failed', {}, 'Insufficient balance');

      // Reject withdrawal
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          admin_notes: 'অপর্যাপ্ত ব্যালেন্স (Insufficient balance)',
          processed_at: new Date().toISOString(),
        })
        .eq('id', payload.withdrawalId);

      // Notify user
      await supabase.from('notifications').insert({
        user_id: payload.userId,
        type: 'withdrawal_rejected',
        title: 'উইথড্র বাতিল হয়েছে',
        message: `আপনার ৳${payload.bdtAmount} উইথড্র রিকোয়েস্ট অপর্যাপ্ত ব্যালেন্সের কারণে বাতিল হয়েছে।`,
      });

      await updateWorkflowStatus(executionId!, 'completed');

      return NextResponse.json({
        success: false,
        reason: 'insufficient_balance',
        executionId,
      });
    }

    await logWorkflowStep(executionId!, 'check_balance', 'completed', {
      currentBalance: profile.balance
    });

    // Step 2: Create balance hold
    await logWorkflowStep(executionId!, 'create_hold', 'started');
    const { data: hold, error: holdError } = await supabase
      .from('balance_holds')
      .insert({
        user_id: payload.userId,
        amount: payload.usdtAmount,
        reason: 'withdrawal',
        reference_id: payload.withdrawalId,
      })
      .select()
      .single();

    if (holdError) {
      await logWorkflowStep(executionId!, 'create_hold', 'failed', {}, holdError.message);
      throw holdError;
    }
    await logWorkflowStep(executionId!, 'create_hold', 'completed', { holdId: hold?.id });

    // Step 3: Deduct balance
    await logWorkflowStep(executionId!, 'deduct_balance', 'started');
    const { error: deductError } = await supabase.rpc('hold_balance_for_withdrawal', {
      p_user_id: payload.userId,
      p_amount: payload.usdtAmount,
    });

    if (deductError) {
      await logWorkflowStep(executionId!, 'deduct_balance', 'failed', {}, deductError.message);
      throw deductError;
    }
    await logWorkflowStep(executionId!, 'deduct_balance', 'completed');

    // Step 4: Update withdrawal status
    await logWorkflowStep(executionId!, 'update_withdrawal', 'started');
    await supabase
      .from('withdrawal_requests')
      .update({
        status: 'processing',
        balance_hold_id: hold?.id,
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', payload.withdrawalId);
    await logWorkflowStep(executionId!, 'update_withdrawal', 'completed');

    // Step 5: Notify admin
    await logWorkflowStep(executionId!, 'notify_admin', 'started');

    const date = formatBanglaDate(new Date());
    const adminMessage = `💸 নতুন উইথড্র রিকোয়েস্ট!

ইউজার: ${profile.email || payload.userId}
নাম: ${profile.full_name || 'N/A'}
পরিমাণ: ${payload.usdtAmount} USDT → ৳${payload.bdtAmount.toLocaleString('bn-BD')}
MFS: ${payload.mfsProvider}
রিসিপিয়েন্ট: ${payload.recipientNumber}
হোল্ড ID: ${hold?.id}
সময়: ${date}

অনুমোদন করুন: ${process.env.NEXT_PUBLIC_APP_URL}/admin/withdrawals/${payload.withdrawalId}`;

    // Get admins
    const { data: admins } = await supabase
      .from('admin_roles')
      .select('user_id');

    // Send notifications
    const notificationPromises = (admins || []).map((admin: any) =>
      supabase.from('notifications').insert({
        user_id: admin.user_id,
        type: 'admin_withdrawal_alert',
        title: 'নতুন উইথড্র রিকোয়েস্ট',
        message: adminMessage,
        metadata: {
          withdrawal_id: payload.withdrawalId,
          user_id: payload.userId,
          amount: payload.usdtAmount,
          hold_id: hold?.id,
        },
      })
    );

    // Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const telegramPromise = fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: adminMessage,
          parse_mode: 'HTML',
        }),
      });
      (notificationPromises as any[]).push(telegramPromise);
    }

    await Promise.allSettled(notificationPromises);
    await logWorkflowStep(executionId!, 'notify_admin', 'completed', {
      notificationCount: notificationPromises.length,
    });

    // Step 6: Notify user
    await supabase.from('notifications').insert({
      user_id: payload.userId,
      type: 'withdrawal_processing',
      title: 'উইথড্র প্রক্রিয়াধীন',
      message: `আপনার ৳${payload.bdtAmount} উইথড্র রিকোয়েস্ট প্রক্রিয়াধীন। অনুমোদনের পর BDT পাঠানো হবে।`,
    });

    // Mark workflow as completed
    const duration = Date.now() - startTime;
    if (executionId) {
      await updateWorkflowStatus(executionId, 'completed');
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal processing workflow completed',
      executionId,
      duration: `${duration}ms`,
      holdId: hold?.id,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Withdrawal workflow error:', error);

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
    workflow: 'withdrawal_processing',
    timestamp: new Date().toISOString(),
  });
}
