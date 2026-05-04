"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="1c62240f-a6c6-4b6f-ad95-06a4e99c3103",e._sentryDebugIdIdentifier="sentry-dbid-1c62240f-a6c6-4b6f-ad95-06a4e99c3103")}catch(e){}}(),exports.id=6658,exports.ids=[6658],exports.modules={26658:(e,t,i)=>{i.d(t,{runTribunalAgent:()=>c});let n="gemini-2.5-flash",a="gemini-2.0-flash-001",r=`# ROLE: Supreme Justice & Evidence Synthesis Specialist (Plokymarket BD)
You are the "Final Court of Appeal" for Plokymarket Bangladesh. Your goal is to resolve complex disputes where the initial Oracle resolution is challenged. You must act with absolute neutrality, using a "beyond reasonable doubt" standard.

# CORE DISPUTE RESOLUTION PROTOCOLS:

1. MULTI-MODAL EVIDENCE SYNTHESIS:
   - Analyze diverse data types: Tier-1 News Articles, Official Government Gazettes (PDF/Image), and Verified Video Broadcasts.
   - Cross-examine timestamps: Ensure the evidence provided was true at the time of market expiry.

2. CONFLICT RESOLUTION LOGIC:
   - If Source A says "YES" and Source B says "NO", evaluate their authority. 
   - Hierarchy: Official Gazette > Supreme Court Order > Election Commission > Tier-1 Media (Prothom Alo) > Tier-2 Media.
   - Identify "Contextual Nuance": Did the event actually happen, or was it just announced? (e.g., A player being "selected" vs. actually "playing" in the XI).

3. BENGALI LEGAL REASONING (ভারডিক্ট রাইটিং):
   - Provide a structured "Final Judgment" in professional, high-standard Bangla.
   - Sections: [অভিযোগের সারসংক্ষেপ], [বিশ্লেষিত প্রমাণাদি], [যৌক্তিক সিদ্ধান্ত], [চূড়ান্ত রায়]।

4. ANTI-COLLUSION CHECK:
   - Identify if the dispute itself is an attempt to manipulate the market (Sybil Attack on disputes).
   - Flag "frivolous challenges" that have zero evidence.

# OPERATIONAL RULES:
- If evidence is 100% conclusive: Resolve the market immediately.
- If evidence is 50/50 or ambiguous: Invoke the "Nullification Clause" and refund all trades.
- NEVER rely on social media sentiment or rumors.

# OUTPUT SCHEMA (STRICT JSON):
{
  "tribunal_verdict": {
    "final_outcome": "YES | NO | CANCELLED",
    "verdict_code": "JUDICIAL_CONFIRMATION_001",
    "certainty_score": 0.00-1.00
  },
  "judicial_reasoning_bn": "পূর্ণাঙ্গ রায়ের ব্যাখ্যা বাংলায়",
  "evidence_analysis": [
    {
      "source": "Name of source",
      "reliability": "High | Medium",
      "key_finding_bn": "সোর্স থেকে পাওয়া মূল তথ্য"
    }
  ],
  "admin_action": "EXECUTE_PAYOUT | REFUND_ALL | BAN_CHALLENGER"
}`;async function o(e,t,i=n){let s=`https://generativelanguage.googleapis.com/v1beta/models/${i}:generateContent?key=${t}`,l=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:r}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.05,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!l.ok){let r=await l.text();if(i===n&&(r.includes("not found")||r.includes("not supported")||r.includes("is not available")))return console.warn(`[TribunalAgent] ${n} unavailable, falling back to ${a}`),o(e,t,a);throw Error(`Tribunal Agent Gemini error (${l.status}): ${r.substring(0,300)}`)}let c=await l.json(),u=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!u)throw Error("Empty response from Tribunal Agent");return u}let s=["YES","NO","CANCELLED"],l=["EXECUTE_PAYOUT","REFUND_ALL","BAN_CHALLENGER"];async function c(e){let t=process.env.GEMINI_API_KEY;if(!t)throw Error("GEMINI_API_KEY not configured — cannot run Tribunal Agent");console.log(`[TribunalAgent] Opening dispute case for market ${e.marketId}: "${e.marketQuestion.substring(0,60)}"`);let i="";e.evidenceUrls&&e.evidenceUrls.length>0&&(i=`

Challenger's Evidence URLs:
${e.evidenceUrls.map((e,t)=>`${t+1}. ${e}`).join("\n")}`);let n=`# DISPUTE CASE — SUPREME TRIBUNAL REVIEW

Market ID: ${e.marketId}
Market Question: "${e.marketQuestion}"
Original Oracle Outcome: ${e.originalOutcome}
${e.challengerUserId?`Challenger User ID: ${e.challengerUserId}`:""}
${e.challengeReason?`Challenge Reason: "${e.challengeReason}"`:""}
${e.oracleEvidence?`Original Oracle Evidence: "${e.oracleEvidence}"`:""}
${i}
Current Time (UTC): ${new Date().toISOString()}

INSTRUCTIONS:
1. Use Google Search to independently verify the original Oracle outcome.
2. Cross-reference with Tier-1 official BD sources (Bangladesh Bank, ICC/BCB, Election Commission, official gazettes).
3. Evaluate the challenger's evidence against the source authority hierarchy.
4. Write a structured Bengali judicial reasoning with sections: [অভিযোগের সারসংক্ষেপ], [বিশ্লেষিত প্রমাণাদি], [যৌক্তিক সিদ্ধান্ত], [চূড়ান্ত রায়]
5. Check for anti-collusion: Is this a frivolous challenge?
6. Generate the full verdict following the strict JSON schema.`,a=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let i=e.match(/\{[\s\S]*\}/);if(i)return JSON.parse(i[0]);throw Error("Could not parse JSON from Tribunal Agent response")}(await o(n,t)),r={tribunal_verdict:{final_outcome:function(e){let t=(e||"").toUpperCase();return s.includes(t)?t:"CANCELLED"}(a.tribunal_verdict?.final_outcome),verdict_code:a.tribunal_verdict?.verdict_code||"JUDICIAL_CONFIRMATION_001",certainty_score:Math.max(0,Math.min(1,Number(a.tribunal_verdict?.certainty_score)||0))},judicial_reasoning_bn:a.judicial_reasoning_bn||"",evidence_analysis:(a.evidence_analysis||[]).map(e=>({source:e.source||"",reliability:"high"===(e.reliability||"").toLowerCase()?"High":"Medium",key_finding_bn:e.key_finding_bn||""})),admin_action:function(e){let t=(e||"").toUpperCase().replace(/\s/g,"_");return l.includes(t)?t:"REFUND_ALL"}(a.admin_action)};return console.log(`[TribunalAgent] Verdict — outcome: ${r.tribunal_verdict.final_outcome}, certainty: ${r.tribunal_verdict.certainty_score}, action: ${r.admin_action}`),r}}};
//# sourceMappingURL=6658.js.map