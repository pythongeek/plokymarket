import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://polymarketbd.com';

export default function () {
  const orderbookRes = http.get(`${BASE_URL}/api/markets/e2e-test-market/orderbook`);
  check(orderbookRes, {
    'orderbook status 200': (r) => r.status === 200,
    'orderbook response fast': (r) => r.timings.duration < 100,
  });

  const marketsRes = http.get(`${BASE_URL}/api/markets?limit=20`);
  check(marketsRes, {
    'markets status 200': (r) => r.status === 200,
    'markets has data': (r) => JSON.parse(r.body).markets?.length >= 0,
  });

  sleep(1);
}
