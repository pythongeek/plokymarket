/**
 * Deposit Notification Workflow
 * Triggered when a new deposit request is submitted
 * Sends notifications to admin and logs the workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  verifyQStashSignature, 
  banglaTemplates,
  createWorkflowExecution,
  updateWorkflowStatus,
  logWorkflowStep,
  formatBanglaDate 
} from '@/lib/upstash/workflows';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase with service role
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

interface DepositWorkflowPayload {
  workflowType: 'deposit_notification';
  payload: {
    depositId: string;
    userId: string;
    bdtAmount: number;
    usdtAmount: number;
    mfsProvider: string;
    txnId: string;
    senderNumber: string;
    senderName?: string;
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
    
    const data: DepositWorkflowPayload = JSON.parse(body);
    const { payload } = data;
    
    // Create workflow execution record
    executionId = await createWorkflowExecution('deposit_notification', payload);
    if (executionId) {
      await updateWorkflowStatus(executionId, 'running');
    }
    
    const supabase = getSupabase();
    
    // Step 1: Get user details
    await logWorkflowStep(executionId!, 'fetch_user', 'started');
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', payload.userId)
      .single();
    
    if (userError) {
      await logWorkflowStep(executionId!, 'fetch_user', 'failed', {}, userError.message);
      throw userError;
    }
    await logWorkflowStep(executionId!, 'fetch_user', 'completed', { userEmail: userData?.email });
    
    // Step 2: Get admin users for notification
    await logWorkflowStep(executionId!, 'fetch_admins', 'started');
    const { data: admins, error: adminError } = await supabase
      .from('admin_roles')
      .select('user_id, role');
    
    if (adminError) {
      await logWorkflowStep(executionId!, 'fetch_admins', 'failed', {}, adminError.message);
      throw adminError;
    }
    await logWorkflowStep(executionId!, 'fetch_admins', 'completed', { adminCount: admins?.length || 0 });
    
    // Step 3: Send notifications in parallel
    await logWorkflowStep(executionId!, 'send_notifications', 'started');
    
    const notificationPromises: Promise<unknown>[] = [];
    
    // Create notification message in Bangla
    const date = formatBanglaDate(new Date());
    const message = `🚨 নতুন ডিপোজিট রিকোয়েস্ট!

ইউজার: ${userData?.email || payload.userId}
নাম: ${userData?.full_name || 'N/A'}
পরিমাণ: ৳${payload.bdtAmount.toLocaleString('bn-BD')} → ${payload.usdtAmount} USDT
MFS: ${payload.mfsProvider}
TxnID: ${payload.txnId}
প্রেরক: ${payload.senderNumber}
সময়: ${date}

ভেরিফাই করতে: ${process.env.NEXT_PUBLIC_APP_URL}/admin/deposits`;
    
    // Save notification to database for each admin
    for (const admin of admins || []) {
      notificationPromises.push(
        supabase.from('notifications').insert({
          user_id: admin.user_id,
          type: 'admin_deposit_alert',
          title: 'নতুন ডিপোজিট রিকোয়েস্ট',
          message: message,
          metadata: {
            deposit_id: payload.depositId,
            user_id: payload.userId,
            amount: payload.bdtAmount,
            mfs_provider: payload.mfsProvider,
          },
        })
      );
    }
    
    // Send Telegram notification if configured
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      notificationPromises.push(
        fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        })
      );
    }
    
    // Send email notification
    if (process.env.ADMIN_EMAIL) {
      notificationPromises.push(
        sendEmailNotification({
          to: process.env.ADMIN_EMAIL,
          subject: 'নতুন ডিপোজিট রিকোয়েস্ট - Plokymarket',
          text: message,
        })
      );
    }
    
    await Promise.allSettled(notificationPromises);
    await logWorkflowStep(executionId!, 'send_notifications', 'completed', { 
      notificationCount: notificationPromises.length 
    });
    
    // Step 4: Update deposit request with notification sent status
    await logWorkflowStep(executionId!, 'update_deposit', 'started');
    await supabase
      .from('deposit_requests')
      .update({
        admin_notified: true,
        notification_sent_at: new Date().toISOString(),
      })
      .eq('id', payload.depositId);
    await logWorkflowStep(executionId!, 'update_deposit', 'completed');
    
    // Mark workflow as completed
    const duration = Date.now() - startTime;
    if (executionId) {
      await updateWorkflowStatus(executionId, 'completed');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Deposit notification workflow completed',
      executionId,
      duration: `${duration}ms`,
      notificationsSent: notificationPromises.length,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Deposit workflow error:', error);
    
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

/**
 * Send email notification
 */
async function sendEmailNotification({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  // Implement your email provider here (Resend, SendGrid, etc.)
  // For now, just log it
  console.log('Email notification:', { to, subject, text: text.substring(0, 100) + '...' });
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    workflow: 'deposit_notification',
    timestamp: new Date().toISOString(),
  });
}
