/**
 * Metrics Fetch Test
 * Verifies metrics.ts functions return data without crashing.
 */

import { fetchDLQMetrics, fetchCircuitBreakerMetrics, getQueueHealthSnapshot } from "../src/lib/qstash/metrics";

async function runTest() {
  console.log("=== Metrics Fetch Test ===\n");

  // Test 1: DLQ metrics
  console.log("1. fetchDLQMetrics()...");
  const dlq = await fetchDLQMetrics();
  console.log(`   messageCount: ${dlq.messageCount}`);
  console.log(`   oldestMessageAgeMs: ${dlq.oldestMessageAgeMs ?? 'N/A'}`);
  console.log("   ✅ No crash\n");

  // Test 2: Circuit breaker metrics
  console.log("2. fetchCircuitBreakerMetrics()...");
  const breakers = await fetchCircuitBreakerMetrics();
  console.log(`   tracked: ${breakers.length}`);
  for (const cb of breakers) {
    console.log(`   - ${cb.service}: ${cb.status} (${cb.failures} failures)`);
  }
  console.log("   ✅ No crash\n");

  // Test 3: Full snapshot
  console.log("3. getQueueHealthSnapshot()...");
  const snapshot = await getQueueHealthSnapshot();
  console.log(`   timestamp: ${snapshot.timestamp}`);
  console.log(`   dlq.messages: ${snapshot.dlq.messageCount}`);
  console.log(`   circuitBreakers: ${snapshot.circuitBreakers.length}`);
  console.log("   ✅ No crash\n");

  console.log("=== All metrics tests passed ===");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
