"use strict";!function(){try{var t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},e=(new t.Error).stack;e&&(t._sentryDebugIds=t._sentryDebugIds||{},t._sentryDebugIds[e]="8bbc5101-0584-4fa0-9fc9-17941073d9a7",t._sentryDebugIdIdentifier="sentry-dbid-8bbc5101-0584-4fa0-9fc9-17941073d9a7")}catch(t){}}(),exports.id=6149,exports.ids=[2923,6149],exports.modules={45304:(t,e,a)=>{a.d(e,{runAuditAgent:()=>l});let r="gemini-2.5-flash",o="gemini-2.0-flash-001",s=`# ROLE: Chief Financial Integrity Officer & Lead Auditor (Plokymarket BD)
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
}`;async function i(t,e,a=r){let n=`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${e}`,c=await fetch(n,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:s}]},contents:[{role:"user",parts:[{text:t}]}],tools:[{google_search:{}}],generationConfig:{temperature:.05,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!c.ok){let s=await c.text();if(a===r&&(s.includes("not found")||s.includes("not supported")||s.includes("is not available")))return console.warn(`[AuditAgent] ${r} unavailable, falling back to ${o}`),i(t,e,o);throw Error(`Audit Agent Gemini error (${c.status}): ${s.substring(0,300)}`)}let l=await c.json(),d=l.candidates?.[0]?.content?.parts?.[0]?.text;if(!d)throw Error("Empty response from Audit Agent");return d}let n=["HEALTHY","UNSTABLE","BREACHED"],c=["NO_ACTION","FREEZE_WITHDRAWALS","RECONCILE_DB"];async function l(t){let e=process.env.GEMINI_API_KEY;if(!e)throw Error("GEMINI_API_KEY not configured — cannot run Audit Agent");console.log("[AuditAgent] Starting fiscal integrity audit");let a="";if(t.platformStats){let e=t.platformStats;a=`

Platform Financial State:
- Total User Balances: ${e.currency}${e.total_user_balances}
- Total Locked Escrow: ${e.currency}${e.total_locked_escrow}
- Total Platform Fees: ${e.currency}${e.total_platform_fees}
- Total Deposits (All-time): ${e.currency}${e.total_deposits}
- Total Withdrawals (All-time): ${e.currency}${e.total_withdrawals}
- Total Payouts (Completed): ${e.currency}${e.total_payouts}
- Pending Payouts: ${e.currency}${e.pending_payouts}
- Active Markets: ${e.active_markets_count}

Triple-Entry Check:
  Platform Assets = Deposits - Withdrawals = ${e.currency}${e.total_deposits-e.total_withdrawals}
  Sum of Obligations = Balances + Escrow + Fees = ${e.currency}${e.total_user_balances+e.total_locked_escrow+e.total_platform_fees}
  Variance = ${e.currency}${Math.abs(e.total_deposits-e.total_withdrawals-(e.total_user_balances+e.total_locked_escrow+e.total_platform_fees))}`}let r=`Perform a comprehensive fiscal integrity audit for Plokymarket BD.

${t.rawQuery?`Specific Query: "${t.rawQuery}"`:"Run full platform-wide audit."}
${t.specificUserId?`Focus User: ${t.specificUserId}`:""}
${t.specificMarketId?`Focus Market: ${t.specificMarketId}`:""}
${a}
Current Time (UTC): ${new Date().toISOString()}

MANDATORY CHECKS:
1. Triple-Entry Reconciliation: Does Total Assets = Balances + Escrow + Fees?
2. Anomaly Detection: Any ghost payouts or unexplained credit spikes?
3. Liquidity Forecast: Is Reserve Ratio above 120%?
4. MFS Correlation: Any double-spending or unmatched TxIDs?
5. Generate full audit report following the strict JSON schema.`,o=function(t){try{return JSON.parse(t)}catch{}let e=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(e)try{return JSON.parse(e[1].trim())}catch{}let a=t.match(/\{[\s\S]*\}/);if(a)return JSON.parse(a[0]);throw Error("Could not parse JSON from Audit Agent response")}(await i(r,e)),s={audit_report:{status:function(t){let e=(t||"").toUpperCase();return n.includes(e)?e:"UNSTABLE"}(o.audit_report?.status),reserve_ratio:Number(o.audit_report?.reserve_ratio)||0,variance_detected:Number(o.audit_report?.variance_detected)||0},forensic_details:{reasoning_bn:o.forensic_details?.reasoning_bn||"",affected_nodes:o.forensic_details?.affected_nodes||[],suspicious_accounts:o.forensic_details?.suspicious_accounts||[]},action_plan:{recommended_action:function(t){let e=(t||"").toUpperCase().replace(/\s/g,"_");return c.includes(e)?e:"NO_ACTION"}(o.action_plan?.recommended_action),admin_instruction_bn:o.action_plan?.admin_instruction_bn||""}};return console.log(`[AuditAgent] Complete — status: ${s.audit_report.status}, variance: ${s.audit_report.variance_detected}, action: ${s.action_plan.recommended_action}`),s}},56149:(t,e,a)=>{a.d(e,{runFiscalAudit:()=>n});var r=a(45304);async function o(){try{let{createClient:t}=await Promise.resolve().then(a.bind(a,49975)),e=await t(),{data:r}=await e.rpc("get_total_balances"),{data:o}=await e.rpc("get_total_escrow"),{data:s}=await e.from("wallet_transactions").select("amount").eq("type","deposit").eq("status","completed"),{data:i}=await e.from("wallet_transactions").select("amount").eq("type","withdrawal").eq("status","completed"),{count:n}=await e.from("markets").select("id",{count:"exact",head:!0}).eq("status","active"),c=(s||[]).reduce((t,e)=>t+(e.amount||0),0),l=(i||[]).reduce((t,e)=>t+(e.amount||0),0);return{total_user_balances:r?.total_balance||0,total_locked_escrow:o?.total_escrow||0,total_platform_fees:r?.total_fees||0,total_deposits:c,total_withdrawals:l,total_payouts:0,pending_payouts:0,active_markets_count:n||0,currency:"৳"}}catch(t){return console.warn("[FiscalWatchdog] Failed to fetch financial state:",t instanceof Error?t.message:t),{total_user_balances:0,total_locked_escrow:0,total_platform_fees:0,total_deposits:0,total_withdrawals:0,total_payouts:0,pending_payouts:0,active_markets_count:0,currency:"৳"}}}async function s(){try{let{createClient:t}=await Promise.resolve().then(a.bind(a,49975)),e=await t();await e.from("platform_config").upsert({key:"payouts_enabled",value:"false",updated_at:new Date().toISOString()}),console.error("[FiscalWatchdog] ⛔ EMERGENCY: Payouts disabled!")}catch(t){console.error("[FiscalWatchdog] Failed to disable payouts:",t)}}async function i(t){try{let{createClient:e}=await Promise.resolve().then(a.bind(a,49975)),r=await e();await r.from("audit_logs").insert({audit_type:"fiscal_integrity",status:t.audit_report.status,reserve_ratio:t.audit_report.reserve_ratio,variance:t.audit_report.variance_detected,action:t.action_plan.recommended_action,details:JSON.stringify({reasoning_bn:t.forensic_details.reasoning_bn,affected_nodes:t.forensic_details.affected_nodes,suspicious_accounts:t.forensic_details.suspicious_accounts}),created_at:new Date().toISOString()})}catch(t){console.error("[FiscalWatchdog] Failed to log audit result:",t)}}async function n(){console.log("[FiscalWatchdog] Starting scheduled fiscal audit");try{let t=await o(),e=await (0,r.runAuditAgent)({platformStats:t}),a=!1;return"BREACHED"===e.audit_report.status?(console.error(`[FiscalWatchdog] ⛔ FISCAL BREACH DETECTED — variance: ${e.audit_report.variance_detected}`),await s(),a=!0):"UNSTABLE"===e.audit_report.status?console.warn(`[FiscalWatchdog] ⚠️ Fiscal instability — reserve ratio: ${e.audit_report.reserve_ratio}`):console.log(`[FiscalWatchdog] ✅ Healthy — reserve ratio: ${e.audit_report.reserve_ratio}`),await i(e),{status:e.audit_report.status,emergencyTriggered:a,auditResult:e}}catch(t){return console.error("[FiscalWatchdog] Audit failed:",t),{status:"FAILED",emergencyTriggered:!1,auditResult:{audit_report:{status:"UNSTABLE",reserve_ratio:0,variance_detected:0},forensic_details:{reasoning_bn:"অডিট প্রক্রিয়াকরণে ত্রুটি ঘটেছে। ম্যানুয়ালি যাচাই করুন।",affected_nodes:[],suspicious_accounts:[]},action_plan:{recommended_action:"NO_ACTION",admin_instruction_bn:"অডিট এজেন্ট ত্রুটি দিয়েছে। ম্যানুয়ালি ড্যাশবোর্ড চেক করুন।"}}}}}}};
//# sourceMappingURL=6149.js.map