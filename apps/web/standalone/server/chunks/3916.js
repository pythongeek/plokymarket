"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="4ee6d544-981a-42b4-a424-ec5d1d05963a",e._sentryDebugIdIdentifier="sentry-dbid-4ee6d544-981a-42b4-a424-ec5d1d05963a")}catch(e){}}(),exports.id=3916,exports.ids=[3916],exports.modules={63916:(e,t,o)=>{o.d(t,{XZ:()=>l,runOracleGuardianAgent:()=>c});let r="gemini-2.5-flash",n="gemini-2.0-flash-001",a=`# ROLE: Chief Truth Officer & Oracle Specialist (Plokymarket BD)
You are the final arbiter of truth for Plokymarket Bangladesh. Your mission is to provide 100% accurate, evidence-backed resolutions for prediction markets using a Tiered Source Strategy.

# CORE OPERATIONAL PROTOCOLS:

1. TIERED SOURCE AUTHORITY (TSA):
   - Tier 1 (Official): Bangladesh Bank, Election Commission BD, Supreme Court, ICC/BCB Official Portals. (Weight: 1.0)
   - Tier 2 (Validated News): Prothom Alo, Daily Star, BDNews24, Ittefaq. (Weight: 0.8)
   - Tier 3 (Broadcasting): Jamuna TV, Somoy News, Independent TV (Verified Portals only). (Weight: 0.6)
   - STRICT RULE: Ignore all Social Media (Facebook, X, TikTok) and unverified blogs.

2. BENGALI KEYWORD TUNING & CONTEXT:
   - Identify local political and social triggers: "হরতাল" (Strike), "অবরোধ" (Blockade), "তত্ত্বাবধায়ক" (Caretaker), "গেজেট" (Gazette).
   - Understand the difference between a "Propose" (প্রস্তাব) and a "Passed/Effective" (কার্যকর) law or event.

3. CONFIDENCE THRESHOLD & RESOLUTION:
   - Political Events: Require 95%+ Confidence and at least two Tier 1 or Tier 2 sources.
   - Sports Events: Require 90%+ Confidence from official scorecards.
   - If Confidence is < 90% due to conflicting reports, set status as "UNRESOLVED".

4. ANTI-FAKE NEWS SHIELD:
   - Scan for "Clickbait" patterns in Bangla news.
   - Cross-check timestamps: If only one source reports something and others don't follow within 2 hours, flag as "SUSPICIOUS".

# OUTPUT SCHEMA (STRICT JSON):
{
  "oracle_decision": {
    "outcome": "YES | NO | UNRESOLVED | CANCELLED",
    "confidence_score": 0.00-1.00,
    "certainty_level_bn": "নিশ্চয়তার মাত্রা (যেমন: অত্যন্ত উচ্চ)"
  },
  "evidence_vault": {
    "primary_source": "URL of the most authoritative source",
    "supporting_sources": ["URL 1", "URL 2"],
    "extracted_quote_bn": "সোর্স থেকে প্রাপ্ত মূল তথ্য বা উক্তি বাংলায়"
  },
  "resolution_summary_bn": "ফলাফল ঘোষণার সপক্ষে চূড়ান্ত যুক্তি বাংলায়",
  "metadata": {
    "processed_at": "ISO 8601",
    "source_consistency": "CONSISTENT | CONFLICTING"
  }
}`;async function i(e,t,o=r){let s=`https://generativelanguage.googleapis.com/v1beta/models/${o}:generateContent?key=${t}`,c=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:a}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.05,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!c.ok){let a=await c.text();if(o===r&&(a.includes("not found")||a.includes("not supported")||a.includes("is not available")))return console.warn(`[OracleGuardian] ${r} unavailable, falling back to ${n}`),i(e,t,n);throw Error(`Oracle Guardian Gemini error (${c.status}): ${a.substring(0,300)}`)}let l=await c.json(),u=l.candidates?.[0]?.content?.parts?.[0]?.text;if(!u)throw Error("Empty response from Oracle Guardian");return u}let s=["YES","NO","UNRESOLVED","CANCELLED"];async function c(e,t,o){let r=process.env.GEMINI_API_KEY;if(!r)throw Error("GEMINI_API_KEY not configured — cannot run Oracle Guardian");console.log("[OracleGuardian] Starting resolution analysis for:",e.substring(0,80));let n="";o&&o.length>0&&(n=`

Existing Evidence Sources:
${o.map((e,t)=>`${t+1}. ${e}`).join("\n")}`);let a=`Resolve the following Plokymarket BD prediction market with absolute accuracy.

Market Question: "${e}"
${t?`Resolution Criteria: "${t}"`:""}
Current Time (UTC): ${new Date().toISOString()}
${n}

MANDATORY STEPS:
1. Use Google Search to find the LATEST information from Tier 1 and Tier 2 Bangladesh sources.
2. Cross-reference at least 2 independent sources before making a decision.
3. If sources conflict or the event hasn't occurred yet, set outcome to "UNRESOLVED".
4. Extract a direct Bengali quote from the primary source.
5. Generate the full Oracle decision following the strict JSON schema.`,c=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let o=e.match(/\{[\s\S]*\}/);if(o)return JSON.parse(o[0]);throw Error("Could not parse JSON from Oracle Guardian response")}(await i(a,r)),l={oracle_decision:{outcome:function(e){let t=(e||"").toUpperCase();return s.includes(t)?t:"UNRESOLVED"}(c.oracle_decision?.outcome),confidence_score:Math.max(0,Math.min(1,Number(c.oracle_decision?.confidence_score)||0)),certainty_level_bn:c.oracle_decision?.certainty_level_bn||""},evidence_vault:{primary_source:c.evidence_vault?.primary_source||"",supporting_sources:c.evidence_vault?.supporting_sources||[],extracted_quote_bn:c.evidence_vault?.extracted_quote_bn||""},resolution_summary_bn:c.resolution_summary_bn||"",metadata:{processed_at:c.metadata?.processed_at||new Date().toISOString(),source_consistency:function(e){let t=(e||"").toUpperCase();return"CONSISTENT"===t?"CONSISTENT":"CONFLICTING"===t?"CONFLICTING":"CONSISTENT"}(c.metadata?.source_consistency)}};return console.log(`[OracleGuardian] Complete — outcome: ${l.oracle_decision.outcome}, confidence: ${l.oracle_decision.confidence_score}, consistency: ${l.metadata.source_consistency}`),l}function l(e,t){let o=t?.toLowerCase()==="sports"?.9:(t?.toLowerCase(),.95);return e.oracle_decision.confidence_score>=o&&"UNRESOLVED"!==e.oracle_decision.outcome&&"CANCELLED"!==e.oracle_decision.outcome&&"CONSISTENT"===e.metadata.source_consistency}}};
//# sourceMappingURL=3916.js.map