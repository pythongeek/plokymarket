/**
 * Daily Report Workflow
 * Runs every day at 1:30 AM Bangladesh time (via cron-job.org)
 * Generates and sends daily statistics to admins
 * 
 * Authentication: Supports both QStash and cron-job.org
 * - QStash: Uses 'upstash-signature' header
 * - cron-job.org: Uses 'x-cron-secret' header
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
import { verifyCronSecret } from '@/lib/cron/workflows';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase admin client is managed via createServiceClient

interface DailyReportPayload {
  workflowType: 'daily_report';
  timestamp: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let executionId: string | null = null;

  try {
    // Verify cron-job.org secret or QStash signature
    const cronSecret = request.headers.get('x-cron-secret') || '';
    const qstashSignature = request.headers.get('upstash-signature') || '';
    const body = await request.text();

    // Support both cron-job.org and QStash
    const isValidCron = verifyCronSecret(cronSecret);
    const isValidQStash = verifyQStashSignature(qstashSignature, body);

    if (!isValidCron && !isValidQStash) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const data: DailyReportPayload = body ? JSON.parse(body) : {
      workflowType: 'daily_report',
      timestamp: new Date().toISOString()
    };

    // Create workflow execution record
    executionId = await createWorkflowExecution('daily_report', { date: new Date().toISOString() });
    if (executionId) {
      await updateWorkflowStatus(executionId, 'running');
    }

    const supabase = await createServiceClient();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Step 1: Get user statistics
    await logWorkflowStep(executionId!, 'fetch_user_stats', 'started');
    const { data: userStats, error: userError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' });

    if (userError) {
      await logWorkflowStep(executionId!, 'fetch_user_stats', 'failed', {}, userError.message);
      throw userError;
    }

    const totalUsers = userStats?.length || 0;

    // Get new users today
    const { count: newUsersToday, error: newUserError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    if (newUserError) {
      console.error('Error fetching new users:', newUserError);
    }
    await logWorkflowStep(executionId!, 'fetch_user_stats', 'completed', { totalUsers, newUsersToday });

    // Step 2: Get deposit statistics
    await logWorkflowStep(executionId!, 'fetch_deposit_stats', 'started');
    const { data: depositStats, error: depositError } = await supabase
      .from('deposit_requests')
      .select('bdt_amount, status')
      .gte('created_at', today);

    if (depositError) {
      await logWorkflowStep(executionId!, 'fetch_deposit_stats', 'failed', {}, depositError.message);
      throw depositError;
    }

    const todayDeposits = depositStats || [];
    const totalDepositAmount = todayDeposits
      .filter(d => d.status === 'verified' || d.status === 'completed')
      .reduce((sum, d) => sum + parseFloat(d.bdt_amount.toString()), 0);
    const pendingDeposits = todayDeposits.filter(d => d.status === 'pending').length;

    await logWorkflowStep(executionId!, 'fetch_deposit_stats', 'completed', {
      totalDepositAmount,
      pendingDeposits,
    });

    // Step 3: Get withdrawal statistics
    await logWorkflowStep(executionId!, 'fetch_withdrawal_stats', 'started');
    const { data: withdrawalStats, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('bdt_amount, status')
      .gte('created_at', today);

    if (withdrawalError) {
      await logWorkflowStep(executionId!, 'fetch_withdrawal_stats', 'failed', {}, withdrawalError.message);
      throw withdrawalError;
    }

    const todayWithdrawals = withdrawalStats || [];
    const totalWithdrawalAmount = todayWithdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + parseFloat(w.bdt_amount.toString()), 0);
    const pendingWithdrawals = todayWithdrawals.filter(w => w.status === 'pending' || w.status === 'processing').length;

    await logWorkflowStep(executionId!, 'fetch_withdrawal_stats', 'completed', {
      totalWithdrawalAmount,
      pendingWithdrawals,
    });

    // Step 4: Get transaction statistics
    await logWorkflowStep(executionId!, 'fetch_transaction_stats', 'started');
    const { data: transactionStats, error: transactionError } = await supabase
      .from('transactions')
      .select('amount, type')
      .gte('created_at', today);

    if (transactionError) {
      await logWorkflowStep(executionId!, 'fetch_transaction_stats', 'failed', {}, transactionError.message);
      throw transactionError;
    }

    const todayTransactions = transactionStats || [];
    const totalVolume = todayTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);
    const bonusGiven = todayTransactions
      .filter((t: any) => t.type === 'bonus')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);

    await logWorkflowStep(executionId!, 'fetch_transaction_stats', 'completed', { totalVolume, bonusGiven });

    // Step 5: Format report in Bangla
    await logWorkflowStep(executionId!, 'format_report', 'started');
    const date = formatBanglaDate(new Date());

    const report = `
📊 দৈনিক রিপোর্ট - ${date}

📈 ব্যবহারকারী:
   • মোট ইউজার: ${totalUsers.toLocaleString('bn-BD')}
   • নতুন আজ: ${(newUsersToday || 0).toLocaleString('bn-BD')}

💰 ডিপোজিট:
   • মোট: ৳${totalDepositAmount.toLocaleString('bn-BD')}
   • পেন্ডিং: ${pendingDeposits.toLocaleString('bn-BD')}

💸 উইথড্র:
   • মোট: ৳${totalWithdrawalAmount.toLocaleString('bn-BD')}
   • পেন্ডিং: ${pendingWithdrawals.toLocaleString('bn-BD')}

💵 ভলিউম:
   • মোট ট্রানজেকশন: ৳${totalVolume.toLocaleString('bn-BD')}
   • বোনাস দেওয়া: ${bonusGiven.toLocaleString('bn-BD')} USDT

⚖️ নেট পজিশন: ৳${(totalDepositAmount - totalWithdrawalAmount).toLocaleString('bn-BD')}

---
Plokymarket USDT Management System
`;
    await logWorkflowStep(executionId!, 'format_report', 'completed');

    // Step 6: Send to admins
    await logWorkflowStep(executionId!, 'send_report', 'started');

    const { data: admins, error: adminError } = await supabase
      .from('admin_roles')
      .select('user_id');

    if (adminError) {
      await logWorkflowStep(executionId!, 'send_report', 'failed', {}, adminError.message);
      throw adminError;
    }

    // Save report as notification
    const notificationPromises = (admins || []).map((admin: any) =>
      supabase.from('notifications').insert({
        user_id: admin.user_id,
        type: 'admin_daily_report',
        title: `দৈনিক রিপোর্ট - ${new Date().toLocaleDateString('bn-BD')}`,
        message: report,
        metadata: {
          report_date: today,
          total_users: totalUsers,
          new_users: newUsersToday,
          deposit_amount: totalDepositAmount,
          withdrawal_amount: totalWithdrawalAmount,
          net_position: totalDepositAmount - totalWithdrawalAmount,
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
          text: report,
          parse_mode: 'HTML',
        }),
      });
      (notificationPromises as any[]).push(telegramPromise);
    }

    await Promise.allSettled(notificationPromises);
    await logWorkflowStep(executionId!, 'send_report', 'completed', {
      notificationCount: notificationPromises.length,
    });

    // Mark workflow as completed
    const duration = Date.now() - startTime;
    if (executionId) {
      await updateWorkflowStatus(executionId, 'completed');
    }

    return NextResponse.json({
      success: true,
      message: 'Daily report generated and sent',
      executionId,
      duration: `${duration}ms`,
      stats: {
        totalUsers,
        newUsersToday: newUsersToday || 0,
        totalDepositAmount,
        totalWithdrawalAmount,
        pendingDeposits,
        pendingWithdrawals,
        totalVolume,
        bonusGiven,
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Daily report workflow error:', error);

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

export const GET = POST;
