!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="a5a8f8d9-6ab9-4cb1-aab4-c6a5497a0ef6",e._sentryDebugIdIdentifier="sentry-dbid-a5a8f8d9-6ab9-4cb1-aab4-c6a5497a0ef6")}catch(e){}}(),(()=>{var e={};e.id=7555,e.ids=[7555,9975],e.modules={1708:e=>{"use strict";e.exports=require("node:process")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8086:e=>{"use strict";e.exports=require("module")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11723:e=>{"use strict";e.exports=require("querystring")},11997:e=>{"use strict";e.exports=require("punycode")},12412:e=>{"use strict";e.exports=require("assert")},19063:e=>{"use strict";e.exports=require("require-in-the-middle")},19771:e=>{"use strict";e.exports=require("process")},21820:e=>{"use strict";e.exports=require("os")},27910:e=>{"use strict";e.exports=require("stream")},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:e=>{"use strict";e.exports=require("node:child_process")},33873:e=>{"use strict";e.exports=require("path")},34631:e=>{"use strict";e.exports=require("tls")},36686:e=>{"use strict";e.exports=require("diagnostics_channel")},37067:e=>{"use strict";e.exports=require("node:http")},38522:e=>{"use strict";e.exports=require("node:zlib")},41692:e=>{"use strict";e.exports=require("node:tls")},44708:e=>{"use strict";e.exports=require("node:https")},44725:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=44725,e.exports=t},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:e=>{"use strict";e.exports=require("node:os")},49975:(e,t,r)=>{"use strict";r.d(t,{createClient:()=>i,l:()=>a,r:()=>c});var s=r(53339),o=r(86083);let n=e=>{if("string"==typeof e)try{return/[\u0980-\u09FF]/.test(e),e}catch{return e}return Array.isArray(e)?e.map(n):e&&"object"==typeof e?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,n(t)])):e};async function i(){let e=process.env.NEXT_PUBLIC_SUPABASE_URL||"",t=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";if(!e||!t)throw console.error("Supabase credentials not configured"),Error("Supabase credentials not configured");return(0,s.createServerClient)(e,t,{cookies:{async getAll(){try{return(await (0,o.cookies)()).getAll()}catch{return[]}},async setAll(e){try{let t=await (0,o.cookies)();e.forEach(({name:e,value:r,options:s})=>{t.set(e,r,s)})}catch(e){}}},auth:{autoRefreshToken:!0,persistSession:!0}})}function a(){let e=process.env.NEXT_PUBLIC_SUPABASE_URL||"",t=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";return(0,s.createServerClient)(e,t,{cookies:{getAll:()=>[],setAll(){}},auth:{autoRefreshToken:!1,persistSession:!1}})}async function c(){let e=process.env.NEXT_PUBLIC_SUPABASE_URL||"",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw console.error("Service role key not configured"),Error("Service role credentials not configured");return(0,s.createServerClient)(e,t,{cookies:{async getAll(){try{return(await (0,o.cookies)()).getAll()}catch{return[]}},async setAll(e){try{let t=await (0,o.cookies)();e.forEach(({name:e,value:r,options:s})=>{t.set(e,r,s)})}catch(e){}}},auth:{autoRefreshToken:!1,persistSession:!1}})}},53053:e=>{"use strict";e.exports=require("node:diagnostics_channel")},55511:e=>{"use strict";e.exports=require("crypto")},55591:e=>{"use strict";e.exports=require("https")},56801:e=>{"use strict";e.exports=require("import-in-the-middle")},57075:e=>{"use strict";e.exports=require("node:stream")},57975:e=>{"use strict";e.exports=require("node:util")},62198:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=62198,e.exports=t},62992:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=62992,e.exports=t},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:e=>{"use strict";e.exports=require("node:fs")},73566:e=>{"use strict";e.exports=require("worker_threads")},74075:e=>{"use strict";e.exports=require("zlib")},75919:e=>{"use strict";e.exports=require("node:worker_threads")},76760:e=>{"use strict";e.exports=require("node:path")},77030:e=>{"use strict";e.exports=require("node:net")},78335:()=>{},78474:e=>{"use strict";e.exports=require("node:events")},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},79646:e=>{"use strict";e.exports=require("child_process")},80481:e=>{"use strict";e.exports=require("node:readline")},81630:e=>{"use strict";e.exports=require("http")},83997:e=>{"use strict";e.exports=require("tty")},84297:e=>{"use strict";e.exports=require("async_hooks")},86592:e=>{"use strict";e.exports=require("node:inspector")},91645:e=>{"use strict";e.exports=require("net")},93547:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>P,routeModule:()=>O,serverHooks:()=>T,workAsyncStorage:()=>N,workUnitAsyncStorage:()=>q});var s={};r.r(s),r.d(s,{DELETE:()=>S,GET:()=>A,HEAD:()=>E,OPTIONS:()=>b,PATCH:()=>I,POST:()=>w,PUT:()=>k,dynamic:()=>g,maxDuration:()=>p});var o=r(15043),n=r(35964),i=r(14707),a=r(63033),c=r(49490),u=r(52322),l=r(49975),d=r(68575);let p=60,g="force-dynamic",m="gemini-1.5-flash-002",h="gemini-1.5-pro-002";async function y(e){let t=Math.random().toString(36).substring(7);console.log(`[Vertex API][${t}] Request received`);try{let s,o,n,i=await (0,l.createClient)(),{data:{user:a},error:d}=await i.auth.getUser();if(d||!a)return c.NextResponse.json({error:"Unauthorized"},{status:401});let{type:p,context:g}=await e.json();if(!p||!g)return c.NextResponse.json({error:"Missing type or context"},{status:400});let y=function(){try{let e=process.env.GOOGLE_CLOUD_PROJECT,t=process.env.GEMINI_API_KEY,r=t?"global":process.env.VERTEX_LOCATION||"us-central1";if(!e&&!t)return console.warn("[Vertex API] Neither GOOGLE_CLOUD_PROJECT nor GEMINI_API_KEY set"),null;console.log(`[Vertex API] Initializing with ${t?"API Key":"Service Account"}, location: ${r}`);let s=function(){let e=process.env.GEMINI_API_KEY;if(e)return{apiKey:e};let t=process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;if(t)try{let e=Buffer.from(t,"base64").toString("utf-8"),r=JSON.parse(e);return r.private_key&&(r.private_key=r.private_key.replace(/\\n/g,"\n")),{credentials:r}}catch(e){console.error("[Vertex API] Failed to parse Base64 key:",e)}return{}}();if(t)return new u.VertexAI({project:e||"gen-lang-client-0578182636",location:r,googleAuthOptions:s});return new u.VertexAI({project:e,location:r,googleAuthOptions:s})}catch(e){return console.error("[Vertex API] Failed to init:",e),null}}();if(!y)return c.NextResponse.json({error:"Vertex AI not initialized — check GOOGLE_CLOUD_PROJECT env var"},{status:500});if("content-v2"===p)try{let{runVertexContentAgent:e}=await r.e(4617).then(r.bind(r,76998)),s=await e(g);return console.log(`[Vertex API][${t}] content-v2 Success via MoAgent Garden agent`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] content-v2 error:`,e.message),c.NextResponse.json({error:"MoAgent Content Agent failed",message:e.message},{status:500})}if("osint"===p)try{let{runOSINTAgent:e}=await r.e(3072).then(r.bind(r,93072)),s=await e(g.marketQuestion||g.rawInput||g.title||"",g.existingSources);return console.log(`[Vertex API][${t}] osint Success via MoAgent Garden OSINT agent`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-osint",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] osint error:`,e.message),c.NextResponse.json({error:"MoAgent OSINT Agent failed",message:e.message},{status:500})}if("quant-logic"===p)try{let{runQuantLogicAgent:e}=await r.e(1756).then(r.bind(r,91756)),s=await e(g);return console.log(`[Vertex API][${t}] quant-logic Success via MoAgent Garden agent`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-quant",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] quant-logic error:`,e.message),c.NextResponse.json({error:"MoAgent Quant Logic Agent failed",message:e.message},{status:500})}if("chronos"===p)try{let{runChronosAgent:e}=await r.e(2352).then(r.bind(r,52352)),s=await e(g);return console.log(`[Vertex API][${t}] chronos Success via MoAgent Garden agent`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-chronos",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] chronos error:`,e.message),c.NextResponse.json({error:"MoAgent Chronos Agent failed",message:e.message},{status:500})}if("sentinel"===p)try{let{runSentinelAgent:e}=await r.e(2686).then(r.bind(r,22686)),s=await e({userId:g.userId||"anonymous",behaviorLog:g.behaviorLog,currentTrade:g.currentTrade,marketId:g.marketId,rawQuery:g.rawInput||g.title});return console.log(`[Vertex API][${t}] sentinel Success — risk: ${s.fraud_assessment.risk_score}/10`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-sentinel",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] sentinel error:`,e.message),c.NextResponse.json({error:"MoAgent Sentinel Agent failed",message:e.message},{status:500})}if("oracle-resolve"===p)try{if(g.marketId){let{resolveMarket:e}=await r.e(9460).then(r.bind(r,89460)),s=await e(g.marketId,g.marketQuestion||g.title||g.rawInput||"",g.category,g.resolutionCriteria,g.existingSources);return console.log(`[Vertex API][${t}] oracle-resolve Success — status: ${s.status}`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-oracle",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}let{runOracleGuardianAgent:e}=await r.e(3916).then(r.bind(r,63916)),s=await e(g.marketQuestion||g.title||g.rawInput||"",g.resolutionCriteria,g.existingSources);return console.log(`[Vertex API][${t}] oracle-resolve (raw) Success — outcome: ${s.oracle_decision.outcome}`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-oracle",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] oracle-resolve error:`,e.message),c.NextResponse.json({error:"MoAgent Oracle Guardian failed",message:e.message},{status:500})}if("concierge"===p)try{if(g.userId){let{handleSupportQuery:e}=await r.e(4890).then(r.bind(r,54890)),s=await e(g.message||g.rawInput||g.title||"",g.userId,g.conversationHistory);return console.log(`[Vertex API][${t}] concierge (support) Success — category: ${s.category}`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-concierge",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}let{runConciergeAgent:e}=await r.e(1891).then(r.bind(r,1891)),s=await e({message:g.message||g.rawInput||g.title||"",conversationHistory:g.conversationHistory});return console.log(`[Vertex API][${t}] concierge (raw) Success — category: ${s.category}`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-concierge",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] concierge error:`,e.message),c.NextResponse.json({error:"MoAgent Concierge Agent failed",message:e.message},{status:500})}if("tribunal"===p)try{let{runTribunalAgent:e}=await r.e(6658).then(r.bind(r,26658)),s=await e({marketId:g.marketId||"",marketQuestion:g.marketQuestion||g.title||g.rawInput||"",originalOutcome:g.originalOutcome||"",challengerUserId:g.challengerUserId||g.userId,challengeReason:g.challengeReason,evidenceUrls:g.evidenceUrls||g.existingSources,oracleEvidence:g.oracleEvidence});return console.log(`[Vertex API][${t}] tribunal Success — verdict: ${s.tribunal_verdict.final_outcome}, action: ${s.admin_action}`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-tribunal",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] tribunal error:`,e.message),c.NextResponse.json({error:"MoAgent Tribunal Agent failed",message:e.message},{status:500})}if("growth"===p)try{let{runGrowthAgent:e}=await r.e(4969).then(r.bind(r,84969)),s=await e({topic:g.topic||g.title,category:g.category,rawTrends:g.rawTrends,rawQuery:g.rawInput||g.rawQuery});return console.log(`[Vertex API][${t}] growth Success — VPS: ${s.trend_analysis.viral_score}/10, markets: ${s.market_suggestions.length}`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-growth",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] growth error:`,e.message),c.NextResponse.json({error:"MoAgent Growth Agent failed",message:e.message},{status:500})}if("audit"===p)try{if(g.platformStats){let{runAuditAgent:e}=await r.e(2923).then(r.bind(r,45304)),s=await e({platformStats:g.platformStats,rawQuery:g.rawInput||g.rawQuery,specificUserId:g.userId,specificMarketId:g.marketId});return console.log(`[Vertex API][${t}] audit Success — status: ${s.audit_report.status}`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-audit",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}let{runFiscalAudit:e}=await r.e(6149).then(r.bind(r,56149)),s=await e();return console.log(`[Vertex API][${t}] audit (watchdog) Success — status: ${s.status}`),c.NextResponse.json({success:!0,result:s,provider:"vertex-moagent-audit",model:"gemini-2.5-flash"},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(e){return console.error(`[Vertex API][${t}] audit error:`,e.message),c.NextResponse.json({error:"MoAgent Audit Agent failed",message:e.message},{status:500})}switch(p){case"content":s=`
You are a content optimization AI for a Bangladeshi prediction market platform called Plokymarket.
Analyze this raw input and generate an optimized event.

Raw Input: "${g.rawInput||g.title}"

Generate:
1. An engaging Bengali title (SEO optimized, include year if relevant)
2. A compelling description in Bengali (2-3 sentences)
3. Category: one of [Sports, Politics, Crypto, Weather, Entertainment, Other]
4. Subcategory (specific)
5. Relevant tags array (5-8 tags, mix Bengali and English)
6. SEO score 0-100

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "title": "...",
  "description": "...",
  "category": "...",
  "subcategory": "...",
  "tags": ["..."],
  "seoScore": 0
}`,o=h;break;case"market-logic":s=`
Analyze this Bangladeshi prediction market and determine optimal settings.

Title: "${g.title}"
Category: ${g.category||"Unknown"}
Current Outcomes: ${JSON.stringify(g.outcomes||[])}

Determine:
1. Market type: binary, categorical, or scalar
2. Optimal outcomes array in Bengali (2-4 outcomes)
3. Recommended liquidity in BDT (min 1000)
4. Trading fee as decimal (0.01-0.05)
5. Min/max trade amounts in BDT

Respond ONLY in this JSON format:
{
  "marketType": "binary",
  "outcomes": ["হ্যাঁ", "না"],
  "liquidity": 10000,
  "tradingFee": 0.02,
  "minTrade": 10,
  "maxTrade": 10000
}`,o=m;break;case"timing":s=function(e){let t=new Date().toISOString();return`
Analyze timing for this Bangladeshi prediction market.

Title: "${e.title}"
Category: ${e.category||"Unknown"}
Current Time (UTC): ${t}
Bangladesh is UTC+6 (Asia/Dhaka)

Rules:
- For sports events: close trading 30 minutes before match starts
- For crypto: use short windows (hours to days)
- For politics: longer windows (days to weeks)
- Resolution date should be after trading closes

Respond ONLY in this JSON format (use Asia/Dhaka offset +06:00):
{
  "tradingClosesAt": "2026-03-15T14:00:00+06:00",
  "resolutionDate": "2026-03-15T22:00:00+06:00",
  "warnings": []
}`}(g),o=m;break;case"risk":s=`
Assess compliance and risk for this Bangladeshi prediction market.

Title: "${g.title}"
Description: "${g.description||""}"
Category: ${g.category||"Unknown"}

Check:
1. Bangladesh Cyber Security Act 2023 compliance
2. Political sensitivity (elections, govt officials)
3. Gambling law (must be skill-based prediction, not pure luck)
4. Religious/cultural sensitivity
5. Privacy concerns

Respond ONLY in this JSON format:
{
  "isSafe": true,
  "riskScore": 0,
  "violations": [],
  "recommendations": [],
  "policyChecks": {
    "cyberSecurityAct": true,
    "termsOfService": true,
    "gamblingPolicy": true,
    "politicalSensitivity": true,
    "culturalSensitivity": true
  }
}`,o=m;break;case"market-proposal":s=`
You are an expert prediction market designer for Plokymarket, a Bangladeshi platform.

Event Title: "${g.title}"
Description: "${g.description||""}"
Category: ${g.category||"Unknown"}

Design optimal markets for this event. Create:
1. One primary market (the main prediction question)
2. One or two secondary markets (interesting side predictions)

For each market:
- name: short Bengali label
- question: full Bengali prediction question ending with "?"
- type: "binary" (yes/no) or "categorical" (multiple choices)
- outcomes: Bengali outcome labels array
- suggestedLiquidity: initial liquidity in BDT (1000-50000)
- reasoning: brief explanation (Bengali or English)

Respond ONLY in this JSON format:
{
  "primaryMarket": {
    "name": "...",
    "question": "...",
    "type": "binary",
    "outcomes": ["হ্যাঁ", "না"],
    "suggestedLiquidity": 10000,
    "reasoning": "..."
  },
  "secondaryMarkets": [
    {
      "name": "...",
      "question": "...",
      "type": "binary",
      "outcomes": ["হ্যাঁ", "না"],
      "suggestedLiquidity": 5000,
      "reasoning": "..."
    }
  ],
  "totalSuggestedLiquidity": 15000
}`,o=h;break;default:return c.NextResponse.json({error:"Invalid type",received:p,validTypes:["content","content-v2","osint","quant-logic","chronos","sentinel","oracle-resolve","concierge","tribunal","growth","audit","market-logic","timing","risk","market-proposal"]},{status:400})}console.log(`[Vertex API][${t}] Using model: ${o} for type: ${p}`);let x=y.getGenerativeModel({model:o,generationConfig:{maxOutputTokens:2048,temperature:"risk"===p?.1:.3,responseMimeType:"application/json"},tools:[{googleSearchRetrieval:{disableAttribution:!1}}]});console.log(`[Vertex API][${t}] Calling ${o}...`);let f=await x.generateContent(s),v=f.response.candidates?.[0]?.content?.parts?.[0]?.text;if(!v)return console.error(`[Vertex API][${t}] Empty response from model`),c.NextResponse.json({error:"Empty response from Vertex AI"},{status:500});try{try{n=JSON.parse(v)}catch{let e=v.match(/```(?:json)?\s*([\s\S]*?)```/)||v.match(/(\{[\s\S]*\})/);if(!e)throw Error("No JSON found in response");n=JSON.parse(e[1].trim())}}catch(e){return console.error(`[Vertex API][${t}] Parse error:`,e,"\nRaw:",v),c.NextResponse.json({error:"Invalid JSON from model",raw:v},{status:500})}if("market-proposal"===p&&!n.totalSuggestedLiquidity){let e=n.primaryMarket?.suggestedLiquidity||0,t=(n.secondaryMarkets||[]).reduce((e,t)=>e+(t.suggestedLiquidity||0),0);n.totalSuggestedLiquidity=e+t+1e3}return console.log(`[Vertex API][${t}] Success with ${o}`),c.NextResponse.json({success:!0,result:n,provider:"vertex",model:o},{headers:{"Content-Type":"application/json; charset=utf-8"}})}catch(o){let e=o?.message||"",r=e.includes("not found")||e.includes("deprecated")||e.includes("not supported"),s=e.includes("quota")||e.includes("RESOURCE_EXHAUSTED");return console.error(`[Vertex API][${t}] Error [${r?"MODEL":s?"QUOTA":"GENERAL"}]:`,o),c.NextResponse.json({error:r?"Model unavailable — check Vertex AI model access":s?"Quota exceeded — try again later":"Internal Server Error",message:e,...!1},{status:500})}}let x={...a},f="workUnitAsyncStorage"in x?x.workUnitAsyncStorage:"requestAsyncStorage"in x?x.requestAsyncStorage:void 0;function v(e,t){return"phase-production-build"===process.env.NEXT_PHASE||"function"!=typeof e?e:new Proxy(e,{apply:(e,r,s)=>{let o;try{let e=f?.getStore();o=e?.headers}catch{}return d.wrapRouteHandlerWithSentry(e,{method:t,parameterizedRoute:"/api/ai/vertex-generate",headers:o}).apply(r,s)}})}let A=v(void 0,"GET"),w=v(y,"POST"),k=v(void 0,"PUT"),I=v(void 0,"PATCH"),S=v(void 0,"DELETE"),E=v(void 0,"HEAD"),b=v(void 0,"OPTIONS"),O=new o.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/ai/vertex-generate/route",pathname:"/api/ai/vertex-generate",filename:"route",bundlePath:"app/api/ai/vertex-generate/route"},resolvedPagePath:"/root/workspace/plokymarket/apps/web/src/app/api/ai/vertex-generate/route.ts",nextConfigOutput:"standalone",userland:s}),{workAsyncStorage:N,workUnitAsyncStorage:q,serverHooks:T}=O;function P(){return(0,i.patchFetch)({workAsyncStorage:N,workUnitAsyncStorage:q})}},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{},98629:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=98629,e.exports=t}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[4707,8575,816,6083,7185,3339,8965,694,2322],()=>r(93547));module.exports=s})();
//# sourceMappingURL=route.js.map