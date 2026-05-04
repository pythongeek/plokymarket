!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="bbb86cea-98c6-4dcf-9b5d-e7d3060bc0b3",e._sentryDebugIdIdentifier="sentry-dbid-bbb86cea-98c6-4dcf-9b5d-e7d3060bc0b3")}catch(e){}}(),(()=>{var e={};e.id=964,e.ids=[964],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8086:e=>{"use strict";e.exports=require("module")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19063:e=>{"use strict";e.exports=require("require-in-the-middle")},19771:e=>{"use strict";e.exports=require("process")},21820:e=>{"use strict";e.exports=require("os")},24275:(e,t,r)=>{"use strict";r.a(e,async(e,s)=>{try{r.d(t,{Fd:()=>a,H:()=>n,P:()=>c,TF:()=>u,Yr:()=>l,pool:()=>p,yo:()=>d});var o=r(64939),i=e([o]);let p=new(o=(i.then?(await i)():i)[0]).Pool({host:process.env.LOCAL_DB_HOST||"127.0.0.1",port:parseInt(process.env.LOCAL_DB_PORT||"5433"),database:process.env.LOCAL_DB_NAME||"polymarket",user:process.env.LOCAL_DB_USER||"postgres",password:process.env.LOCAL_DB_PASSWORD||"postgres",max:10,idleTimeoutMillis:3e4,connectionTimeoutMillis:5e3});async function n(e){return(await p.query(`SELECT is_admin, is_super_admin, email, full_name
     FROM user_profiles
     WHERE id = $1`,[e])).rows[0]||null}async function a(e,t,r=!0,s=!1){await p.query(`INSERT INTO user_profiles (id, email, is_admin, is_super_admin, kyc_status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'approved', NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       is_admin = EXCLUDED.is_admin,
       is_super_admin = EXCLUDED.is_super_admin,
       updated_at = NOW()`,[e,t,r,s])}async function c(e,t=[]){return(await p.query(e,t)).rows}async function l(e,t,r="*"){if(Array.isArray(t)){if(0===t.length)return[];let s=Object.keys(t[0]),o=s.join(", "),i=t.map((e,t)=>"("+s.map((e,r)=>`$${t*s.length+r+1}`).join(", ")+")").join(", "),n=t.flatMap(e=>s.map(t=>e[t]));return(await p.query(`INSERT INTO ${e} (${o}) VALUES ${i} RETURNING ${r}`,n)).rows}let s=Object.keys(t),o=Object.values(t),i=s.map((e,t)=>`$${t+1}`).join(", "),n=s.join(", ");return(await p.query(`INSERT INTO ${e} (${n}) VALUES (${i}) RETURNING ${r}`,o)).rows}async function d(e,t,r,s="*"){let o=Object.keys(t),i=Object.keys(r),n=[...Object.values(t),...Object.values(r)],a=o.map((e,t)=>`${e} = $${t+1}`).join(", "),c=i.map((e,t)=>`${e} = $${o.length+t+1}`).join(" AND ");return(await p.query(`UPDATE ${e} SET ${a} WHERE ${c} RETURNING ${s}`,n)).rows}async function u(e,t){let r=Object.keys(t),s=Object.values(t),o=r.map((e,t)=>`${e} = $${t+1}`).join(" AND ");return(await p.query(`DELETE FROM ${e} WHERE ${o}`,s)).rowCount||0}p.on("error",e=>{console.error("[local-db] Unexpected pool error:",e.message)}),s()}catch(e){s(e)}})},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:e=>{"use strict";e.exports=require("node:child_process")},33873:e=>{"use strict";e.exports=require("path")},36686:e=>{"use strict";e.exports=require("diagnostics_channel")},37067:e=>{"use strict";e.exports=require("node:http")},38522:e=>{"use strict";e.exports=require("node:zlib")},41692:e=>{"use strict";e.exports=require("node:tls")},44708:e=>{"use strict";e.exports=require("node:https")},44725:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=44725,e.exports=t},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:e=>{"use strict";e.exports=require("node:os")},53053:e=>{"use strict";e.exports=require("node:diagnostics_channel")},55511:e=>{"use strict";e.exports=require("crypto")},56801:e=>{"use strict";e.exports=require("import-in-the-middle")},57075:e=>{"use strict";e.exports=require("node:stream")},57975:e=>{"use strict";e.exports=require("node:util")},62198:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=62198,e.exports=t},62992:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=62992,e.exports=t},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},64939:e=>{"use strict";e.exports=import("pg")},73024:e=>{"use strict";e.exports=require("node:fs")},73566:e=>{"use strict";e.exports=require("worker_threads")},75919:e=>{"use strict";e.exports=require("node:worker_threads")},76760:e=>{"use strict";e.exports=require("node:path")},77030:e=>{"use strict";e.exports=require("node:net")},78335:()=>{},78474:e=>{"use strict";e.exports=require("node:events")},79551:e=>{"use strict";e.exports=require("url")},79646:e=>{"use strict";e.exports=require("child_process")},80481:e=>{"use strict";e.exports=require("node:readline")},84297:e=>{"use strict";e.exports=require("async_hooks")},86592:e=>{"use strict";e.exports=require("node:inspector")},89107:(e,t,r)=>{"use strict";r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{DELETE:()=>T,GET:()=>y,HEAD:()=>v,OPTIONS:()=>w,PATCH:()=>_,POST:()=>E,PUT:()=>f,runtime:()=>m});var o=r(63033),i=r(49490),n=r(24275),a=r(68575),c=e([n]);n=(c.then?(await c)():c)[0];let m="nodejs";async function l(e){try{let t={Sports:"BPL 2024 ongoing, Bangladesh vs Sri Lanka series upcoming, IPL 2024 auction completed",Politics:"Upcoming City Corporation elections, National budget preparation",Economy:"USD rate fluctuating around 120-125 BDT, Inflation concerns, IMF loan discussions",Entertainment:"New Bollywood releases, Bangladeshi film industry developments",Technology:"AI advancements, iPhone 16 rumors, Crypto market volatility",International:"US Election 2024, Global climate summit, Major sporting events"};return e.map(e=>`${e}: ${t[e]||"General trends"}`).join("\n")}catch(e){return"Using general context"}}async function d(e){let t=process.env.TELEGRAM_BOT_TOKEN,r=process.env.TELEGRAM_CHAT_ID;if(t&&r)try{await fetch(`https://api.telegram.org/bot${t}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:r,text:e,parse_mode:"HTML"})})}catch(e){console.error("Telegram notification failed:",e)}}async function u(e){let t=Date.now();try{let{custom_prompt:s,categories:o=["Sports","Politics","Economy","Entertainment"],count:a=5,admin_id:c}=await e.json(),{pool:u}=await Promise.resolve().then(r.bind(r,24275)),p=(await u.query("SELECT * FROM admin_ai_settings LIMIT 1").catch(()=>({rows:[]}))).rows[0],m=await l(o),g=`
You are an AI assistant for a Bangladesh prediction market platform called "Plokymarket".
Generate ${a} engaging prediction market topics that users would want to trade on.

=== CONTEXT ===
Region: ${p?.target_region||"Bangladesh"} (Primary) + International
Current Date: ${new Date().toISOString().split("T")[0]}
Categories: ${o.join(", ")}

=== TRENDING NEWS ===
${m}

=== CUSTOM INSTRUCTION ===
${s||p?.custom_instruction||"Generate engaging prediction market topics"}

=== BANGLADESH CONTEXT (High Priority) ===
Sports:
- BPL (Bangladesh Premier League) cricket matches and player performances
- Bangladesh national team matches (vs India, Pakistan, Australia, etc.)
- Shakib Al Hasan, Tamim Iqbal, Mushfiqur Rahim performances
- Local football leagues (Abahani, Mohammedan, Bashundhara Kings)

Economy:
- USD to BDT exchange rate (currently around 120-125 TK)
- Inflation rate and commodity prices (rice, onion, oil)
- Stock market (DSE index) movements
- Remittance flow trends
- IMF loan and economic policies

Politics:
- Upcoming elections (National, City Corporation)
- Political party activities and alliances
- Government policy changes
- Infrastructure projects (Padma Bridge, Metro Rail, Expressway)

Social/Culture:
- Eid festivals and holidays
- Educational exam results (HSC, SSC, University)
- Weather events (floods, cyclones, monsoon)
- Viral social media trends in Bangladesh

=== INTERNATIONAL CONTEXT (Include if globally significant) ===
Sports:
- ICC World Cup, T20 World Cup, Champions Trophy
- IPL (Indian Premier League) - very popular in Bangladesh
- FIFA World Cup, Premier League, Champions League
- Olympics medal predictions

Global Events:
- US Presidential elections and policies
- Major geopolitical events affecting South Asia
- Global tech company earnings (affects Bangladesh market)
- International oil prices
- Climate change summits and agreements

Entertainment:
- Bollywood blockbuster releases (Salman Khan, Shahrukh Khan movies)
- Hollywood Marvel/DC movies
- International award shows (Oscars, Grammy)
- K-pop and global music trends popular in Bangladesh

Technology:
- iPhone/Samsung new releases
- AI developments (ChatGPT, Google Bard updates)
- Crypto market movements (Bitcoin, Ethereum)
- Major tech company announcements

=== REQUIREMENTS ===
1. Mix of Bangladesh local (60%) and International (40%) topics
2. Questions must have clear YES/NO outcomes
3. Events should resolve within 7-30 days
4. Use Bengali for titles and descriptions, English for technical terms
5. Include specific numbers, dates, and names for credibility
6. Avoid controversial or sensitive political topics
7. Focus on events that have verifiable outcomes

=== OUTPUT FORMAT ===
Return ONLY a JSON array in this exact format:
[
  {
    "title": "Short catchy title in Bengali (e.g., 'বিপিএল ফাইনালে কুমিল্লা জিতবে?')",
    "question": "Clear YES/NO question in Bengali (e.g., 'বিপিএল ২০২৪ ফাইনালে কুমিল্লা ভিক্টোরিয়ান্স কি চ্যাম্পিয়ন হবে?')",
    "description": "Detailed description in Bengali with context and why it matters",
    "category": "One of: ${o.join(", ")}",
    "reasoning": "Why this topic is relevant and timely - mention specific dates, players, or events",
    "confidence": 0.85
  }
]

Generate exactly ${a} high-quality topics.`,h=process.env.GEMINI_API_KEY;if(!h)throw Error("GEMINI_API_KEY not configured");let y=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${h}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:g}]}],generationConfig:{temperature:.7,maxOutputTokens:2048}})});if(!y.ok){let e=await y.json();throw Error(`Gemini API error: ${e.error?.message||y.statusText}`)}let E=await y.json(),f=E.candidates?.[0]?.content?.parts?.[0]?.text;if(!f)throw Error("No content generated from AI");let _=[];try{let e=f.match(/```json\n?([\s\S]*?)\n?```/)||f.match(/\[([\s\S]*)\]/),t=e?e[1]||e[0]:f;_=JSON.parse(t.trim())}catch(e){throw console.error("Failed to parse AI response:",f),Error("Failed to parse AI generated topics")}let T=_.filter(e=>e.title&&e.question&&e.category).map(e=>({suggested_title:e.title,suggested_question:e.question,suggested_description:e.description||"",suggested_category:e.category,ai_reasoning:e.reasoning||"",ai_confidence:Math.min(Math.max(e.confidence||.5,0),1),status:"pending"}));if(0===T.length)throw Error("No valid topics generated");let v=await (0,n.Yr)("ai_daily_topics",T.map(e=>({...e,created_at:new Date().toISOString()})));try{await u.query(`
                INSERT INTO admin_activity_logs
                    (admin_id, action_type, resource_type, new_values, ip_address, created_at)
                VALUES ($1, 'create_event', 'ai_topics', $2, 'unknown', NOW())
            `,[c,JSON.stringify({generated_count:T.length,categories:o})])}catch(e){console.warn("[generate-topics] Failed to log admin action:",e)}let w=`
🤖 <b>AI Daily Topics Generated</b>

📊 <b>Count:</b> ${T.length} topics
🏷️ <b>Categories:</b> ${o.join(", ")}
⏱️ <b>Time:</b> ${Date.now()-t}ms

${T.map((e,t)=>`${t+1}. ${e.suggested_title}`).join("\n")}

🔗 <a href="https://polymarketbd.com/sys-cmd-7x9k2/daily-topics">Review Topics</a>
        `.trim();return await d(w),i.NextResponse.json({success:!0,generated:T.length,topics:v,execution_time_ms:Date.now()-t})}catch(e){return console.error("Topic generation error:",e),i.NextResponse.json({error:e.message,execution_time_ms:Date.now()-t},{status:500})}}let g={...o},h="workUnitAsyncStorage"in g?g.workUnitAsyncStorage:"requestAsyncStorage"in g?g.requestAsyncStorage:void 0;function p(e,t){return"phase-production-build"===process.env.NEXT_PHASE||"function"!=typeof e?e:new Proxy(e,{apply:(e,r,s)=>{let o;try{let e=h?.getStore();o=e?.headers}catch{}return a.wrapRouteHandlerWithSentry(e,{method:t,parameterizedRoute:"/api/admin/generate-topics",headers:o}).apply(r,s)}})}let y=p(void 0,"GET"),E=p(u,"POST"),f=p(void 0,"PUT"),_=p(void 0,"PATCH"),T=p(void 0,"DELETE"),v=p(void 0,"HEAD"),w=p(void 0,"OPTIONS");s()}catch(e){s(e)}})},94499:(e,t,r)=>{"use strict";r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{patchFetch:()=>l,routeModule:()=>d,serverHooks:()=>m,workAsyncStorage:()=>u,workUnitAsyncStorage:()=>p});var o=r(15043),i=r(35964),n=r(14707),a=r(89107),c=e([a]);a=(c.then?(await c)():c)[0];let d=new o.AppRouteRouteModule({definition:{kind:i.RouteKind.APP_ROUTE,page:"/api/admin/generate-topics/route",pathname:"/api/admin/generate-topics",filename:"route",bundlePath:"app/api/admin/generate-topics/route"},resolvedPagePath:"/root/workspace/plokymarket/apps/web/src/app/api/admin/generate-topics/route.ts",nextConfigOutput:"standalone",userland:a}),{workAsyncStorage:u,workUnitAsyncStorage:p,serverHooks:m}=d;function l(){return(0,n.patchFetch)({workAsyncStorage:u,workUnitAsyncStorage:p})}s()}catch(e){s(e)}})},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{},98629:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=98629,e.exports=t}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[4707,8575,816],()=>r(94499));module.exports=s})();
//# sourceMappingURL=route.js.map