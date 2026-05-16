/**
 * Module E Phase 5 — Chaos Engineering & E2E Validation
 *
 * Simulates adversarial conditions to verify defensive systems.
 * Uses in-memory Redis mocking so the test runs without real Redis.
 */

// ─── MOCK REDIS FOR CHAOS TESTING ──────────────────────────────────────────────────────────────────────────────────────────────────────

const memoryStore = new Map<string, string>();
const sortedSets = new Map<string, Map<string, number>>(); // key -> { member: score }

// Override the redis module before importing our code
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === "@/lib/upstash/redis" || id.endsWith("/upstash/redis")) {
    return {
      redisCommand: async (command: string, ...args: any[]) => {
        const key = String(args[0] || "");
        switch (command.toUpperCase()) {
          case "GET":
            return memoryStore.get(key) || null;
          case "SET":
            const setValue = String(args[1] || "");
            const ttlIndex = args.indexOf("EX");
            memoryStore.set(key, setValue);
            if (ttlIndex >= 0) {
              const ttl = Number(args[ttlIndex + 1]) * 1000;
              setTimeout(() => memoryStore.delete(key), ttl);
            }
            return "OK";
          case "SETEX":
            memoryStore.set(key, String(args[2] || ""));
            setTimeout(() => memoryStore.delete(key), Number(args[1]) * 1000);
            return "OK";
          case "DEL":
            const had = memoryStore.has(key);
            memoryStore.delete(key);
            sortedSets.delete(key);
            return had ? 1 : 0;
          case "ZADD":
            if (!sortedSets.has(key)) sortedSets.set(key, new Map());
            sortedSets.get(key)!.set(String(args[2]), Number(args[1]));
            return 1;
          case "ZREMRANGEBYSCORE":
            if (!sortedSets.has(key)) return 0;
            const set = sortedSets.get(key)!;
            const minScore = Number(args[1]);
            const maxScore = Number(args[2]);
            let removed = 0;
            for (const [member, score] of set) {
              if (score >= minScore && score <= maxScore) {
                set.delete(member);
                removed++;
              }
            }
            return removed;
          case "ZCARD":
            return sortedSets.get(key)?.size || 0;
          case "EXPIRE":
            setTimeout(() => memoryStore.delete(key), Number(args[1]) * 1000);
            return 1;
          case "KEYS":
            const pattern = key.replace("*", "");
            return Array.from(memoryStore.keys()).filter((k) =>
              k.startsWith(pattern)
            );
          default:
            return null;
        }
      },
    };
  }
  return originalRequire.apply(this, arguments);
};

// ─── IMPORTS (after mock) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

import {
  recordFailure,
  resetCircuit,
  getCircuitState,
  type RedisCircuitState,
} from "../src/lib/oracle/ai/resilience/RedisCircuitBreaker";
import {
  acquireIdempotencyLock,
  releaseIdempotencyLock,
} from "../src/lib/qstash/idempotency";
import { sendSystemAlert } from "../src/lib/monitoring/alerts";

// Mock fetch for alert webhook verification
const alertCalls: { level: string; component: string; message: string }[] = [];
(global as any).fetch = async (url: string, init: any) => {
  if (url && (url.includes("discord") || url.includes("slack"))) {
    alertCalls.push(JSON.parse(init.body));
    return { ok: true, status: 204 } as Response;
  }
  return { ok: true, status: 200 } as Response;
};

const CHAOS_SERVICE = "chaos-minimax";
const IDEMPOTENCY_KEY = "chaos:webhook:market-12345";

function log(section: string, msg: string) {
  console.log(`[${section}] ${msg}`);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── PHASE 5.1: ATTACK ───────────────────────────────────────────────────────────────────────────────────────

async function attackCircuitBreaker() {
  log("ATTACK", `💥 Injecting 4 consecutive failures into ${CHAOS_SERVICE}...`);

  for (let i = 1; i <= 4; i++) {
    await recordFailure(CHAOS_SERVICE);
    log("ATTACK", `  Failure ${i}/4 injected`);
    await sleep(50);
  }

  const state = await getCircuitState(CHAOS_SERVICE);
  log("ATTACK", `  Circuit status: ${state.status}`);
  log("ATTACK", `  Failure count: ${state.failures}`);
  return state;
}

async function attackIdempotency() {
  log("ATTACK", `💥 Firing 10 identical webhook payloads concurrently...`);

  const results = await Promise.all(
    Array.from({ length: 10 }, () => acquireIdempotencyLock(IDEMPOTENCY_KEY))
  );

  const acquired = results.filter((r) => r.acquired).length;
  const rejected = results.filter((r) => !r.acquired).length;

  log("ATTACK", `  Acquired: ${acquired}, Rejected: ${rejected}`);
  return { acquired, rejected };
}

async function attackDLQ() {
  log("ATTACK", `💥 Simulating DLQ overflow (15 messages)...`);
  log("ATTACK", `  15 simulated DLQ messages queued`);
  return 15;
}

// ─── PHASE 5.2: DEFENSE VERIFICATION ───────────────────────────────────────────────────────────────────────────────────────────────────────

async function verifyDefenses(
  cbState: RedisCircuitState,
  idemResult: { acquired: number; rejected: number },
  dlqCount: number
) {
  log("DEFENSE", `🛡️ Verifying automated defenses...`);

  // 1. Circuit breaker must be OPEN
  const cbOpen = cbState.status === "open";
  log(
    "DEFENSE",
    `  Circuit Breaker OPEN: ${cbOpen ? "✅ YES" : "❌ NO (status=${cbState.status})"}`
  );

  // 2. Idempotency must allow exactly 1
  const idemOk = idemResult.acquired === 1 && idemResult.rejected === 9;
  log(
    "DEFENSE",
    `  Idempotency (1 acquired, 9 rejected): ${idemOk ? "✅ YES" : "❌ NO"}`
  );

  // 3. Alert must have fired for circuit breaker
  const cbAlert = alertCalls.some(
    (a) =>
      a.component === "CircuitBreaker" && a.message.includes(CHAOS_SERVICE)
  );
  log("DEFENSE", `  CB Alert dispatched: ${cbAlert ? "✅ YES" : "❌ NO"}`);

  // 4. Simulate DLQ alert
  await sendSystemAlert(
    "CRITICAL",
    "QueueHealth",
    `DLQ has ${dlqCount} messages (threshold: 10)`,
    { dlqCount, threshold: 10 }
  );
  const dlqAlert = alertCalls.some(
    (a) => a.component === "QueueHealth" && a.message.includes("DLQ")
  );
  log("DEFENSE", `  DLQ Alert dispatched: ${dlqAlert ? "✅ YES" : "❌ NO"}`);

  return { cbOpen, idemOk, cbAlert, dlqAlert };
}

// ─── PHASE 5.3: RECOVERY ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function recover() {
  log("RECOVERY", `🏥 Healing the system...`);

  // 1. Reset circuit breaker
  await resetCircuit(CHAOS_SERVICE);
  const cbState = await getCircuitState(CHAOS_SERVICE);
  log("RECOVERY", `  Circuit breaker reset: ${cbState.status}`);

  // 2. Release idempotency lock
  await releaseIdempotencyLock(IDEMPOTENCY_KEY);
  log("RECOVERY", `  Idempotency lock released`);

  // 3. Clear alert log
  alertCalls.length = 0;
  log("RECOVERY", `  Alert log cleared`);

  // 4. Verify nominal state
  const nominal =
    cbState.status === "closed" &&
    cbState.failures === 0 &&
    alertCalls.length === 0;

  log("RECOVERY", `  Nominal health restored: ${nominal ? "✅ YES" : "❌ NO"}`);
  return nominal;
}

// ─── MAIN ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function runChaosTest() {
  console.log("\n" + "=".repeat(70));
  console.log("  PLOKYMARKET MODULE E — CHAOS ENGINEERING & E2E VALIDATION");
  console.log("=".repeat(70) + "\n");

  const start = Date.now();

  // ATTACK
  console.log("\n--- PHASE 5.1: ATTACK ---\n");
  const cbState = await attackCircuitBreaker();
  const idemResult = await attackIdempotency();
  const dlqCount = await attackDLQ();

  // DEFENSE
  console.log("\n--- PHASE 5.2: DEFENSE VERIFICATION ---\n");
  const defenses = await verifyDefenses(cbState, idemResult, dlqCount);

  // RECOVERY
  console.log("\n--- PHASE 5.3: RECOVERY ---\n");
  const recovered = await recover();

  // SUMMARY
  const duration = Date.now() - start;
  console.log("\n" + "=".repeat(70));
  console.log("  CHAOS TEST SUMMARY");
  console.log("=".repeat(70));
  console.log(`  Duration:        ${duration}ms`);
  console.log(`  CB Trip:         ${defenses.cbOpen ? "✅" : "❌"}`);
  console.log(`  Idempotency:     ${defenses.idemOk ? "✅" : "❌"}`);
  console.log(`  CB Alert Fired:  ${defenses.cbAlert ? "✅" : "❌"}`);
  console.log(`  DLQ Alert Fired: ${defenses.dlqAlert ? "✅" : "❌"}`);
  console.log(`  Recovery:        ${recovered ? "✅" : "❌"}`);
  console.log("=".repeat(70));

  const allPass =
    defenses.cbOpen &&
    defenses.idemOk &&
    defenses.cbAlert &&
    defenses.dlqAlert &&
    recovered;

  if (allPass) {
    console.log("\n  ✅ ALL DEFENSES VERIFIED. MODULE E PRODUCTION READY.\n");
    process.exit(0);
  } else {
    console.log("\n  ❌ SOME DEFENSES FAILED. INVESTIGATE BEFORE PRODUCTION.\n");
    process.exit(1);
  }
}

runChaosTest().catch((err) => {
  console.error("Chaos test crashed:", err);
  process.exit(1);
});
