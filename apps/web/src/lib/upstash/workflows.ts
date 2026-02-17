/**
 * Upstash Workflow Utilities for USDT Management System
 * Replaces n8n with Upstash QStash for workflow automation
 * Bangladesh-focused with Bangla notifications
 */

import { Client as QStashClient } from '@upstash/qstash';

// Initialize QStash client
const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error('QSTASH_TOKEN not configured');
  }
  return new QStashClient({ token });
};

// Base URL for API routes
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
    'http://localhost:3000';
};

/**
 * Workflow Types
 */
export type WorkflowType = 
  | 'deposit_notification'
  | 'withdrawal_processing'
  | 'daily_report'
  | 'auto_verification'
  | 'exchange_rate_update';

/**
 * Deposit Notification Payload
 */
export interface DepositNotificationPayload {
  depositId: string;
  userId: string;
  bdtAmount: number;
  usdtAmount: number;
  mfsProvider: 'bkash' | 'nagad' | 'rocket' | 'upay';
  txnId: string;
  senderNumber: string;
  senderName?: string;
}

/**
 * Withdrawal Processing Payload
 */
export interface WithdrawalProcessingPayload {
  withdrawalId: string;
  userId: string;
  usdtAmount: number;
  bdtAmount: number;
  mfsProvider: 'bkash' | 'nagad' | 'rocket' | 'upay';
  recipientNumber: string;
  recipientName?: string;
}

/**
 * Trigger deposit notification workflow
 */
export async function triggerDepositNotification(
  payload: DepositNotificationPayload
): Promise<{ messageId: string; workflowExecutionId?: string }> {
  const client = getQStashClient();
  const baseUrl = getBaseUrl();
  
  const response = await client.publishJSON({
    url: `${baseUrl}/api/workflows/deposit`,
    body: {
      workflowType: 'deposit_notification',
      payload,
      timestamp: new Date().toISOString(),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return { messageId: response.messageId };
}

/**
 * Trigger withdrawal processing workflow
 */
export async function triggerWithdrawalProcessing(
  payload: WithdrawalProcessingPayload
): Promise<{ messageId: string }> {
  const client = getQStashClient();
  const baseUrl = getBaseUrl();
  
  const response = await client.publishJSON({
    url: `${baseUrl}/api/workflows/withdrawal`,
    body: {
      workflowType: 'withdrawal_processing',
      payload,
      timestamp: new Date().toISOString(),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return { messageId: response.messageId };
}

/**
 * Schedule daily report workflow
 */
export async function scheduleDailyReport(): Promise<void> {
  const client = getQStashClient();
  const baseUrl = getBaseUrl();
  
  await client.schedules.create({
    destination: `${baseUrl}/api/workflows/daily-report`,
    cron: '0 9 * * *', // Every day at 9 AM
    timezone: 'Asia/Dhaka',
    retries: 3,
  });
}

/**
 * Schedule exchange rate update
 */
export async function scheduleExchangeRateUpdate(): Promise<void> {
  const client = getQStashClient();
  const baseUrl = getBaseUrl();
  
  await client.schedules.create({
    destination: `${baseUrl}/api/workflows/exchange-rate`,
    cron: '*/5 * * * *', // Every 5 minutes
    retries: 3,
  });
}

/**
 * Schedule auto-verification check
 */
export async function scheduleAutoVerification(): Promise<void> {
  const client = getQStashClient();
  const baseUrl = getBaseUrl();
  
  await client.schedules.create({
    destination: `${baseUrl}/api/workflows/auto-verify`,
    cron: '*/10 * * * *', // Every 10 minutes
    retries: 3,
  });
}

/**
 * Verify QStash webhook signature
 */
export function verifyQStashSignature(
  signature: string,
  body: string
): boolean {
  // In production, implement proper signature verification
  // using QStash signing keys
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!signingKey) {
    console.warn('QSTASH_CURRENT_SIGNING_KEY not set, skipping verification');
    return true;
  }
  
  // TODO: Implement proper signature verification
  // For now, return true for development
  return true;
}

/**
 * Format Bangla currency
 */
export function formatBanglaCurrency(amount: number, currency: 'BDT' | 'USDT'): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const amountStr = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const banglaAmount = amountStr
    .split('')
    .map(char => {
      if (char >= '0' && char <= '9') {
        return banglaDigits[parseInt(char)];
      }
      return char;
    })
    .join('');
  
  const symbol = currency === 'BDT' ? '৳' : 'USDT';
  return `${symbol} ${banglaAmount}`;
}

/**
 * Format Bangla date
 */
export function formatBanglaDate(date: Date): string {
  return date.toLocaleString('bn-BD', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Bangla notification templates
 */
export const banglaTemplates = {
  depositReceived: (amount: number, provider: string) => 
    `✅ নতুন ডিপোজিট রিকোয়েস্ট!\n\nপরিমাণ: ${formatBanglaCurrency(amount, 'BDT')}\nMFS: ${provider}\n\nভেরিফাই করতে অ্যাডমিন প্যানেলে লগইন করুন।`,
  
  depositVerified: (amount: number) => 
    `🎉 আপনার ডিপোজিট সম্পন্ন হয়েছে!\n\n${formatBanglaCurrency(amount, 'USDT')} ক্রেডিট করা হয়েছে আপনার ওয়ালেটে।`,
  
  withdrawalRequested: (amount: number) => 
    `⏳ উইথড্র রিকোয়েস্ট গ্রহণ করা হয়েছে।\n\nপরিমাণ: ${formatBanglaCurrency(amount, 'USDT')}\n\nপ্রক্রিয়াকরণের জন্য অপেক্ষা করুন।`,
  
  withdrawalProcessed: (amount: number) => 
    `✅ উইথড্র সম্পন্ন!\n\n${formatBanglaCurrency(amount, 'BDT')} আপনার অ্যাকাউন্টে পাঠানো হয়েছে।`,
  
  dailyReport: (stats: { users: number; deposits: number; withdrawals: number }) => 
    `📊 দৈনিক রিপোর্ট - ${formatBanglaDate(new Date())}\n\n👥 সক্রিয় ইউজার: ${stats.users}\n💰 মোট ডিপোজিট: ${stats.deposits}\n💸 মোট উইথড্র: ${stats.withdrawals}`,
};

/**
 * Create workflow execution record in database
 */
export async function createWorkflowExecution(
  workflowType: WorkflowType,
  payload: Record<string, unknown>
): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('create_workflow_execution', {
      p_workflow_type: workflowType,
      p_payload: payload,
      p_max_retries: 3,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create workflow execution:', error);
    return null;
  }
}

/**
 * Update workflow execution status
 */
export async function updateWorkflowStatus(
  executionId: string,
  status: 'running' | 'completed' | 'failed' | 'retrying',
  errorMessage?: string
): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('update_workflow_status', {
      p_execution_id: executionId,
      p_status: status,
      p_error_message: errorMessage,
      p_increment_retry: status === 'retrying',
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update workflow status:', error);
    return false;
  }
}

/**
 * Log workflow step
 */
export async function logWorkflowStep(
  executionId: string,
  stepName: string,
  stepStatus: 'started' | 'completed' | 'failed',
  stepData?: Record<string, unknown>,
  errorDetails?: string
): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('log_workflow_step', {
      p_execution_id: executionId,
      p_step_name: stepName,
      p_step_status: stepStatus,
      p_step_data: stepData || {},
      p_error_details: errorDetails,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to log workflow step:', error);
    return null;
  }
}
