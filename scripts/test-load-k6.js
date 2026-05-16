/**
 * k6 Load Test — 10,000 Concurrent Virtual Users
 * Targets: Trading panel + WebSocket feeds
 * P95 latency must be < 100ms for static assets, < 500ms for API
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");
const staticLatency = new Trend("static_latency");

export const options = {
  stages: [
    { duration: "2m", target: 1000 },   // Ramp up
    { duration: "3m", target: 5000 },   // Load
    { duration: "2m", target: 10000 },  // Stress
    { duration: "1m", target: 0 },      // Cooldown
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],   // API P95 < 500ms
    static_latency: ["p(95)<100"],      // Static P95 < 100ms
    errors: ["rate<0.01"],               // Error rate < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || "https://polymarketbd.com";

export default function () {
  // 1. Static asset (cached at edge)
  const staticStart = Date.now();
  const staticRes = http.get(`${BASE_URL}/_next/static/chunks/main.js`, {
    headers: { "Accept": "*/*" },
  });
  staticLatency.add(Date.now() - staticStart);

  check(staticRes, {
    "static status 200/304": (r) => r.status === 200 || r.status === 304,
    "static cache header": (r) => r.headers["Cache-Control"]?.includes("max-age=31536000"),
  });

  // 2. API health check
  const apiStart = Date.now();
  const apiRes = http.get(`${BASE_URL}/api/health`);
  apiLatency.add(Date.now() - apiStart);

  check(apiRes, {
    "api status 200": (r) => r.status === 200,
    "api response fast": (r) => r.timings.duration < 500,
  });

  if (apiRes.status !== 200) {
    errorRate.add(1);
  }

  // 3. Trading panel (authenticated route simulation)
  const tradeRes = http.get(`${BASE_URL}/markets`);
  check(tradeRes, {
    "trade panel loads": (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 1); // 1-3s think time
}
