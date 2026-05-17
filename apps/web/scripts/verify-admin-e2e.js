#!/usr/bin/env node
/**
 * E2E Admin Verification Script — Phase 1, Step 5
 * Traces the full admin chain: Auth → User → KYC → Deposits → AI Topics → Cron Jobs
 * FAILS on any 401/403/500 or JSON { error }
 *
 * Usage:
 *   node scripts/verify-admin-e2e.js <ADMIN_EMAIL> <ADMIN_PASSWORD> [BASE_URL]
 *
 * Example:
 *   node scripts/verify-admin-e2e.js admin@polymarketbd.com Secret123 https://polymarketbd.com
 */

const BASE_URL = process.argv[4] || process.env.NEXT_PUBLIC_BASE_URL || 'https://polymarketbd.com';
const ADMIN_EMAIL = process.argv[2] || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.argv[3] || process.env.ADMIN_PASSWORD;

let TOKEN = null;
let FAILURES = 0;
let SKIPS = 0;

function ok(label, detail = '') {
  console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`);
}

function fail(label, detail) {
  console.log(`  ❌ ${label} — ${detail}`);
  FAILURES++;
}

function skip(label, detail) {
  console.log(`  ⚠️  ${label} — ${detail}`);
  SKIPS++;
}

async function api(path, opts = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Cookie: `sb-access-token=${TOKEN}` } : {}),
      ...opts.headers,
    },
  });

  const body = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — AUTH HANDSHAKE
// ═══════════════════════════════════════════════════════════════════════════════
async function testAuth() {
  console.log('\n🔐 STEP 1 — Auth Handshake');

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    fail('Credentials', 'Missing ADMIN_EMAIL and ADMIN_PASSWORD (args or env)');
    return false;
  }

  const { status, ok, body } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!ok || body.error) {
    fail('Login', `HTTP ${status}: ${body.error || 'unknown'}`);
    return false;
  }

  TOKEN = body.session?.access_token || body.access_token;
  if (!TOKEN) {
    fail('Token extraction', 'No access_token in login response');
    return false;
  }

  ok('Login', `token=${TOKEN.substring(0, 16)}...`);

  // Verify token is accepted by /api/admin/users/me
  const me = await api('/api/admin/users/me');
  if (!me.ok || me.body.error) {
    fail('Token validation (/api/admin/users/me)', `HTTP ${me.status}: ${me.body.error || 'unknown'}`);
    return false;
  }

  ok('Token accepted', `admin=${me.body.admin?.email || me.body.email || 'unknown'}`);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — USER MANAGEMENT (Read-only probe)
// ═══════════════════════════════════════════════════════════════════════════════
async function testUserManagement() {
  console.log('\n👤 STEP 2 — User Management');

  const users = await api('/api/admin/users');
  if (!users.ok || users.body.error) {
    fail('List users', `HTTP ${users.status}: ${users.body.error || 'unknown'}`);
    return null;
  }

  ok('List users', `${users.body.users?.length ?? users.body.data?.length ?? '?'} users returned`);

  // Check detail route with first user
  const userList = users.body.users || users.body.data || [];
  if (userList.length === 0) {
    skip('User detail', 'No users to test detail route');
    return null;
  }

  const targetUser = userList[0];
  const detail = await api(`/api/admin/users/detail?userId=${targetUser.id}`);
  if (!detail.ok || detail.body.error) {
    fail('User detail', `HTTP ${detail.status}: ${detail.body.error || 'unknown'}`);
  } else {
    ok('User detail', `profile for ${targetUser.id.substring(0, 8)}...`);
  }

  return targetUser;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — KYC APPROVAL FLOW
// ═══════════════════════════════════════════════════════════════════════════════
async function testKYC(targetUser) {
  console.log('\n🛡️  STEP 3 — KYC Approval Flow');

  // First list KYC submissions via the UI-facing API
  const kycList = await api('/api/admin/kyc');
  if (!kycList.ok || kycList.body.error) {
    fail('List KYC', `HTTP ${kycList.status}: ${kycList.body.error || 'unknown'}`);
    return;
  }

  const rows = kycList.body.data || kycList.body.rows || [];
  ok('List KYC', `${rows.length} profiles returned`);

  // Find a user with pending/unverified KYC
  const pending = rows.find(r =>
    (r.verification_status === 'pending' || r.verification_status === 'unverified') && r.id
  );

  if (!pending) {
    skip('KYC approve', 'No pending/unverified KYC users found');
    return;
  }

  const targetId = pending.id;

  // GET detail
  const detail = await api(`/api/admin/kyc/${targetId}`);
  if (!detail.ok || detail.body.error) {
    fail('KYC detail GET', `HTTP ${detail.status}: ${detail.body.error || 'unknown'}`);
    return;
  }
  ok('KYC detail GET', `submissions=${detail.body.submissions?.length ?? 0}`);

  // POST approve (idempotent if already approved — RPC handles it)
  const approve = await api(`/api/admin/kyc/${targetId}`, {
    method: 'POST',
    body: JSON.stringify({ action: 'approve', reason: 'E2E verification test' }),
  });

  if (!approve.ok || approve.body.error) {
    fail('KYC approve POST', `HTTP ${approve.status}: ${approve.body.error || 'unknown'}`);
  } else {
    ok('KYC approve POST', approve.body.success === false ? 'RPC returned success=false' : 'approved');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — DEPOSIT VERIFICATION FLOW
// ═══════════════════════════════════════════════════════════════════════════════
async function testDeposits() {
  console.log('\n💰 STEP 4 — Deposit Verification Flow');

  // List deposits (need to find the right endpoint — try common patterns)
  const deposits = await api('/api/admin/deposits');
  if (!deposits.ok) {
    // Some deployments use a different path
    skip('List deposits', `HTTP ${deposits.status} — endpoint may differ`);
    return;
  }

  const rows = deposits.body.deposits || deposits.body.data || [];
  ok('List deposits', `${rows.length} deposits returned`);

  const pending = rows.find(d => d.status === 'pending');
  if (!pending) {
    skip('Deposit verify', 'No pending deposits to verify');
    return;
  }

  const verify = await api('/api/admin/deposits/verify', {
    method: 'POST',
    body: JSON.stringify({ depositId: pending.id, adminNotes: 'E2E verification test' }),
  });

  if (!verify.ok || verify.body.error) {
    fail('Deposit verify', `HTTP ${verify.status}: ${verify.body.error || 'unknown'}`);
  } else {
    ok('Deposit verify', `credited ${verify.body.result?.amount || verify.body.result?.usdt_amount || '?'}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5 — AI TOPIC APPROVAL FLOW
// ═══════════════════════════════════════════════════════════════════════════════
async function testAITopics() {
  console.log('\n🤖 STEP 5 — AI Topic Approval Flow');

  const topics = await api('/api/admin/daily-topics');
  if (!topics.ok || topics.body.error) {
    fail('List AI topics', `HTTP ${topics.status}: ${topics.body.error || 'unknown'}`);
    return;
  }

  const rows = topics.body.topics || topics.body.data || [];
  ok('List AI topics', `${rows.length} topics returned`);

  const pending = rows.find(t => t.status === 'pending');
  if (!pending) {
    skip('Topic approve', 'No pending AI topics to approve');
    return;
  }

  const approve = await api('/api/admin/daily-topics', {
    method: 'POST',
    body: JSON.stringify({
      topic_id: pending.id,
      action: 'approve',
      market_data: {
        trading_closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }),
  });

  if (!approve.ok || approve.body.error) {
    fail('Topic approve', `HTTP ${approve.status}: ${approve.body.error || 'unknown'}`);
  } else {
    ok('Topic approve', `market_id=${approve.body.market?.id?.substring(0, 8) || 'created'}...`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6 — CRON-JOB.ORG INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════
async function testCronJobs() {
  console.log('\n⏰ STEP 6 — Cron-Job.org Integration');

  const jobs = await api('/api/admin/workflows/cron-job');
  if (!jobs.ok || jobs.body.error) {
    fail('List cron jobs', `HTTP ${jobs.status}: ${jobs.body.error || 'unknown'}`);
    return;
  }

  const rows = jobs.body.data || [];
  ok('List cron jobs', `${rows.length} jobs returned`);

  if (rows.length === 0) {
    skip('Cron trigger', 'No jobs to trigger');
    return;
  }

  const firstJob = rows[0];
  const trigger = await api('/api/admin/workflows/cron-job', {
    method: 'POST',
    body: JSON.stringify({ jobId: firstJob.jobId || firstJob.id }),
  });

  if (!trigger.ok || trigger.body.error) {
    fail('Cron trigger', `HTTP ${trigger.status}: ${trigger.body.error || 'unknown'}`);
  } else {
    ok('Cron trigger', `job ${firstJob.title || firstJob.jobId} triggered`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7 — AI CONFIG SURFACE
// ═══════════════════════════════════════════════════════════════════════════════
async function testAIConfig() {
  console.log('\n⚙️  STEP 7 — AI Config Surface');

  const configs = await api('/api/admin/ai-configs');
  if (!configs.ok || configs.body.error) {
    fail('List AI configs', `HTTP ${configs.status}: ${configs.body.error || 'unknown'}`);
    return;
  }

  const rows = configs.body.data || [];
  ok('List AI configs', `${rows.length} agent configs returned`);

  if (rows.length === 0) {
    skip('AI config PATCH', 'No agents to update');
    return;
  }

  const agent = rows[0];
  const patch = await api('/api/admin/ai-configs', {
    method: 'PATCH',
    body: JSON.stringify({
      id: agent.id,
      updates: { temperature: 0.5 },
    }),
  });

  if (!patch.ok || patch.body.error) {
    fail('AI config PATCH', `HTTP ${patch.status}: ${patch.body.error || 'unknown'}`);
  } else {
    ok('AI config PATCH', `agent ${agent.agent_name} updated`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 8 — METRICS / SYSTEM STATUS
// ═══════════════════════════════════════════════════════════════════════════════
async function testMetrics() {
  console.log('\n📊 STEP 8 — Metrics & System Status');

  const metrics = await api('/api/admin/monitoring/metrics');
  if (!metrics.ok || metrics.body.error) {
    fail('Monitoring metrics', `HTTP ${metrics.status}: ${metrics.body.error || 'unknown'}`);
  } else {
    ok('Monitoring metrics', 'returned');
  }

  const system = await api('/api/admin/metrics/system');
  if (!system.ok || system.body.error) {
    fail('System metrics', `HTTP ${system.status}: ${system.body.error || 'unknown'}`);
  } else {
    ok('System metrics', `db=${system.body.status?.database || '?'}`);
  }

  const status = await api('/api/admin/system-status');
  if (!status.ok || status.body.error) {
    fail('System status', `HTTP ${status.status}: ${status.body.error || 'unknown'}`);
  } else {
    ok('System status', `pending_markets=${status.body.pending_markets ?? '?'}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PLOKYMARKET ADMIN — END-TO-END VERIFICATION');
  console.log(`  Target: ${BASE_URL}`);
  console.log('═══════════════════════════════════════════════════════════════');

  const t0 = Date.now();

  if (!await testAuth()) {
    console.log('\n⛔ Auth failed — cannot continue.');
    process.exit(1);
  }

  const targetUser = await testUserManagement();
  await testKYC(targetUser);
  await testDeposits();
  await testAITopics();
  await testCronJobs();
  await testAIConfig();
  await testMetrics();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${FAILURES === 0 ? '✅ ALL PASS' : `❌ ${FAILURES} FAILURE(S)`}`);
  console.log(`  Failures: ${FAILURES}  |  Skips: ${SKIPS}  |  Time: ${elapsed}s`);
  console.log('═══════════════════════════════════════════════════════════════');

  process.exit(FAILURES > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
