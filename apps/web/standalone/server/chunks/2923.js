"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="d9fd257e-fef3-4657-9c5b-564b808749aa",e._sentryDebugIdIdentifier="sentry-dbid-d9fd257e-fef3-4657-9c5b-564b808749aa")}catch(e){}}(),exports.id=2923,exports.ids=[2923],exports.modules={45304:(e,t,a)=>{a.d(t,{runAuditAgent:()=>l});let r="gemini-2.5-flash",s="gemini-2.0-flash-001",o=`# ROLE: Chief Financial Integrity Officer & Lead Auditor (Plokymarket BD)
Your primary mission is to ensure 100% fiscal transparency. You are a watchdog that cross-references all financial nodes (Deposits, Trades, Escrows, and Payouts) to prevent any loss of funds or unauthorized credit generation.

# CORE AUDIT PROTOCOLS:

1. TRIPLE-ENTRY RECONCILIATION (রিয়েল-টাইম অডিট):
   - Always verify: [Total Platform Assets] = [Sum of User Balances] + [Locked Escrow in Markets] + [Platform Fees].
   - If there is even a 0.01 BDT/USDT variance, flag it as a "FISCAL_BREACH".

2. ANOMALY DETECTION (অস্বাভাবিক লেনদেন শনাক্তকরণ):
   - Use Vertex AI Anomaly Detection to monitor sudden spikes in "User Credits" without matching Deposit logs.
   - Detect "Ghost Payouts": Payouts triggered for markets that haven't been resolved or have no matching trade history.

3. LIQUIDITY FORECASTING (ভবিষ্যৎ তহবিল অনুমান):
   - Analyze current high-volume markets and forecast potential maximum payout liabilities (Worst Case Scenario).
   - Alert Admin if the platform's "Reserve Ratio" drops below 120% of potential liabilities.

4. MFS & GATEWAY CORRELATION:
   - Match bKash/Nagad/USDT transaction IDs with internal wallet updates. 
   - Identify "Double-Spending" attempts where the same TxID is used for multiple deposit requests.

# ENFORCEMENT & ALERTS:
- Variance < 1%: Issue WARNING to Admin dashboard.
- Variance > 5% or Unexplained Credit: Trigger "SOFT_LOCK" on withdrawals and notify Super-Admin immediately.
- Detected Fraud Pattern: Auto-freeze the suspicious User Wallet.

# OUTPUT SCHEMA (STRICT JSON):
{
  "audit_report": {
    "status": "HEALTHY | UNSTABLE | BREACHED",
    "reserve_ratio": number,
    "variance_detected": number
  },
  "forensic_details": {
    "reasoning_bn": "আর্থিক গরমিলের বিস্তারিত ব্যাখ্যা বাংলায়",
    "affected_nodes": ["Wallets", "Escrow", "Payouts"],
    "suspicious_accounts": ["user_id_1"]
  },
  "action_plan": {
    "recommended_action": "NO_ACTION | FREEZE_WITHDRAWALS | RECONCILE_DB",
    "admin_instruction_bn": "অ্যাডমিনের জন্য পরবর্তী পদক্ষেপের নির্দেশনা বাংলায়"
  }
}`;async function n(e,t,a=r){let i=`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${t}`,c=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:o}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.05,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!c.ok){let o=await c.text();if(a===r&&(o.includes("not found")||o.includes("not supported")||o.includes("is not available")))return console.warn(`[AuditAgent] ${r} unavailable, falling back to ${s}`),n(e,t,s);throw Error(`Audit Agent Gemini error (${c.status}): ${o.substring(0,300)}`)}let l=await c.json(),d=l.candidates?.[0]?.content?.parts?.[0]?.text;if(!d)throw Error("Empty response from Audit Agent");return d}let i=["HEALTHY","UNSTABLE","BREACHED"],c=["NO_ACTION","FREEZE_WITHDRAWALS","RECONCILE_DB"];async function l(e){let t=process.env.GEMINI_API_KEY;if(!t)throw Error("GEMINI_API_KEY not configured — cannot run Audit Agent");console.log("[AuditAgent] Starting fiscal integrity audit");let a="";if(e.platformStats){let t=e.platformStats;a=`

Platform Financial State:
- Total User Balances: ${t.currency}${t.total_user_balances}
- Total Locked Escrow: ${t.currency}${t.total_locked_escrow}
- Total Platform Fees: ${t.currency}${t.total_platform_fees}
- Total Deposits (All-time): ${t.currency}${t.total_deposits}
- Total Withdrawals (All-time): ${t.currency}${t.total_withdrawals}
- Total Payouts (Completed): ${t.currency}${t.total_payouts}
- Pending Payouts: ${t.currency}${t.pending_payouts}
- Active Markets: ${t.active_markets_count}

Triple-Entry Check:
  Platform Assets = Deposits - Withdrawals = ${t.currency}${t.total_deposits-t.total_withdrawals}
  Sum of Obligations = Balances + Escrow + Fees = ${t.currency}${t.total_user_balances+t.total_locked_escrow+t.total_platform_fees}
  Variance = ${t.currency}${Math.abs(t.total_deposits-t.total_withdrawals-(t.total_user_balances+t.total_locked_escrow+t.total_platform_fees))}`}let r=`Perform a comprehensive fiscal integrity audit for Plokymarket BD.

${e.rawQuery?`Specific Query: "${e.rawQuery}"`:"Run full platform-wide audit."}
${e.specificUserId?`Focus User: ${e.specificUserId}`:""}
${e.specificMarketId?`Focus Market: ${e.specificMarketId}`:""}
${a}
Current Time (UTC): ${new Date().toISOString()}

MANDATORY CHECKS:
1. Triple-Entry Reconciliation: Does Total Assets = Balances + Escrow + Fees?
2. Anomaly Detection: Any ghost payouts or unexplained credit spikes?
3. Liquidity Forecast: Is Reserve Ratio above 120%?
4. MFS Correlation: Any double-spending or unmatched TxIDs?
5. Generate full audit report following the strict JSON schema.`,s=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let a=e.match(/\{[\s\S]*\}/);if(a)return JSON.parse(a[0]);throw Error("Could not parse JSON from Audit Agent response")}(await n(r,t)),o={audit_report:{status:function(e){let t=(e||"").toUpperCase();return i.includes(t)?t:"UNSTABLE"}(s.audit_report?.status),reserve_ratio:Number(s.audit_report?.reserve_ratio)||0,variance_detected:Number(s.audit_report?.variance_detected)||0},forensic_details:{reasoning_bn:s.forensic_details?.reasoning_bn||"",affected_nodes:s.forensic_details?.affected_nodes||[],suspicious_accounts:s.forensic_details?.suspicious_accounts||[]},action_plan:{recommended_action:function(e){let t=(e||"").toUpperCase().replace(/\s/g,"_");return c.includes(t)?t:"NO_ACTION"}(s.action_plan?.recommended_action),admin_instruction_bn:s.action_plan?.admin_instruction_bn||""}};return console.log(`[AuditAgent] Complete — status: ${o.audit_report.status}, variance: ${o.audit_report.variance_detected}, action: ${o.action_plan.recommended_action}`),o}}};
//# sourceMappingURL=2923.js.map