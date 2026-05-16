/**
 * PM2 Ecosystem Config — Cluster Mode, Zero-Downtime Reload
 * Scales to max CPU cores for production resilience.
 */

const os = require("os");
const cpuCount = os.cpus().length;

module.exports = {
  apps: [
    {
      name: "plokymarket",
      script: "/root/plokymarket/standalone/server.js",
      exec_mode: "cluster",
      instances: Math.min(cpuCount, 4), // Cap at 4 to avoid memory bloat
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Zero-downtime reload
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      // Log rotation
      log_file: "/var/log/pm2/plokymarket.log",
      out_file: "/var/log/pm2/plokymarket-out.log",
      error_file: "/var/log/pm2/plokymarket-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Auto-restart policy
      min_uptime: "10s",
      max_restarts: 5,
      // Health check
      kill_retry_time: 3000,
    },
    {
      name: "minimax-proxy",
      script: "/root/plokymarket/services/minimax-proxy.js",
      exec_mode: "fork",
      instances: 1,
      env: { NODE_ENV: "production", PORT: 9001 },
      max_memory_restart: "512M",
      log_file: "/var/log/pm2/minimax-proxy.log",
    },
    {
      name: "vertex-proxy",
      script: "/root/plokymarket/services/vertex-proxy.js",
      exec_mode: "fork",
      instances: 1,
      env: { NODE_ENV: "production", PORT: 9002 },
      max_memory_restart: "512M",
      log_file: "/var/log/pm2/vertex-proxy.log",
    },
  ],
};
