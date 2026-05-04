"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},o=(new e.Error).stack;o&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[o]="edc5f3c1-44dc-4cf5-9aa5-9f62ac103113",e._sentryDebugIdIdentifier="sentry-dbid-edc5f3c1-44dc-4cf5-9aa5-9f62ac103113")}catch(e){}}(),exports.id=9460,exports.ids=[3916,9460],exports.modules={63916:(e,o,t)=>{t.d(o,{XZ:()=>u,runOracleGuardianAgent:()=>c});let r="gemini-2.5-flash",n="gemini-2.0-flash-001",i=`# ROLE: Chief Truth Officer & Oracle Specialist (Plokymarket BD)
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
}`;async function a(e,o,t=r){let s=`https://generativelanguage.googleapis.com/v1beta/models/${t}:generateContent?key=${o}`,c=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:i}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.05,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!c.ok){let i=await c.text();if(t===r&&(i.includes("not found")||i.includes("not supported")||i.includes("is not available")))return console.warn(`[OracleGuardian] ${r} unavailable, falling back to ${n}`),a(e,o,n);throw Error(`Oracle Guardian Gemini error (${c.status}): ${i.substring(0,300)}`)}let u=await c.json(),l=u.candidates?.[0]?.content?.parts?.[0]?.text;if(!l)throw Error("Empty response from Oracle Guardian");return l}let s=["YES","NO","UNRESOLVED","CANCELLED"];async function c(e,o,t){let r=process.env.GEMINI_API_KEY;if(!r)throw Error("GEMINI_API_KEY not configured — cannot run Oracle Guardian");console.log("[OracleGuardian] Starting resolution analysis for:",e.substring(0,80));let n="";t&&t.length>0&&(n=`

Existing Evidence Sources:
${t.map((e,o)=>`${o+1}. ${e}`).join("\n")}`);let i=`Resolve the following Plokymarket BD prediction market with absolute accuracy.

Market Question: "${e}"
${o?`Resolution Criteria: "${o}"`:""}
Current Time (UTC): ${new Date().toISOString()}
${n}

MANDATORY STEPS:
1. Use Google Search to find the LATEST information from Tier 1 and Tier 2 Bangladesh sources.
2. Cross-reference at least 2 independent sources before making a decision.
3. If sources conflict or the event hasn't occurred yet, set outcome to "UNRESOLVED".
4. Extract a direct Bengali quote from the primary source.
5. Generate the full Oracle decision following the strict JSON schema.`,c=function(e){try{return JSON.parse(e)}catch{}let o=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(o)try{return JSON.parse(o[1].trim())}catch{}let t=e.match(/\{[\s\S]*\}/);if(t)return JSON.parse(t[0]);throw Error("Could not parse JSON from Oracle Guardian response")}(await a(i,r)),u={oracle_decision:{outcome:function(e){let o=(e||"").toUpperCase();return s.includes(o)?o:"UNRESOLVED"}(c.oracle_decision?.outcome),confidence_score:Math.max(0,Math.min(1,Number(c.oracle_decision?.confidence_score)||0)),certainty_level_bn:c.oracle_decision?.certainty_level_bn||""},evidence_vault:{primary_source:c.evidence_vault?.primary_source||"",supporting_sources:c.evidence_vault?.supporting_sources||[],extracted_quote_bn:c.evidence_vault?.extracted_quote_bn||""},resolution_summary_bn:c.resolution_summary_bn||"",metadata:{processed_at:c.metadata?.processed_at||new Date().toISOString(),source_consistency:function(e){let o=(e||"").toUpperCase();return"CONSISTENT"===o?"CONSISTENT":"CONFLICTING"===o?"CONFLICTING":"CONSISTENT"}(c.metadata?.source_consistency)}};return console.log(`[OracleGuardian] Complete — outcome: ${u.oracle_decision.outcome}, confidence: ${u.oracle_decision.confidence_score}, consistency: ${u.metadata.source_consistency}`),u}function u(e,o){let t=o?.toLowerCase()==="sports"?.9:(o?.toLowerCase(),.95);return e.oracle_decision.confidence_score>=t&&"UNRESOLVED"!==e.oracle_decision.outcome&&"CANCELLED"!==e.oracle_decision.outcome&&"CONSISTENT"===e.metadata.source_consistency}},89460:(e,o,t)=>{t.d(o,{resolveMarket:()=>n});var r=t(63916);async function n(e,o,n,i,a){console.log(`[Resolution] Starting resolution for market ${e}: "${o}"`);try{let s=await (0,r.runOracleGuardianAgent)(o,i,a),c=(0,r.XZ)(s,n),{createClient:u}=await Promise.resolve().then(t.bind(t,49975)),l=await u();if(c)return console.log(`[Resolution] ✅ Auto-resolving market ${e} — outcome: ${s.oracle_decision.outcome}, confidence: ${s.oracle_decision.confidence_score}`),await l.from("markets").update({status:"resolved",resolution_outcome:s.oracle_decision.outcome,resolution_details:JSON.stringify({agent:"Oracle_Guardian_BD_Prime",confidence:s.oracle_decision.confidence_score,primary_source:s.evidence_vault.primary_source,supporting_sources:s.evidence_vault.supporting_sources,summary_bn:s.resolution_summary_bn,source_consistency:s.metadata.source_consistency,auto_resolved:!0,resolved_at:new Date().toISOString()}),resolved_at:new Date().toISOString()}).eq("id",e),await l.from("oracle_verifications").insert({market_id:e,verification_type:"oracle_guardian_auto",confidence_score:s.oracle_decision.confidence_score,outcome:s.oracle_decision.outcome,reasoning:s.resolution_summary_bn,evidence:JSON.stringify(s.evidence_vault),status:"verified",created_at:new Date().toISOString()}),{status:"RESOLVED",outcome:s.oracle_decision.outcome,confidence:s.oracle_decision.confidence_score,autoResolved:!0,oracleResult:s,summaryBn:s.resolution_summary_bn};return console.log(`[Resolution] ⏳ Sending market ${e} to manual review — confidence: ${s.oracle_decision.confidence_score}`),await l.from("markets").update({status:"awaiting_review",resolution_details:JSON.stringify({agent:"Oracle_Guardian_BD_Prime",confidence:s.oracle_decision.confidence_score,outcome_suggestion:s.oracle_decision.outcome,primary_source:s.evidence_vault.primary_source,supporting_sources:s.evidence_vault.supporting_sources,summary_bn:s.resolution_summary_bn,source_consistency:s.metadata.source_consistency,auto_resolved:!1,reviewed_at:new Date().toISOString()})}).eq("id",e),await l.from("oracle_verifications").insert({market_id:e,verification_type:"oracle_guardian_pending",confidence_score:s.oracle_decision.confidence_score,outcome:s.oracle_decision.outcome,reasoning:s.resolution_summary_bn,evidence:JSON.stringify(s.evidence_vault),status:"pending",created_at:new Date().toISOString()}),{status:"AWAITING_REVIEW",outcome:s.oracle_decision.outcome,confidence:s.oracle_decision.confidence_score,autoResolved:!1,oracleResult:s,summaryBn:s.resolution_summary_bn}}catch(o){return console.error(`[Resolution] ❌ Failed to resolve market ${e}:`,o),{status:"FAILED",outcome:"UNRESOLVED",confidence:0,autoResolved:!1,oracleResult:{oracle_decision:{outcome:"UNRESOLVED",confidence_score:0,certainty_level_bn:"ত্রুটির কারণে নির্ধারণ করা সম্ভব হয়নি"},evidence_vault:{primary_source:"",supporting_sources:[],extracted_quote_bn:""},resolution_summary_bn:"ওরাকল এজেন্ট প্রক্রিয়াকরণে ত্রুটি ঘটেছে। অ্যাডমিন ম্যানুয়ালি রিভিউ করুন।",metadata:{processed_at:new Date().toISOString(),source_consistency:"CONFLICTING"}},summaryBn:"ওরাকল এজেন্ট প্রক্রিয়াকরণে ত্রুটি ঘটেছে। অ্যাডমিন ম্যানুয়ালি রিভিউ করুন।"}}}}};
//# sourceMappingURL=9460.js.map