"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="ee3c476d-3024-416b-a08a-77abb994bcad",e._sentryDebugIdIdentifier="sentry-dbid-ee3c476d-3024-416b-a08a-77abb994bcad")}catch(e){}}(),exports.id=7795,exports.ids=[7795],exports.modules={37795:(e,t,n)=>{n.d(t,{runVertexContentAgent:()=>l});let i="gemini-2.5-flash",o="gemini-2.0-flash-001",r=`# ROLE: Senior Market Analyst & OSINT Specialist (Polymarket BD)
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
}`,s={Economy:"Economics",Politics:"Politics",Sports:"Sports",Crypto:"Crypto"};async function a(e,t,n=i){let s=`https://generativelanguage.googleapis.com/v1beta/models/${n}:generateContent?key=${t}`,l=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:r}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.3,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!l.ok){let r=await l.text();if(n===i&&(r.includes("not found")||r.includes("not supported")||r.includes("is not available")))return console.warn(`[VertexContentAgent] ${i} unavailable, falling back to ${o}`),a(e,t,o);throw Error(`Gemini API error (${l.status}): ${r.substring(0,300)}`)}let c=await l.json(),u=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!u)throw Error("Empty response from Gemini Content Agent");return u}async function l(e){let t,n=process.env.GEMINI_API_KEY;if(!n)throw Error("GEMINI_API_KEY not configured — cannot run Vertex Content Agent");let i=e.rawInput||e.title||"";console.log("[VertexContentAgent] Starting analysis for:",i.substring(0,60));let o=`Analyze the following raw news/topic for a Bangladeshi prediction market and create an institutional-grade market.

Raw Input: "${i}"
${e.category?`Suggested Category: ${e.category}`:""}
${e.description?`Additional Context: "${e.description}"`:""}

Use Google Search to find the latest information, expert opinions, and official data about this topic. Then generate the full market content following the strict JSON schema.`,r=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let n=e.match(/\{[\s\S]*\}/);if(n)return JSON.parse(n[0]);throw Error("Could not parse JSON from Gemini Content Agent response")}(await a(o,n)),l=r.market_details||r,c=l.title_bn||l.title||i,u=l.description_bn||l.description||"",d=l.category||e.category||"Other",p=function(e){if(s[e])return s[e];let t=Object.keys(s).find(t=>t.toLowerCase()===e.toLowerCase());return t?s[t]:e||"Other"}(d),g=(r.citations||[]).map(e=>({expert_name:e.expert_name||"",designation:e.designation||"",statement:e.statement||"",date:e.date||"",source_url:e.source_url||""})),h={primary_link:r.resolution_source?.primary_link||"",backup_sources:r.resolution_source?.backup_sources||[],criteria_bn:r.resolution_source?.criteria_bn||""},m=Number(r.authenticity_score)||5,f=function(e,t,n){let i=[e.toLowerCase()];n.length>0&&i.push("expert-analysis");let o=t.toLowerCase();return(o.includes("cricket")||o.includes("ক্রিকেট")||o.includes("বিপিএল"))&&i.push("cricket","bangladesh","sports"),(o.includes("bitcoin")||o.includes("বিটকয়েন")||o.includes("crypto"))&&i.push("crypto","price-prediction"),(o.includes("election")||o.includes("নির্বাচন")||o.includes("ভোট"))&&i.push("election","bangladesh","politics"),(o.includes("inflation")||o.includes("মূল্যস্ফীতি")||o.includes("gdp"))&&i.push("economy","bangladesh-bank"),i.push("prediction"),[...new Set(i)]}(p,c,g),y=(t=40,c.length>=20&&c.length<=80&&(t+=15),(c.includes("?")||c.includes("?"))&&(t+=5),u.length>=100&&(t+=10),u.length>=200&&(t+=5),t+=Math.min(15,5*g.length),Math.min(100,t+=Math.min(10,m))),b=Math.min(1,Math.max(.1,m/10)),_=g.filter(e=>e.source_url).map(e=>e.source_url);return console.log(`[VertexContentAgent] Complete — category: ${p}, score: ${m}/10, citations: ${g.length}`),{title_bn:c,description_bn:u,citations:g,resolution_source:h,authenticity_score:m,title:c,description:u,category:p,subcategory:d,tags:f,seoScore:y,confidence:b,sources:_}}}};
//# sourceMappingURL=7795.js.map