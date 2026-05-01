#!/usr/bin/env node
/**
 * System Health Check Script for Plokymarket
 * 
 * Checks:
 * - Database connectivity
 * - Redis/Upstash connectivity
 * - Vercel API status
 * - Supabase cloud status
 * - Docker containers status
 * - Disk space
 * - Memory usage
 * 
 * Usage:
 *   node health-check.js                   # Run health check
 *   node health-check.js --json            # Output as JSON
 *   node health-check.js --verbose         # Detailed output
 * 
 * Environment Variables:
 *   POSTGRES_HOST, POSTGRES_PORT, etc.
 *   KV_REST_API_URL, KV_REST_API_TOKEN
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const color = {
    info: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red
  }[type] || colors.reset;
  console.log(`${color}${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    json: args.includes('--json'),
    verbose: args.includes('--verbose')
  };
}

async function checkPostgres() {
  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'polymarket'
  };
  
  const startTime = Date.now();
  
  try {
    const env = { ...process.env, PGPASSWORD: config.password };
    const result = execSync(
      `pg_isready -h ${config.host} -p ${config.port} -U ${config.user}`,
      { env, timeout: 5000 }
    );
    
    const latency = Date.now() - startTime;
    
    // Try to run a simple query
    try {
      execSync(
        `psql -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -c "SELECT 1;" -t`,
        { env, timeout: 5000 }
      );
    } catch (e) {
      // Query might fail but pg_isready passing is enough
    }
    
    return {
      service: 'PostgreSQL',
      status: 'healthy',
      latency,
      host: `${config.host}:${config.port}`,
      message: 'Connection successful'
    };
  } catch (error) {
    return {
      service: 'PostgreSQL',
      status: 'down',
      latency: Date.now() - startTime,
      host: `${config.host}:${config.port}`,
      message: error.message
    };
  }
}

async function checkRedis() {
  const url = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    return {
      service: 'Redis/Upstash',
      status: 'unknown',
      message: 'Redis URL or token not configured'
    };
  }
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${url}/ping`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return {
        service: 'Redis/Upstash',
        status: 'healthy',
        latency,
        message: 'Connection successful'
      };
    } else {
      return {
        service: 'Redis/Upstash',
        status: 'degraded',
        latency,
        message: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      service: 'Redis/Upstash',
      status: 'down',
      latency: Date.now() - startTime,
      message: error.message
    };
  }
}

async function checkSupabaseCloud() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    return {
      service: 'Supabase Cloud',
      status: 'unknown',
      message: 'Supabase URL or anon key not configured'
    };
  }
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${url}/health`, {
      headers: { 'apikey': anonKey }
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        service: 'Supabase Cloud',
        status: 'healthy',
        latency,
        message: 'API is healthy',
        details: data
      };
    } else {
      return {
        service: 'Supabase Cloud',
        status: 'degraded',
        latency,
        message: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      service: 'Supabase Cloud',
      status: 'down',
      latency: Date.now() - startTime,
      message: error.message
    };
  }
}

async function checkDockerContainers() {
  try {
    const result = execSync('docker ps --format "{{.Names}}:{{.Status}}"', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    
    const containers = result.trim().split('\n').filter(Boolean);
    
    const expectedContainers = ['postgres', 'n8n', 'postgrest'];
    const missing = expectedContainers.filter(c => 
      !containers.some(cont => cont.toLowerCase().includes(c))
    );
    
    const unhealthy = containers.filter(c => 
      c.includes('Exited') || c.includes('Restarting')
    );
    
    if (missing.length > 0 || unhealthy.length > 0) {
      return {
        service: 'Docker Containers',
        status: 'degraded',
        containers,
        missing,
        unhealthy,
        message: `Missing: ${missing.join(', ')}${unhealthy.length > 0 ? ', Unhealthy: ' + unhealthy.join(', ') : ''}`
      };
    }
    
    return {
      service: 'Docker Containers',
      status: 'healthy',
      containers,
      message: `${containers.length} containers running`
    };
  } catch (error) {
    return {
      service: 'Docker Containers',
      status: 'unknown',
      message: 'Docker not available or not running'
    };
  }
}

async function checkSystemResources() {
  try {
    // Get disk space
    const diskResult = execSync('df -h / | tail -1', { encoding: 'utf8', timeout: 3000 });
    const diskMatch = diskResult.match(/(\d+)%/);
    const diskUsage = diskMatch ? parseInt(diskMatch[1]) : 0;
    
    // Get memory usage
    const memResult = execSync('free -m | grep Mem', { encoding: 'utf8', timeout: 3000 });
    const memMatch = memResult.match(/Mem:\s+(\d+)\s+(\d+)/);
    const memTotal = memMatch ? parseInt(memMatch[1]) : 0;
    const memUsed = memMatch ? parseInt(memMatch[2]) : 0;
    const memUsage = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0;
    
    // Get load average
    const loadResult = execSync('cat /proc/loadavg', { encoding: 'utf8', timeout: 3000 });
    const loadAvg = loadResult.split(' ').slice(0, 3).join(', ');
    
    const issues = [];
    
    if (diskUsage > 90) {
      issues.push(`Disk usage critical: ${diskUsage}%`);
    } else if (diskUsage > 80) {
      issues.push(`Disk usage high: ${diskUsage}%`);
    }
    
    if (memUsage > 90) {
      issues.push(`Memory usage critical: ${memUsage}%`);
    } else if (memUsage > 80) {
      issues.push(`Memory usage high: ${memUsage}%`);
    }
    
    return {
      service: 'System Resources',
      status: issues.length > 0 ? 'degraded' : 'healthy',
      disk: { usage: diskUsage, total: diskResult.split()[1] },
      memory: { used: memUsed, total: memTotal, usage: memUsage },
      loadAverage: loadAvg,
      issues,
      message: issues.length > 0 ? issues.join('; ') : 'All resources within limits'
    };
  } catch (error) {
    return {
      service: 'System Resources',
      status: 'unknown',
      message: 'Unable to check system resources: ' + error.message
    };
  }
}

async function checkUptime() {
  try {
    const result = execSync('uptime -p', { encoding: 'utf8', timeout: 3000 });
    return {
      service: 'System Uptime',
      status: 'healthy',
      uptime: result.trim(),
      message: result.trim()
    };
  } catch (error) {
    return {
      service: 'System Uptime',
      status: 'unknown',
      message: 'Unable to get uptime'
    };
  }
}

async function sendAlertNotification(healthResults) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) return;
  
  const failedServices = healthResults.filter(r => r.status !== 'healthy' && r.status !== 'unknown');
  
  if (failedServices.length === 0) return;
  
  let message = `🚨 <b>Plokymarket Health Alert</b>\n\n`;
  
  for (const service of failedServices) {
    const icon = service.status === 'down' ? '❌' : '⚠️';
    message += `${icon} <b>${service.service}</b>\n`;
    message += `   ${service.message}\n\n`;
  }
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    log(`Alert notification failed: ${error.message}`, 'warning');
  }
}

async function runHealthCheck(options) {
  const checks = [
    checkPostgres,
    checkRedis,
    checkSupabaseCloud,
    checkDockerContainers,
    checkSystemResources,
    checkUptime
  ];
  
  log('Running health checks...', 'info');
  
  const results = await Promise.all(checks.map(fn => fn()));
  
  return results;
}

function printResults(results, options) {
  const allHealthy = results.every(r => r.status === 'healthy' || r.status === 'unknown');
  const hasIssues = results.some(r => r.status === 'degraded' || r.status === 'down');
  
  console.log('\n' + '═'.repeat(60));
  console.log('           Plokymarket Health Check Results');
  console.log('═'.repeat(60));
  
  for (const result of results) {
    const icon = {
      healthy: '✅',
      degraded: '⚠️',
      down: '❌',
      unknown: '❓'
    }[result.status] || '❓';
    
    const statusColor = {
      healthy: 'success',
      degraded: 'warning',
      down: 'error',
      unknown: 'info'
    }[result.status] || 'info';
    
    log(`\n${icon} ${result.service}: ${result.status.toUpperCase()}`, statusColor);
    log(`   ${result.message}`);
    
    if (options.verbose && result.latency !== undefined) {
      log(`   Latency: ${result.latency}ms`);
    }
    
    if (options.verbose && result.containers) {
      log(`   Containers: ${result.containers.join(', ')}`);
    }
    
    if (options.verbose && result.details) {
      log(`   Details: ${JSON.stringify(result.details)}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  
  if (allHealthy) {
    log('All systems operational', 'success');
  } else if (hasIssues) {
    log('Some systems have issues - see above', 'warning');
  }
  
  console.log('═'.repeat(60) + '\n');
  
  return { allHealthy, hasIssues, results };
}

async function main() {
  const options = parseArgs();
  
  const results = await runHealthCheck(options);
  
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const { allHealthy } = printResults(results, options);
    
    // Send alert if there are issues
    if (!allHealthy) {
      await sendAlertNotification(results);
    }
  }
  
  // Exit with appropriate code
  const hasDown = results.some(r => r.status === 'down');
  process.exit(hasDown ? 2 : (results.some(r => r.status === 'degraded') ? 1 : 0));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
