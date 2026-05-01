#!/usr/bin/env node
/**
 * Alert Handler Script for Plokymarket
 * 
 * Manages alerting rules and sends notifications
 * 
 * Usage:
 *   node alert-handler.js --check              # Run alert checks
 *   node alert-handler.js --test               # Send test notification
 * 
 * Environment Variables:
 *   TELEGRAM_BOT_TOKEN    - Telegram bot token
 *   TELEGRAM_CHAT_ID     - Telegram chat ID
 *   KV_REST_API_URL      - Upstash Redis for alert state
 *   KV_REST_API_TOKEN    - Upstash Redis token
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, type = 'info') {
  const color = {
    info: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
    alert: colors.magenta
  }[type] || colors.reset;
  console.log(`${colors.cyan}[${new Date().toISOString()}]${color} ${message}${colors.reset}`);
}

// Alert rules configuration
const ALERT_RULES = [
  {
    id: 'disk_space_critical',
    name: 'Disk Space Critical',
    type: 'system',
    condition: 'disk_usage > 95',
    check: (metrics) => metrics.disk?.usagePercent > 95,
    severity: 'critical',
    message: 'Disk space usage is above 95%'
  },
  {
    id: 'disk_space_warning',
    name: 'Disk Space Warning',
    type: 'system',
    condition: 'disk_usage > 85',
    check: (metrics) => metrics.disk?.usagePercent > 85,
    severity: 'warning',
    message: 'Disk space usage is above 85%'
  },
  {
    id: 'memory_critical',
    name: 'Memory Critical',
    type: 'system',
    condition: 'memory_usage > 95',
    check: (metrics) => metrics.memory?.usagePercent > 95,
    severity: 'critical',
    message: 'Memory usage is above 95%'
  },
  {
    id: 'memory_warning',
    name: 'Memory Warning',
    type: 'system',
    condition: 'memory_usage > 85',
    check: (metrics) => metrics.memory?.usagePercent > 85,
    severity: 'warning',
    message: 'Memory usage is above 85%'
  },
  {
    id: 'cpu_load_warning',
    name: 'CPU Load Warning',
    type: 'system',
    condition: 'cpu_load_1m > 4',
    check: (metrics) => metrics.cpu?.load1 > 4,
    severity: 'warning',
    message: 'CPU load average is above 4'
  },
  {
    id: 'db_connection_warning',
    name: 'Database Connections Warning',
    type: 'database',
    condition: 'active_connections > 80',
    check: (metrics) => metrics.activeConnections > 80,
    severity: 'warning',
    message: 'Database has more than 80 active connections'
  },
  {
    id: 'db_size_warning',
    name: 'Database Size Warning',
    type: 'database',
    condition: 'db_size_mb > 10000',
    check: (metrics) => metrics.dbSizeMB > 10000,
    severity: 'warning',
    message: 'Database size is above 10GB'
  },
  {
    id: 'container_down',
    name: 'Container Down',
    type: 'application',
    condition: 'running_containers < expected',
    check: (metrics) => metrics.runningContainers < 2,
    severity: 'critical',
    message: 'Expected containers are not running'
  }
];

// Cooldown period to prevent alert spam (in milliseconds)
const ALERT_COOLDOWN = 30 * 60 * 1000; // 30 minutes
const KEY_PREFIX = 'plokymarket:alerts:';

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    check: args.includes('--check'),
    test: args.includes('--test'),
    list: args.includes('--list')
  };
}

async function getRecentMetrics(type, limit = 10) {
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  
  if (!redisUrl || !redisToken) {
    return null;
  }
  
  try {
    const listKey = `plokymarket:metrics:${type}:recent`;
    const result = await fetch(`${redisUrl}/lrange/${encodeURIComponent(listKey)}/${limit}/-1`, {
      headers: { 'Authorization': `Bearer ${redisToken}` }
    }).then(r => r.json());
    
    return (result.result || []).map(m => JSON.parse(m));
  } catch (error) {
    log(`Failed to get metrics: ${error.message}`, 'error');
    return null;
  }
}

async function getAlertState(alertId) {
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  
  if (!redisUrl || !redisToken) {
    return null;
  }
  
  try {
    const key = `${KEY_PREFIX}${alertId}`;
    const result = await fetch(`${redisUrl}/get/${encodeURIComponent(key)}`, {
      headers: { 'Authorization': `Bearer ${redisToken}` }
    }).then(r => r.json());
    
    return result.result;
  } catch (error) {
    return null;
  }
}

async function setAlertState(alertId, state) {
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  
  if (!redisUrl || !redisToken) {
    return;
  }
  
  try {
    const key = `${KEY_PREFIX}${alertId}`;
    await fetch(`${redisUrl}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });
    
    // Set expiry to 24 hours
    await fetch(`${redisUrl}/expire/${encodeURIComponent(key)}/86400`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`
      }
    });
  } catch (error) {
    log(`Failed to set alert state: ${error.message}`, 'error');
  }
}

async function sendTelegramAlert(alert, metrics) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    log('Telegram not configured, alert not sent', 'warning');
    return false;
  }
  
  const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
  
  let message = `${icon} <b>${alert.severity.toUpperCase()}: ${alert.name}</b>\n\n`;
  message += `📝 ${alert.message}\n`;
  message += `🆔 Alert ID: ${alert.id}\n`;
  
  if (metrics) {
    message += `\n📊 Current Metrics:\n`;
    
    if (metrics.disk) {
      message += `• Disk: ${metrics.disk.usagePercent}%\n`;
    }
    if (metrics.memory) {
      message += `• Memory: ${metrics.memory.usagePercent}%\n`;
    }
    if (metrics.cpu) {
      message += `• CPU Load: ${metrics.cpu.load1}\n`;
    }
    if (metrics.activeConnections !== undefined) {
      message += `• DB Connections: ${metrics.activeConnections}\n`;
    }
  }
  
  message += `\n⏰ Time: ${new Date().toISOString()}`;
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    return response.ok;
  } catch (error) {
    log(`Failed to send Telegram alert: ${error.message}`, 'error');
    return false;
  }
}

async function checkAlerts() {
  log('Running alert checks...', 'info');
  
  // Get recent metrics
  const [systemMetrics, dbMetrics, appMetrics] = await Promise.all([
    getRecentMetrics('system', 1),
    getRecentMetrics('database', 1),
    getRecentMetrics('application', 1)
  ]);
  
  const latestMetrics = {
    ...(systemMetrics?.[0] || {}),
    ...(dbMetrics?.[0] || {}),
    ...(appMetrics?.[0] || {})
  };
  
  const triggeredAlerts = [];
  
  for (const rule of ALERT_RULES) {
    try {
      const isTriggered = rule.check(latestMetrics);
      const currentState = await getAlertState(rule.id);
      
      if (isTriggered) {
        if (!currentState || Date.now() - currentState.lastTriggered > ALERT_COOLDOWN) {
          // Alert is triggered and not in cooldown
          log(`Alert triggered: ${rule.name} (${rule.severity})`, 'alert');
          
          const sent = await sendTelegramAlert(rule, latestMetrics);
          
          await setAlertState(rule.id, {
            triggered: true,
            lastTriggered: Date.now(),
            lastNotificationSent: sent ? Date.now() : null,
            notificationFailed: !sent
          });
          
          triggeredAlerts.push({ ...rule, sent });
        } else {
          log(`Alert in cooldown: ${rule.name}`, 'info');
        }
      } else {
        // Alert is not triggered, reset state if it was triggered before
        if (currentState?.triggered) {
          log(`Alert resolved: ${rule.name}`, 'success');
          await setAlertState(rule.id, {
            triggered: false,
            lastResolved: Date.now()
          });
        }
      }
    } catch (error) {
      log(`Error checking alert ${rule.id}: ${error.message}`, 'error');
    }
  }
  
  return triggeredAlerts;
}

async function sendTestNotification() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    log('Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID', 'error');
    return;
  }
  
  const message = `🧪 <b>Test Alert</b>\n\n` +
    `This is a test notification from Plokymarket Alert System.\n\n` +
    `⏰ Time: ${new Date().toISOString()}`;
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    if (response.ok) {
      log('Test notification sent successfully!', 'success');
    } else {
      log(`Failed to send test notification: HTTP ${response.status}`, 'error');
    }
  } catch (error) {
    log(`Failed to send test notification: ${error.message}`, 'error');
  }
}

function listAlertRules() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    Plokymarket Alert Rules                          ║');
  console.log('╠════════════════════════════════════════════════════════════════════╣');
  console.log('║ ID'.padEnd(30) + 'Name'.padEnd(25) + 'Severity'.padEnd(12) + 'Type');
  console.log('╟' + '─'.repeat(68) + '╢');
  
  for (const rule of ALERT_RULES) {
    console.log(
      '║ ' + 
      rule.id.padEnd(28) + ' ' +
      rule.name.padEnd(24) + ' ' +
      rule.severity.padEnd(11) + ' ' +
      rule.type
    );
  }
  
  console.log('╚' + '─'.repeat(68) + '╝\n');
  
  console.log('Cooldown Period: 30 minutes between repeated alerts\n');
}

async function main() {
  const options = parseArgs();
  
  if (options.list) {
    listAlertRules();
  } else if (options.test) {
    await sendTestNotification();
  } else if (options.check) {
    await checkAlerts();
  } else {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║             Plokymarket Alert Handler                               ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║  --check   Run alert checks                                        ║');
    console.log('║  --test    Send test notification                                  ║');
    console.log('║  --list    List all alert rules                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
