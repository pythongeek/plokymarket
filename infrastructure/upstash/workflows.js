// Upstash Workflow Automation for USDT Management System
// Replaces n8n with Upstash-based message queues and scheduled tasks

import { UpstashRedis } from '@upstash/redis';
import { UpstashWorkflow } from '@upstash/workflow';

// Initialize Upstash services
const redis = new UpstashRedis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const workflow = new UpstashWorkflow({
  redis,
  baseUrl: process.env.UPSTASH_WORKFLOW_BASE_URL,
});

// 1. Deposit Notification Workflow
export const depositNotificationWorkflow = async (payload) => {
  try {
    const { userId, bdtAmount, mfsProvider, txnId } = payload;
    
    // Step 1: Get user profile
    const userProfile = await redis.hgetall(`user:${userId}`);
    
    // Step 2: Format notification message (Bangla)
    const date = new Date().toLocaleString('bn-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const usdtAmount = (bdtAmount / 100).toFixed(2); // Default exchange rate
    const message = `🚨 নতুন ডিপোজিট রিকোয়েস্ট!

ইউজার: ${userProfile.email || userId}
পরিমাণ: ৳${bdtAmount.toLocaleString('bn-BD')} → ${usdtAmount} USDT
MFS: ${mfsProvider}
TxnID: ${txnId}
সময়: ${date}

ভেরিফাই করতে: ${process.env.ADMIN_URL}/deposits`;

    // Step 3: Send notifications in parallel
    const notificationPromises = [
      // Telegram notification
      sendTelegramNotification(message),
      
      // Email notification
      sendEmailNotification({
        to: process.env.ADMIN_EMAIL,
        subject: 'নতুন ডিপোজিট রিকোয়েস্ট',
        text: message
      }),
      
      // Save to database
      saveNotification({
        userId,
        type: 'admin_alert',
        title: 'New Deposit Request',
        message,
        createdAt: new Date().toISOString()
      })
    ];

    await Promise.all(notificationPromises);
    
    return { success: true, message: 'Notifications sent successfully' };
    
  } catch (error) {
    console.error('Deposit notification workflow failed:', error);
    throw error;
  }
};

// 2. Auto-Verification Workflow (Future Enhancement)
export const autoVerificationWorkflow = async () => {
  try {
    // Get pending deposits older than 10 minutes
    const pendingDeposits = await redis.zrange(
      'deposits:pending',
      0,
      Date.now() - (10 * 60 * 1000), // 10 minutes ago
      { byScore: true }
    );

    const verificationPromises = pendingDeposits.map(async (depositId) => {
      const deposit = await redis.hgetall(`deposit:${depositId}`);
      
      if (deposit.auto_verification_attempted === 'true') {
        return; // Skip if already attempted
      }

      // Update attempt status
      await redis.hset(`deposit:${depositId}`, {
        auto_verification_attempted: 'true',
        updated_at: new Date().toISOString()
      });

      // Check MFS status (bKash API integration)
      const verificationResult = await checkMfsTransactionStatus(
        deposit.mfs_provider,
        deposit.txn_id
      );

      if (verificationResult.status === 'completed') {
        // Auto-verify deposit
        await verifyDepositAutomatically(depositId, deposit.userId, deposit.usdt_amount);
      } else {
        // Move to manual queue
        await redis.zadd('deposits:manual_queue', {
          score: Date.now(),
          member: depositId
        });
      }
    });

    await Promise.all(verificationPromises);
    
    return { success: true, processed: pendingDeposits.length };
    
  } catch (error) {
    console.error('Auto-verification workflow failed:', error);
    throw error;
  }
};

// 3. Withdrawal Processing Workflow
export const withdrawalProcessingWorkflow = async (payload) => {
  try {
    const { withdrawalId, userId, amount, mfsProvider, recipientNumber } = payload;
    
    // Step 1: Check user balance
    const userBalance = await redis.hget(`user:${userId}`, 'balance');
    
    if (parseFloat(userBalance) < amount) {
      // Reject withdrawal
      await updateWithdrawalStatus(withdrawalId, 'rejected', 'Insufficient balance');
      await sendUserNotification(userId, 'Withdrawal Rejected', 
        `Your withdrawal of ${amount} USDT was rejected due to insufficient balance.`);
      return { success: false, reason: 'insufficient_balance' };
    }

    // Step 2: Create balance hold
    const holdId = await createBalanceHold(userId, amount, withdrawalId);
    
    // Step 3: Update withdrawal status to processing
    await updateWithdrawalStatus(withdrawalId, 'processing', null, holdId);
    
    // Step 4: Notify admin for manual BDT transfer
    const message = `💸 নতুন উইথড্র রিকোয়েস্ট!

ইউজার: ${userId}
পরিমাণ: ${amount} USDT → ৳${(amount * 100).toFixed(2)}
MFS: ${mfsProvider}
রিসিপিয়েন্ট: ${recipientNumber}
হোল্ড ID: ${holdId}

অনুমোদন করুন: ${process.env.ADMIN_URL}/withdrawals/${withdrawalId}`;

    await sendAdminNotification(message);
    
    return { success: true, holdId, message: 'Withdrawal processing started' };
    
  } catch (error) {
    console.error('Withdrawal processing workflow failed:', error);
    throw error;
  }
};

// 4. Daily Report Workflow
export const dailyReportWorkflow = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get statistics
    const stats = {
      totalUsers: await redis.scard('users:active'),
      totalDeposits: await redis.get(`stats:deposits:${today}`) || 0,
      totalWithdrawals: await redis.get(`stats:withdrawals:${today}`) || 0,
      totalVolume: await redis.get(`stats:volume:${today}`) || 0,
      pendingDeposits: await redis.zcard('deposits:pending'),
      pendingWithdrawals: await redis.zcard('withdrawals:pending')
    };
    
    const report = `
📊 দৈনিক রিপোর্ট - ${today}

📈 সক্রিয় ইউজার: ${stats.totalUsers}
💰 মোট ডিপোজিট: ৳${stats.totalDeposits.toLocaleString('bn-BD')}
💸 মোট উইথড্র: ৳${stats.totalWithdrawals.toLocaleString('bn-BD')}
💵 মোট ভলিউম: ৳${stats.totalVolume.toLocaleString('bn-BD')}
⏳ পেন্ডিং ডিপোজিট: ${stats.pendingDeposits}
⏳ পেন্ডিং উইথড্র: ${stats.pendingWithdrawals}

সুরক্ষিত অপারেশন!
    `;
    
    // Send to admin
    await sendEmailNotification({
      to: process.env.ADMIN_EMAIL,
      subject: `দৈনিক রিপোর্ট - ${today}`,
      text: report
    });
    
    return { success: true, report };
    
  } catch (error) {
    console.error('Daily report workflow failed:', error);
    throw error;
  }
};

// Helper functions
async function sendTelegramNotification(message) {
  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });
}

async function sendEmailNotification({ to, subject, text }) {
  // Use your preferred email service (SendGrid, AWS SES, etc.)
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.FROM_EMAIL },
      subject,
      content: [{ type: 'text/plain', value: text }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Email sending failed: ${response.statusText}`);
  }
}

async function saveNotification(notification) {
  await redis.hset(`notification:${notification.id}`, notification);
  await redis.zadd(`notifications:user:${notification.userId}`, {
    score: Date.now(),
    member: notification.id
  });
}

async function checkMfsTransactionStatus(provider, txnId) {
  // Placeholder for MFS API integration
  // This would integrate with bKash, Nagad, Rocket APIs
  return { status: 'pending' };
}

async function verifyDepositAutomatically(depositId, userId, amount) {
  // Call Supabase function to verify deposit
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/verify_and_credit_deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      p_deposit_id: depositId,
      p_user_id: userId,
      p_usdt_amount: amount,
      p_admin_notes: 'Auto-verified via workflow'
    })
  });
  
  if (!response.ok) {
    throw new Error('Auto-verification failed');
  }
}

async function createBalanceHold(userId, amount, withdrawalId) {
  const holdId = `hold:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  
  await redis.hset(`hold:${holdId}`, {
    userId,
    amount,
    reason: 'withdrawal',
    referenceId: withdrawalId,
    createdAt: new Date().toISOString()
  });
  
  // Deduct from user balance
  await redis.hincrbyfloat(`user:${userId}`, 'balance', -amount);
  
  return holdId;
}

async function updateWithdrawalStatus(withdrawalId, status, reason, holdId = null) {
  const updateData = {
    status,
    updatedAt: new Date().toISOString()
  };
  
  if (reason) updateData.adminNotes = reason;
  if (holdId) updateData.balanceHoldId = holdId;
  
  await redis.hset(`withdrawal:${withdrawalId}`, updateData);
}

async function sendAdminNotification(message) {
  await sendTelegramNotification(message);
  await sendEmailNotification({
    to: process.env.ADMIN_EMAIL,
    subject: 'নতুন উইথড্র রিকোয়েস্ট',
    text: message
  });
}

async function sendUserNotification(userId, title, message) {
  // Send in-app notification
  await saveNotification({
    id: `notif:${Date.now()}`,
    userId,
    type: 'user_notification',
    title,
    message,
    createdAt: new Date().toISOString()
  });
  
  // Send email notification
  const userProfile = await redis.hgetall(`user:${userId}`);
  if (userProfile.email) {
    await sendEmailNotification({
      to: userProfile.email,
      subject: title,
      text: message
    });
  }
}

// Scheduled tasks setup
export const setupScheduledTasks = () => {
  // Auto-verification every 5 minutes
  setInterval(async () => {
    try {
      await autoVerificationWorkflow();
    } catch (error) {
      console.error('Scheduled auto-verification failed:', error);
    }
  }, 5 * 60 * 1000);

  // Daily report at 9 AM Bangladesh time
  setInterval(async () => {
    const now = new Date();
    const bangladeshTime = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // UTC+6
    if (bangladeshTime.getHours() === 9 && bangladeshTime.getMinutes() === 0) {
      try {
        await dailyReportWorkflow();
      } catch (error) {
        console.error('Scheduled daily report failed:', error);
      }
    }
  }, 60 * 1000); // Check every minute
};

export default {
  depositNotificationWorkflow,
  autoVerificationWorkflow,
  withdrawalProcessingWorkflow,
  dailyReportWorkflow,
  setupScheduledTasks
};