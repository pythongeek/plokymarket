!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="d0ab6915-054a-47b9-8736-b712ac419139",e._sentryDebugIdIdentifier="sentry-dbid-d0ab6915-054a-47b9-8736-b712ac419139")}catch(e){}}(),(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[827],{1038:(e,t,a)=>{"use strict";a.d(t,{createClient:()=>s,r:()=>n});var r=a(2888),i=a(8700);let o=e=>{if("string"==typeof e)try{return/[\u0980-\u09FF]/.test(e),e}catch{return e}return Array.isArray(e)?e.map(o):e&&"object"==typeof e?Object.fromEntries(Object.entries(e).map(([e,t])=>[e,o(t)])):e};async function s(){let e=process.env.NEXT_PUBLIC_SUPABASE_URL||"",t=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";if(!e||!t)throw console.error("Supabase credentials not configured"),Error("Supabase credentials not configured");return(0,r.createServerClient)(e,t,{cookies:{async getAll(){try{return(await (0,i.UL)()).getAll()}catch{return[]}},async setAll(e){try{let t=await (0,i.UL)();e.forEach(({name:e,value:a,options:r})=>{t.set(e,a,r)})}catch(e){}}},auth:{autoRefreshToken:!0,persistSession:!0}})}async function n(){let e=process.env.NEXT_PUBLIC_SUPABASE_URL||"",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw console.error("Service role key not configured"),Error("Service role credentials not configured");return(0,r.createServerClient)(e,t,{cookies:{async getAll(){try{return(await (0,i.UL)()).getAll()}catch{return[]}},async setAll(e){try{let t=await (0,i.UL)();e.forEach(({name:e,value:a,options:r})=>{t.set(e,a,r)})}catch(e){}}},auth:{autoRefreshToken:!1,persistSession:!1}})}},3954:(e,t,a)=>{"use strict";a.r(t),a.d(t,{ComponentMod:()=>L,default:()=>q});var r,i={};a.r(i),a.d(i,{DELETE:()=>C,GET:()=>T,HEAD:()=>P,OPTIONS:()=>x,PATCH:()=>A,POST:()=>v,PUT:()=>_,runtime:()=>h});var o={};a.r(o),a.d(o,{patchFetch:()=>D,routeModule:()=>R,serverHooks:()=>M,workAsyncStorage:()=>O,workUnitAsyncStorage:()=>I});var s=a(1496),n=a(1599),c=a(3657),l=a(3586),p=a(7755),d=a(5010),u=a(424),g=a(2110),f=a(1038),m=a(8202);let h="edge";async function y(e){let t=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:e}]}],generationConfig:{temperature:.7,maxOutputTokens:2048}})});if(!t.ok)throw Error("Gemini API failed");let a=await t.json(),r=a.candidates?.[0]?.content?.parts?.[0]?.text;if(!r)throw Error("No content from Gemini");try{let e=r.match(/\{[\s\S]*\}/);if(e)return JSON.parse(e[0])}catch(e){console.error("JSON parse error:",r)}return null}async function S(e,t,a){let r=process.env.TELEGRAM_BOT_TOKEN,i=process.env.TELEGRAM_CHAT_ID;if(!r||!i)return;let o=`
🤖 <b>AI Topic Generation Complete</b>

📌 Topic: ${t}
✅ Generated: ${a} suggestions
🔧 Workflow: ${e}
⏰ Time: ${new Date().toLocaleString("bn-BD")}

🔗 <a href="https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/events/create/ai-assisted">Review</a>
  `.trim();try{await fetch(`https://api.telegram.org/bot${r}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:i,text:o,parse_mode:"HTML"})})}catch(e){console.error("Notification error:",e)}}async function w(e){let t=Date.now();try{if(!e.headers.get("upstash-signature"))return g.Rp.json({error:"Unauthorized"},{status:401});let{workflow_id:a,topic:r,context:i,variations:o,suggestion_ids:s}=await e.json(),n=await (0,f.r)(),c=[];for(let e=0;e<o;e++)try{let t=function(e,t,a){let r=`
=== BANGLADESH CONTEXT (Primary Focus) ===
Sports:
- BPL (Bangladesh Premier League): Dhaka, Chattogram, Khulna, Rajshahi, Sylhet, Rangpur, Cumilla, Barishal
- National Team: Shakib Al Hasan, Tamim Iqbal, Mushfiqur Rahim, Liton Das
- Cricket: vs India, Pakistan, Australia, England, Sri Lanka
- Football: Abahani, Mohammedan, Bashundhara Kings
- Upcoming: Asia Cup, World Cup qualifiers

Politics:
- National Elections (জাতীয় নির্বাচন)
- City Corporation: Dhaka North/South, Chattogram, Khulna, Rajshahi
- Political Parties: Awami League, BNP, Jatiya Party
- Key Figures: PM Sheikh Hasina, leaders

Economy:
- USD-BDT Exchange Rate (current: 120-125 TK per USD)
- Inflation: Rice, Onion, Oil prices
- Stock Market: DSE Index, Chittagong Stock Exchange
- Remittance: Middle East, Malaysia, Singapore, UK
- IMF Loan discussions and policies

Entertainment:
- Bollywood: SRK, Salman Khan, Amir Khan releases
- Dhallywood: Bangladeshi cinema
- International: Hollywood Marvel/DC, Oscar
- Music: K-pop trends in Bangladesh

Technology:
- Mobile: iPhone, Samsung, Xiaomi, Realme
- AI: ChatGPT, Google Gemini updates
- Crypto: Bitcoin, Ethereum trends
- Social Media: Viral trends

Social:
- Festivals: Eid-ul-Fitr, Eid-ul-Adha, Puja
- Education: HSC, SSC, University results
- Weather: Cyclone, Monsoon, Floods
- Viral: Social media trends
`,i=`
=== INTERNATIONAL CONTEXT (Secondary) ===
Sports: IPL, FIFA World Cup, Premier League, Olympics
Global: US Elections, Geopolitics, Oil prices
Tech: Apple, Google, Microsoft, AI developments
`,o=["Focus on Bangladesh local context with specific teams/players/politicians","Focus on economic impact and market predictions","Focus on international comparison and global trends"];return`
You are an AI assistant for Plokymarket, a Bangladesh prediction market platform.
Generate a prediction market event based on the following topic.

TOPIC: "${e}"
${t?`ADDITIONAL CONTEXT: "${t}"`:""}

${r}

${i}

VARIATION FOCUS: ${o[a%o.length]}

REQUIREMENTS:
1. Title: Catchy Bengali title (max 100 chars)
2. Question: Clear YES/NO question in Bengali/English mix
3. Description: Detailed context in Bengali
4. Category: One of [sports, politics, economy, entertainment, technology, international, social, weather]
5. Subcategory: Specific area
6. Tags: 3-5 relevant keywords (Bengali + English)
7. Trading End: Suggest appropriate date (7-30 days from now)
8. Confidence: 0-100 score based on predictability
9. Trending: 0-100 score based on current relevance
10. Reasoning: Why this is a good prediction market topic
11. Sources: 2-3 relevant news source URLs

OUTPUT FORMAT (JSON):
{
  "title": "Bengali title",
  "question": "Clear YES/NO question",
  "description": "Detailed Bengali description",
  "category": "category_name",
  "subcategory": "specific_area",
  "tags": ["tag1", "tag2", "tag3"],
  "trading_end": "2024-03-15T18:00:00Z",
  "confidence_score": 85,
  "trending_score": 78,
  "reasoning": "Why this topic works",
  "sources": ["https://prothomalo.com/...", "https://espncricinfo.com/..."]
}

Generate variation ${a+1} of ${o.length}.
`}(r,i,e),o=await y(t);if(o&&s[e]){let{data:t,error:r}=await n.from("ai_daily_topics").update({suggested_title:o.title,suggested_question:o.question,suggested_description:o.description,suggested_category:o.category,suggested_subcategory:o.subcategory,suggested_tags:o.tags,suggested_trading_end:o.trading_end,ai_confidence:o.confidence_score,trending_score:o.trending_score,ai_reasoning:o.reasoning,source_urls:o.sources,status:"pending",workflow_id:a}).eq("id",s[e]).select().single();!r&&t&&c.push(t)}}catch(t){console.error(`Variation ${e} error:`,t)}return await S(a,r,c.length),g.Rp.json({success:!0,workflow_id:a,generated:c.length,execution_time_ms:Date.now()-t})}catch(e){return console.error("Workflow processor error:",e),g.Rp.json({error:e.message},{status:500})}}let b={...u},k="workUnitAsyncStorage"in b?b.workUnitAsyncStorage:"requestAsyncStorage"in b?b.requestAsyncStorage:void 0;function E(e,t){return"phase-production-build"===process.env.NEXT_PHASE||"function"!=typeof e?e:new Proxy(e,{apply:(e,a,r)=>{let i;try{let e=k?.getStore();i=e?.headers}catch{}return m.f(e,{method:t,parameterizedRoute:"/api/ai/workflow-processor",headers:i}).apply(a,r)}})}let T=E(void 0,"GET"),v=E(w,"POST"),_=E(void 0,"PUT"),A=E(void 0,"PATCH"),C=E(void 0,"DELETE"),P=E(void 0,"HEAD"),x=E(void 0,"OPTIONS"),R=new l.AppRouteRouteModule({definition:{kind:p.A.APP_ROUTE,page:"/api/ai/workflow-processor/route",pathname:"/api/ai/workflow-processor",filename:"route",bundlePath:"app/api/ai/workflow-processor/route"},resolvedPagePath:"/root/workspace/plokymarket/apps/web/src/app/api/ai/workflow-processor/route.ts",nextConfigOutput:"standalone",userland:i}),{workAsyncStorage:O,workUnitAsyncStorage:I,serverHooks:M}=R;function D(){return(0,d.V5)({workAsyncStorage:O,workUnitAsyncStorage:I})}let B=null==(r=self.__RSC_MANIFEST)?void 0:r["/api/ai/workflow-processor/route"],N=(e=>e?JSON.parse(e):void 0)(self.__RSC_SERVER_MANIFEST);B&&N&&(0,n.fQ)({page:"/api/ai/workflow-processor/route",clientReferenceManifest:B,serverActionsManifest:N,serverModuleMap:(0,s.e)({serverActionsManifest:N})});let L=o,q=c.s.wrap(R,{nextConfig:{env:{_sentryRewriteFramesDistDir:".next",_sentryRewriteFramesAssetPrefixPath:"",_sentryRelease:"1a41ba1a652cdb1d6f9b856030f430a312dea476"},eslint:{ignoreDuringBuilds:!0},typescript:{ignoreBuildErrors:!0,tsconfigPath:"tsconfig.json"},distDir:".next",cleanDistDir:!0,assetPrefix:"",cacheMaxMemorySize:0x3200000,configOrigin:"next.config.js",useFileSystemPublicRoutes:!0,generateEtags:!0,pageExtensions:["tsx","ts","jsx","js"],poweredByHeader:!0,compress:!0,images:{deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[16,32,48,64,96,128,256,384],path:"/_next/image",loader:"default",loaderFile:"",domains:[],disableStaticImages:!1,minimumCacheTTL:60,formats:["image/webp"],dangerouslyAllowSVG:!1,contentSecurityPolicy:"script-src 'none'; frame-src 'none'; sandbox;",contentDispositionType:"attachment",remotePatterns:[],unoptimized:!1},devIndicators:{position:"bottom-left"},onDemandEntries:{maxInactiveAge:6e4,pagesBufferLength:5},amp:{canonicalBase:""},basePath:"",sassOptions:{},trailingSlash:!1,i18n:null,productionBrowserSourceMaps:!1,excludeDefaultMomentLocales:!0,serverRuntimeConfig:{},publicRuntimeConfig:{},reactProductionProfiling:!1,reactStrictMode:null,reactMaxHeadersLength:6e3,httpAgentOptions:{keepAlive:!0},logging:{},expireTime:31536e3,staticPageGenerationTimeout:60,output:"standalone",modularizeImports:{"@mui/icons-material":{transform:"@mui/icons-material/{{member}}"},lodash:{transform:"lodash/{{member}}"}},outputFileTracingRoot:"/root/workspace/plokymarket/apps/web",experimental:{nodeMiddleware:!1,cacheLife:{default:{stale:300,revalidate:900,expire:0xfffffffe},seconds:{stale:0,revalidate:1,expire:60},minutes:{stale:300,revalidate:60,expire:3600},hours:{stale:300,revalidate:3600,expire:86400},days:{stale:300,revalidate:86400,expire:604800},weeks:{stale:300,revalidate:604800,expire:2592e3},max:{stale:300,revalidate:2592e3,expire:0xfffffffe}},cacheHandlers:{},cssChunking:!0,multiZoneDraftMode:!1,appNavFailHandling:!1,prerenderEarlyExit:!0,serverMinification:!0,serverSourceMaps:!1,linkNoTouchStart:!1,caseSensitiveRoutes:!1,clientSegmentCache:!1,dynamicOnHover:!1,preloadEntriesOnStart:!0,clientRouterFilter:!0,clientRouterFilterRedirects:!1,fetchCacheKeyPrefix:"",middlewarePrefetch:"flexible",optimisticClientCache:!0,manualClientBasePath:!1,cpus:1,memoryBasedWorkersCount:!1,imgOptConcurrency:null,imgOptTimeoutInSeconds:7,imgOptMaxInputPixels:0xfff8001,imgOptSequentialRead:null,isrFlushToDisk:!0,workerThreads:!1,optimizeCss:!1,nextScriptWorkers:!1,scrollRestoration:!1,externalDir:!1,disableOptimizedLoading:!1,gzipSize:!0,craCompat:!1,esmExternals:!0,fullySpecified:!1,swcTraceProfiling:!1,forceSwcTransforms:!1,largePageDataBytes:128e3,typedRoutes:!1,typedEnv:!1,clientTraceMetadata:["baggage","sentry-trace"],parallelServerCompiles:!1,parallelServerBuildTraces:!1,ppr:!1,authInterrupts:!1,webpackMemoryOptimizations:!1,optimizeServerReact:!0,useEarlyImport:!1,viewTransition:!1,routerBFCache:!1,staleTimes:{dynamic:0,static:300},serverComponentsHmrCache:!0,staticGenerationMaxConcurrency:8,staticGenerationMinPagesPerWorker:25,dynamicIO:!1,inlineCss:!1,useCache:!1,optimizePackageImports:["lucide-react","date-fns","lodash-es","ramda","antd","react-bootstrap","ahooks","@ant-design/icons","@headlessui/react","@headlessui-float/react","@heroicons/react/20/solid","@heroicons/react/24/solid","@heroicons/react/24/outline","@visx/visx","@tremor/react","rxjs","@mui/material","@mui/icons-material","recharts","react-use","effect","@effect/schema","@effect/platform","@effect/platform-node","@effect/platform-browser","@effect/platform-bun","@effect/sql","@effect/sql-mssql","@effect/sql-mysql2","@effect/sql-pg","@effect/sql-squlite-node","@effect/sql-squlite-bun","@effect/sql-squlite-wasm","@effect/sql-squlite-react-native","@effect/rpc","@effect/rpc-http","@effect/typeclass","@effect/experimental","@effect/opentelemetry","@material-ui/core","@material-ui/icons","@tabler/icons-react","mui-core","react-icons/ai","react-icons/bi","react-icons/bs","react-icons/cg","react-icons/ci","react-icons/di","react-icons/fa","react-icons/fa6","react-icons/fc","react-icons/fi","react-icons/gi","react-icons/go","react-icons/gr","react-icons/hi","react-icons/hi2","react-icons/im","react-icons/io","react-icons/io5","react-icons/lia","react-icons/lib","react-icons/lu","react-icons/md","react-icons/pi","react-icons/ri","react-icons/rx","react-icons/si","react-icons/sl","react-icons/tb","react-icons/tfi","react-icons/ti","react-icons/vsc","react-icons/wi"]},htmlLimitedBots:"Mediapartners-Google|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti",bundlePagesRouterDependencies:!1,configFile:"/root/workspace/plokymarket/apps/web/next.config.js",configFileName:"next.config.js",serverExternalPackages:["pg","pgpass","pg-pool","amqplib","connect","dataloader","express","generic-pool","graphql","@hapi/hapi","ioredis","kafkajs","koa","lru-memoizer","mongodb","mongoose","mysql","mysql2","knex","pg","pg-pool","@node-redis/client","@redis/client","redis","tedious"],turbopack:{root:"/root/workspace/plokymarket/apps/web"}}})},5356:e=>{"use strict";e.exports=require("node:buffer")},5521:e=>{"use strict";e.exports=require("node:async_hooks")},6487:()=>{},8335:()=>{}},e=>{var t=t=>e(e.s=t);e.O(0,[227,792,549],()=>t(3954));var a=e.O();(_ENTRIES="undefined"==typeof _ENTRIES?{}:_ENTRIES)["middleware_app/api/ai/workflow-processor/route"]=a}]);
//# sourceMappingURL=route.js.map