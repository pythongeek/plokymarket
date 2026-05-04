"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="8604136c-8689-43ec-babc-a98dd8de5af2",e._sentryDebugIdIdentifier="sentry-dbid-8604136c-8689-43ec-babc-a98dd8de5af2")}catch(e){}}(),exports.id=2686,exports.ids=[2686],exports.modules={22686:(e,t,n)=>{n.d(t,{runSentinelAgent:()=>c});let r="gemini-2.5-flash",a="gemini-2.0-flash-001",i=`# ROLE: Chief Security Intelligence Officer (Sentinel-Shield)
You are the elite fraud detection engine for Plokymarket BD. Your goal is to detect and neutralize market manipulation attempts in real-time, outperforming any centralized or decentralized competitor through behavioral predictive modeling.

# CORE DETECTION PROTOCOLS:

1. WASH TRADING DETECTION (Volume Manipulation):
   - Monitor for "Self-Matching" orders where a user or a group of linked users trade against each other to inflate volume.
   - Analyze frequency and timing: If Buy/Sell occurs within milliseconds between related accounts, flag as HIGH RISK.

2. SYBIL ATTACK & MULTI-ACCOUNT MAPPING:
   - Go beyond IP/Device tracking. Analyze "Behavioral Fingerprinting" (similar betting patterns, withdrawal to same MFS/Wallet).
   - Use Vertex AI Graph Analysis to find clusters of accounts that act as a single entity.

3. INSIDER TRADING & FRONT-RUNNING:
   - Identify "Anomalous Timing": Large bets placed minutes before a major news break or resolution.
   - Correlate news feed arrival time with trade execution timestamps.

4. LOCALIZED FINANCIAL FRAUD (MFS/P2P Risk):
   - Monitor bKash/Nagad/USDT P2P patterns for "Money Laundering" cycles.
   - Detect "Rapid Churn": Immediate withdrawal after winning without further activity.

# ACTION HIERARCHY (The Response Engine):
- Score 1-4 (LOW): Allow trade, log activity.
- Score 5-7 (MEDIUM): Flag for manual Admin review, shadow-ban from leaderboard.
- Score 8-10 (CRITICAL): Block trade instantly, freeze wallet, and trigger "Proof of Humanity" (KYC) re-verification.

# OUTPUT SCHEMA (STRICT JSON):
{
  "fraud_assessment": {
    "risk_score": 1-10,
    "threat_type": "Wash Trading | Sybil Attack | Insider | AML Alert",
    "is_actionable": boolean
  },
  "evidence_log": {
    "reasoning_bn": "কেন এটি জালিয়াতি মনে হচ্ছে তার বিস্তারিত ব্যাখ্যা বাংলায়",
    "linked_accounts": ["user_id_1", "user_id_2"],
    "suspicious_pattern": "Brief technical description of the pattern"
  },
  "enforcement_action": {
    "action": "BLOCK | FLAG | NOTIFY | FREEZE",
    "admin_instruction_bn": "অ্যাডমিনের জন্য পরবর্তী পদক্ষেপের নির্দেশনা বাংলায়"
  }
}`;async function o(e,t,n=r){let s=`https://generativelanguage.googleapis.com/v1beta/models/${n}:generateContent?key=${t}`,l=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:i}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.1,maxOutputTokens:2048,responseMimeType:"application/json"}})});if(!l.ok){let i=await l.text();if(n===r&&(i.includes("not found")||i.includes("not supported")||i.includes("is not available")))return console.warn(`[SentinelAgent] ${r} unavailable, falling back to ${a}`),o(e,t,a);throw Error(`Sentinel Agent Gemini error (${l.status}): ${i.substring(0,300)}`)}let c=await l.json(),d=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!d)throw Error("Empty response from Sentinel Agent");return d}let s=["Wash Trading","Sybil Attack","Insider","AML Alert","None"],l=["BLOCK","FLAG","NOTIFY","FREEZE"];async function c(e){var t;let n=process.env.GEMINI_API_KEY;if(!n)throw Error("GEMINI_API_KEY not configured — cannot run Sentinel Agent");console.log(`[SentinelAgent] Analyzing user ${e.userId} for fraud indicators`);let r="";if(e.behaviorLog&&e.behaviorLog.length>0){let t=e.behaviorLog.slice(-20);r=`

Recent User Activity (last ${t.length} actions):
${t.map((e,t)=>`${t+1}. [${e.timestamp}] ${e.action}${e.amount?` — ৳${e.amount}`:""}${e.side?` (${e.side})`:""}${e.marketId?` market:${e.marketId}`:""}`).join("\n")}`}let a="";e.currentTrade&&(a=`

Current Trade Being Evaluated:
- Market: ${e.currentTrade.marketId}
- Side: ${e.currentTrade.side}
- Amount: ৳${e.currentTrade.amount}
- Price: ${e.currentTrade.price}
- Timestamp: ${e.currentTrade.timestamp}`);let i=`Perform a real-time fraud analysis for the following trading activity on Plokymarket BD.

User ID: ${e.userId}
${e.marketId?`Market ID: ${e.marketId}`:""}
${e.rawQuery?`Context: "${e.rawQuery}"`:""}
${r}
${a}

Analyze for:
1. Wash Trading — self-matching or coordinated volume inflation
2. Sybil Attack — multi-account behavioral fingerprinting
3. Insider Trading — anomalous timing relative to news/resolution events
4. AML (bKash/Nagad/USDT) — rapid churn or layering patterns

Use Google Search to check if there's any recent news about the related market that could indicate insider information timing. Generate the full fraud assessment following the strict JSON schema.`,c=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let n=e.match(/\{[\s\S]*\}/);if(n)return JSON.parse(n[0]);throw Error("Could not parse JSON from Sentinel Agent response")}(await o(i,n)),d=Math.max(1,Math.min(10,Number(c.fraud_assessment?.risk_score)||1)),u=(t=c.fraud_assessment?.threat_type,s.find(e=>e.toLowerCase()===(t||"").toLowerCase())||"None"),g=c.fraud_assessment?.is_actionable??d>=5,m=function(e){let t=(e||"").toUpperCase();return l.includes(t)?t:"NOTIFY"}(c.enforcement_action?.action||(d>=8?"BLOCK":d>=5?"FLAG":"NOTIFY")),f={fraud_assessment:{risk_score:d,threat_type:u,is_actionable:g},evidence_log:{reasoning_bn:c.evidence_log?.reasoning_bn||"",linked_accounts:c.evidence_log?.linked_accounts||[],suspicious_pattern:c.evidence_log?.suspicious_pattern||""},enforcement_action:{action:m,admin_instruction_bn:c.enforcement_action?.admin_instruction_bn||""}};return console.log(`[SentinelAgent] Complete — risk: ${d}/10, threat: ${u}, action: ${m}`),f}}};
//# sourceMappingURL=2686.js.map