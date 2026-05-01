#!/usr/bin/env node
/**
 * Metrics Collector Script for Plokymarket
 * 
 * Collects and stores metrics for:
 * - System metrics (CPU, memory, disk)
 * - Application metrics (orders, users, trades)
 * - Business metrics (volume, revenue)
 * 
 * Usage:
 *   node metrics-collector.js --collect         # Collect metrics once
 *   node metrics-collector.js --daemon          # Run as daemon (continuous)
 *   node metrics-collector.js --report           # Generate report
 * 
 * Environment Variables:
 *   KV_REST_API_URL    - Upstash Redis for storing metrics
 *   KV_REST_API_TOKEN  - Upstash Redis token
 *   POSTGRES_*         - PostgreSQL connection settings
 *   METRICS_INTERVAL   - Collection interval in ms (default: 60000)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const METRICS_KEY = 'plokymarket:metrics';
const DEFAULT_INTERVAL = 60000; // 1 minute

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
    metric: colors.magenta
  }[type] || colors.reset;
  console.log(`${colors.cyan}[${new Date().toISOString()}]${color} ${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    collect: args.includes('--collect'),
    daemon: args.includes('--daemon'),
    report: args.includes('--report')
  };
}

async function collectSystemMetrics() {
  const metrics = {
    timestamp: Date.now(),
    type: 'system'
  };
  
  try {
    // CPU load
    const loadResult = execSync('cat /proc/loadavg', { encoding: 'utf8', timeout: 3000 });
    const [load1, load5, load15] = loadResult.split(' ').slice(0, 3).map(Number);
    metrics.cpu = { load1, load5, load15 };
    
    // Memory
    const memResult = execSync('free -m', { encoding: 'utf8', timeout: 3000 });
    const memMatch = memResult.match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/);
    if (memMatch) {
      metrics.memory = {
        total: parseInt(memMatch[1]),
        used: parseInt(memMatch[2]),
        free: parseInt(memMatch[3]),
        usagePercent: Math.round((parseInt(memMatch[2]) / parseInt(memMatch[1])) * 100)
      };
    }
    
    // Disk
    const diskResult = execSync('df -h /', { encoding: 'utf8', timeout: 3000 });
    const diskMatch = diskResult.match(/(\d+)%\s*$/);
    if (diskMatch) {
      const usage = parseInt(diskMatch[1]);
      metrics.disk = { usagePercent: usage };
    }
    
    // Network (simplified)
    try {
      const netResult = execSync('cat /proc/net/dev | grep eth0', { encoding: 'utf8', timeout: 3000 });
      const netMatch = netResult.match(/:\s+(\d+)\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+)/);
      if (netMatch) {
        metrics.network = {
          rxBytes: parseInt(netMatch[1]),
          txBytes: parseInt(netMatch[2])
        };
      }
    } catch (e) {
      // Network stats not available
    }
    
    // Process count
    const procResult = execSync('ps aux | wc -l', { encoding: 'utf8', timeout: 3000 });
    metrics.processes = parseInt(procResult.trim()) - 1; // Subtract header line
    
  } catch (error) {
    metrics.error = error.message;
  }
  
  return metrics;
}

async function collectDatabaseMetrics() {
  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'polymarket'
  };
  
  const metrics = {
    timestamp: Date.now(),
    type: 'database'
  };
  
  try {
    const env = { ...process.env, PGPASSWORD: config.password };
    
    // Get table counts
    const tables = ['users', 'markets', 'orders', 'trades', 'deposits', 'withdrawals'];
    
    for (const table of tables) {
      try {
        const result = execSync(
          `psql -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -c "SELECT COUNT(*) FROM ${table};" -t`,
          { env, encoding: 'utf8', timeout: 5000 }
        );
        metrics[table] = parseInt(result.trim()) || 0;
      } catch (e) {
        metrics[table] = -1;
      }
    }
    
    // Get database size
    try {
      const sizeResult = execSync(
        `psql -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -c "SELECT pg_database_size('${config.database}');" -t`,
        { env, encoding: 'utf8', timeout: 5000 }
      );
      metrics.dbSizeBytes = parseInt(sizeResult.trim());
      metrics.dbSizeMB = Math.round(metrics.dbSizeBytes / (1024 * 1024));
    } catch (e) {
      // Size not available
    }
    
    // Get active connections
    try {
      const connResult = execSync(
        `psql -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" -t`,
        { env, encoding: 'utf8', timeout: 5000 }
      );
      metrics.activeConnections = parseInt(connResult.trim()) || 0;
    } catch (e) {
      // Connection count not available
    }
    
  } catch (error) {
    metrics.error = error.message;
  }
  
  return metrics;
}

async function collectApplicationMetrics() {
  const metrics = {
    timestamp: Date.now(),
    type: 'application'
  };
  
  // These would typically come from your application's APIs
  // For now, we'll use Redis to check some application state
  
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  
  if (redisUrl && redisToken) {
    try {
      // Get some application-specific keys
      const keysResult = await fetch(`${redisUrl}/keys/plokymarket:*`, {
        headers: { 'Authorization': `Bearer ${redisToken}` }
      }).then(r => r.json());
      
      metrics.redisKeyCount = keysResult.result?.length || 0;
      
      // Check for any rate limiting keys
      const rateLimitResult = await fetch(`${redisUrl}/keys/plokymarket:ratelimit:*`, {
        headers: { 'Authorization': `Bearer ${redisToken}` }
      }).then(r => r.json());
      
      metrics.rateLimitKeys = rateLimitResult.result?.length || 0;
      
    } catch (error) {
      metrics.redisError = error.message;
    }
  }
  
  // Check docker containers
  try {
    const dockerResult = execSync('docker ps --format "{{.Names}}:{{.Status}}"', { 
      encoding: 'utf8', timeout: 5000 
    });
    const containers = dockerResult.trim().split('\n').filter(Boolean);
    metrics.runningContainers = containers.length;
    metrics.containerStatus = containers.reduce((acc, c) => {
      const [name, status] = c.split(':');
      acc[name] = status;
      return acc;
    }, {});
  } catch (error) {
    metrics.dockerError = error.message;
  }
  
  return metrics;
}

async function storeMetrics(metrics) {
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  
  if (!redisUrl || !redisToken) {
    log('Redis not configured, metrics not stored', 'warning');
    return;
  }
  
  try {
    // Store metrics with timestamp as part of key
    const key = `${METRICS_KEY}:${metrics.type}:${metrics.timestamp}`;
    
    await fetch(`${redisUrl}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metrics)
    });
    
    // Set expiry to 30 days
    await fetch(`${redisUrl}/expire/${encodeURIComponent(key)}/2592000`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`
      }
    });
    
    // Also maintain a list of recent metrics
    const listKey = `${METRICS_KEY}:${metrics.type}:recent`;
    await fetch(`${redisUrl}/rpush/${encodeURIComponent(listKey)}/${encodeURIComponent(JSON.stringify(metrics))}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`
      }
    });
    
    // Trim list to keep only last 1000 entries
    await fetch(`${redisUrl}/ltrim/${encodeURIComponent(listKey)}/-1000/-1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`
      }
    });
    
    log(`Stored ${metrics.type} metrics`, 'metric');
  } catch (error) {
    log(`Failed to store metrics: ${error.message}`, 'error');
  }
}

async function getRecentMetrics(type, limit = 100) {
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  
  if (!redisUrl || !redisToken) {
    return [];
  }
  
  try {
    const listKey = `${METRICS_KEY}:${type}:recent`;
    const result = await fetch(`${redisUrl}/lrange/${encodeURIComponent(listKey)}/${limit}/-1`, {
      headers: { 'Authorization': `Bearer ${redisToken}` }
    }).then(r => r.json());
    
    return result.result || [];
  } catch (error) {
    log(`Failed to get recent metrics: ${error.message}`, 'error');
    return [];
  }
}

function generateReport(metrics) {
  console.log('\n' + '═'.repeat(70));
  console.log('                  PLOKYMARKET METRICS REPORT');
  console.log('═'.repeat(70));
  console.log(`Generated at: ${new Date().toISOString()}\n`);
  
  // Group metrics by type
  const byType = {
    system: [],
    database: [],
    application: []
  };
  
  for (const m of metrics) {
    if (byType[m.type]) {
      byType[m.type].push(m);
    }
  }
  
  // System metrics
  if (byType.system.length > 0) {
    console.log('📊 SYSTEM METRICS');
    console.log('-'.repeat(40));
    
    const latest = byType.system[byType.system.length - 1];
    
    if (latest.cpu) {
      console.log(`CPU Load: ${latest.cpu.load1} (1m), ${latest.cpu.load5} (5m), ${latest.cpu.load15} (15m)`);
    }
    
    if (latest.memory) {
      console.log(`Memory: ${latest.memory.used}MB / ${latest.memory.total}MB (${latest.memory.usagePercent}%)`);
    }
    
    if (latest.disk) {
      console.log(`Disk: ${latest.disk.usagePercent}% used`);
    }
    
    if (latest.processes !== undefined) {
      console.log(`Processes: ${latest.processes}`);
    }
    
    console.log('');
  }
  
  // Database metrics
  if (byType.database.length > 0) {
    console.log('🗄️ DATABASE METRICS');
    console.log('-'.repeat(40));
    
    const latest = byType.database[byType.database.length - 1];
    
    const tables = ['users', 'markets', 'orders', 'trades', 'deposits', 'withdrawals'];
    
    for (const table of tables) {
      if (latest[table] !== undefined) {
        console.log(`${table}: ${latest[table].toLocaleString()}`);
      }
    }
    
    if (latest.dbSizeMB !== undefined) {
      console.log(`Database Size: ${latest.dbSizeMB} MB`);
    }
    
    if (latest.activeConnections !== undefined) {
      console.log(`Active Connections: ${latest.activeConnections}`);
    }
    
    console.log('');
  }
  
  // Application metrics
  if (byType.application.length > 0) {
    console.log('🚀 APPLICATION METRICS');
    console.log('-'.repeat(40));
    
    const latest = byType.application[byType.application.length - 1];
    
    if (latest.runningContainers !== undefined) {
      console.log(`Running Containers: ${latest.runningContainers}`);
    }
    
    if (latest.redisKeyCount !== undefined) {
      console.log(`Redis Keys: ${latest.redisKeyCount}`);
    }
    
    console.log('');
  }
  
  // Trends
  if (byType.system.length >= 2) {
    console.log('📈 TRENDS (Last 10 samples)');
    console.log('-'.repeat(40));
    
    const recent = byType.system.slice(-10);
    
    if (recent[0].memory && recent[recent.length - 1].memory) {
      const first = recent[0].memory.usagePercent;
      const last = recent[recent.length - 1].memory.usagePercent;
      const diff = last - first;
      const trend = diff > 0 ? '📈' : (diff < 0 ? '📉' : '➡️');
      console.log(`Memory Usage: ${trend} ${diff > 0 ? '+' : ''}${diff}% (${first}% → ${last}%)`);
    }
    
    if (recent[0].cpu && recent[recent.length - 1].cpu) {
      const first = recent[0].cpu.load1;
      const last = recent[recent.length - 1].cpu.load1;
      const diff = last - first;
      const trend = diff > 0 ? '📈' : (diff < 0 ? '📉' : '➡️');
      console.log(`CPU Load (1m): ${trend} ${diff > 0 ? '+' : ''}${diff.toFixed(2)} (${first.toFixed(2)} → ${last.toFixed(2)})`);
    }
    
    console.log('');
  }
  
  console.log('═'.repeat(70) + '\n');
}

async function runCollectionCycle() {
  log('Collecting metrics...', 'info');
  
  const systemMetrics = await collectSystemMetrics();
  const dbMetrics = await collectDatabaseMetrics();
  const appMetrics = await collectApplicationMetrics();
  
  await storeMetrics(systemMetrics);
  await storeMetrics(dbMetrics);
  await storeMetrics(appMetrics);
  
  log('Metrics collection complete', 'success');
}

async function runDaemon(interval) {
  log(`Starting metrics collector daemon (interval: ${interval}ms)`, 'info');
  
  // Run first cycle immediately
  await runCollectionCycle();
  
  // Then run at interval
  setInterval(runCollectionCycle, interval);
  
  // Keep process running
  process.stdin.resume();
  
  process.on('SIGINT', () => {
    log('Shutting down metrics collector...', 'info');
    process.exit(0);
  });
}

async function main() {
  const options = parseArgs();
  const interval = parseInt(process.env.METRICS_INTERVAL || String(DEFAULT_INTERVAL));
  
  if (options.daemon) {
    await runDaemon(interval);
  } else if (options.collect) {
    await runCollectionCycle();
  } else if (options.report) {
    log('Generating metrics report...', 'info');
    
    const [system, database, application] = await Promise.all([
      getRecentMetrics('system', 100),
      getRecentMetrics('database', 100),
      getRecentMetrics('application', 100)
    ]);
    
    const allMetrics = [
      ...system.map(m => JSON.parse(m)),
      ...database.map(m => JSON.parse(m)),
      ...application.map(m => JSON.parse(m))
    ];
    
    if (allMetrics.length === 0) {
      log('No metrics data found. Run --collect first.', 'warning');
    } else {
      generateReport(allMetrics);
    }
  } else {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║             Plokymarket Metrics Collector                          ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║  --collect    Collect metrics once                                  ║');
    console.log('║  --daemon     Run continuously as daemon                           ║');
    console.log('║  --report     Generate report from collected metrics                ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
