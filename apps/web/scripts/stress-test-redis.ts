/**
 * Redis Burst Stress Test
 * Fires 100 concurrent GET/SET operations.
 * Verifies keep-alive agent handles bursts without dropping connections.
 */

import { redisCommand, get, setex } from "../src/lib/upstash/redis";

const CONCURRENT_OPS = 100;
const TEST_KEY_PREFIX = "stress:test:";

async function runStressTest() {
  console.log(`=== Redis Burst Stress Test ===`);
  console.log(`Concurrent operations: ${CONCURRENT_OPS}`);
  console.log(`Agent: keepAlive (maxSockets=50, maxFreeSockets=10)`);
  console.log(`Retry: 5 attempts with exponential backoff`);
  console.log();

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  const start = Date.now();

  // Fire 100 concurrent SET operations
  const setPromises = Array.from({ length: CONCURRENT_OPS }, (_, i) =>
    setex(`${TEST_KEY_PREFIX}${i}`, 60, `value-${i}`)
      .then(() => {
        results.success++;
      })
      .catch((err: any) => {
        results.failed++;
        results.errors.push(`SET ${i}: ${err.message}`);
      })
  );

  // Fire 100 concurrent GET operations
  const getPromises = Array.from({ length: CONCURRENT_OPS }, (_, i) =>
    get(`${TEST_KEY_PREFIX}${i}`)
      .then(() => {
        results.success++;
      })
      .catch((err: any) => {
        results.failed++;
        results.errors.push(`GET ${i}: ${err.message}`);
      })
  );

  await Promise.all([...setPromises, ...getPromises]);

  const duration = Date.now() - start;

  console.log(`--- Results ---`);
  console.log(`Total operations: ${CONCURRENT_OPS * 2}`);
  console.log(`Successful: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Avg per op: ${(duration / (CONCURRENT_OPS * 2)).toFixed(2)}ms`);

  if (results.errors.length > 0) {
    console.log(`\nErrors (${results.errors.length}):`);
    results.errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }

  if (results.failed === 0) {
    console.log(`\n✅ PASS: All ${CONCURRENT_OPS * 2} operations succeeded. No connections dropped.`);
    process.exit(0);
  } else {
    console.log(`\n❌ FAIL: ${results.failed} operations failed.`);
    process.exit(1);
  }
}

runStressTest();
