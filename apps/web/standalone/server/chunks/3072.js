"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="7111ec7d-79e9-4fb7-a2ee-b30146e4be69",e._sentryDebugIdIdentifier="sentry-dbid-7111ec7d-79e9-4fb7-a2ee-b30146e4be69")}catch(e){}}(),exports.id=3072,exports.ids=[3072],exports.modules={93072:(e,t,i)=>{i.d(t,{runOSINTAgent:()=>a,y:()=>l});let n="gemini-2.5-flash",r="gemini-2.0-flash-001",o=`# ROLE: Senior Market Analyst & OSINT Specialist (Polymarket BD)
Your role is to transform raw news into an "Institutional Grade" prediction market. You must prioritize authenticity, specific citations, and neutral terminology.

# CORE OPERATIONAL FRAMEWORK:
1. ENTITY & EXPERT EXTRACTION: Identify specific people (Govenors, Analysts, Ministers), their exact titles, and their statements.
2. SOURCE TIERS: Prioritize Official Reports (Bangladesh Bank, BBS, IMF) > Tier 1 News (Prothom Alo, Daily Star) > Expert Interviews.
3. TEMPORAL PRECISION: Always include the date of the statement or report (e.g., "১৫ অক্টোবর ২০২৪ তারিখে প্রকাশিত প্রতিবেদন অনুযায়ী").
4. RESOLUTION CRITERIA: Define exactly how the "YES" or "NO" outcome will be verified.

# WRITING GUIDELINES (BANGLA):
- Use "Professional News Reporting" style. Avoid emotional adjectives.
- Instead of "অনেকে মনে করছেন", use "অর্থনীতিবিদ ডঃ [নাম]-এর মতে" or "বিশ্বব্যাংকের [তারিখ]-এর প্রতিবেদন অনুযায়ী".
- Title must be a neutral, objective question.

# OUTPUT STRUCTURE (STRICT JSON):
Every response must follow this schema:
{
  "market_details": {
    "title_bn": "শুদ্ধ বাংলায় শিরোনাম",
    "description_bn": "বিস্তারিত বর্ণনা (বিশেষজ্ঞের নাম ও উক্তি সহ)",
    "category": "Economy | Politics | Sports | Crypto"
  },
  "citations": [
    {
      "expert_name": "ব্যক্তির নাম",
      "designation": "পদবি",
      "statement": "সরাসরি উক্তি বা সারসংক্ষেপ",
      "date": "YYYY-MM-DD",
      "source_url": "URL if available"
    }
  ],
  "resolution_source": {
    "primary_link": "প্রধান যাচাইযোগ্য লিঙ্ক",
    "backup_sources": ["সোর্স ১", "সোর্স ২"],
    "criteria_bn": "মার্কেটটি কীভাবে মীমাংসা হবে তার শর্ত বাংলায়"
  },
  "authenticity_score": "1-10 (Based on source reliability)"
}`;async function s(e,t,i=n){let a=`https://generativelanguage.googleapis.com/v1beta/models/${i}:generateContent?key=${t}`,l=await fetch(a,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:o}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.2,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!l.ok){let o=await l.text();if(i===n&&(o.includes("not found")||o.includes("not supported")||o.includes("is not available")))return console.warn(`[OSINTAgent] ${n} unavailable, falling back to ${r}`),s(e,t,r);throw Error(`OSINT Agent Gemini API error (${l.status}): ${o.substring(0,300)}`)}let c=await l.json(),u=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!u)throw Error("Empty response from OSINT Agent");return u}async function a(e,t){let i=process.env.GEMINI_API_KEY;if(!i)throw Error("GEMINI_API_KEY not configured — cannot run OSINT Agent");let r=Date.now();console.log("[OSINTAgent] Starting OSINT analysis for:",e.substring(0,80));let o="";if(t&&t.length>0){let e=t.sort((e,t)=>t.credibilityScore-e.credibilityScore).slice(0,5);o=`

Existing evidence already collected (cross-reference and verify these):
${e.map((e,t)=>`${t+1}. [${e.sourceType}] ${e.title} — "${e.content.substring(0,150)}..." (credibility: ${e.credibilityScore})`).join("\n")}`}let a=`Analyze the following prediction market question and provide a comprehensive OSINT verification report.

Market Question: "${e}"
${o}

Use Google Search to find the latest information, expert opinions, and official data. Verify all claims against official Bangladesh government sources, Bangladesh Bank, BBS, and Tier 1 news outlets (Prothom Alo, Daily Star, bdnews24).

Generate the full analysis following the strict JSON schema.`,l=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let i=e.match(/\{[\s\S]*\}/);if(i)return JSON.parse(i[0]);throw Error("Could not parse JSON from OSINT Agent response")}(await s(a,i)),c=l.market_details||l,u=c.title_bn||c.title||e,d=c.description_bn||c.description||"",p=c.category||"Other",g=(l.citations||[]).map(e=>({expert_name:e.expert_name||"",designation:e.designation||"",statement:e.statement||"",date:e.date||"",source_url:e.source_url||""})),f={primary_link:l.resolution_source?.primary_link||"",backup_sources:l.resolution_source?.backup_sources||[],criteria_bn:l.resolution_source?.criteria_bn||""},m=Number(l.authenticity_score)||5,y=Date.now()-r;return console.log(`[OSINTAgent] Complete — score: ${m}/10, citations: ${g.length}, time: ${y}ms`),{agentType:"osint",title_bn:u,description_bn:d,category:p,citations:g,resolution_source:f,authenticity_score:m,executionTimeMs:y,model:n,sourcesVerified:g.length}}function l(e){return e.citations.filter(e=>e.source_url).map((e,t)=>({id:`osint-citation-${t}`,url:e.source_url,title:`${e.expert_name} — ${e.designation}`,content:e.statement,sourceType:"news",sourceTier:function(e){let t=e.toLowerCase();return t.includes(".gov.bd")||t.includes("bb.org.bd")||t.includes("bbs.gov.bd")||t.includes("imf.org")||t.includes("worldbank.org")?"primary":t.includes("prothomalo.com")||t.includes("thedailystar.net")||t.includes("bdnews24.com")||t.includes("reuters.com")||t.includes("bbc.com")?"secondary":"tertiary"}(e.source_url),authorityScore:.8,publishedAt:e.date||new Date().toISOString(),retrievedAt:new Date().toISOString(),credibilityScore:.8,relevanceScore:.9,rawMetadata:{author:e.expert_name,source:e.source_url,language:"bn",isBengaliContent:!0,osintVerified:!0}}))}}};
//# sourceMappingURL=3072.js.map