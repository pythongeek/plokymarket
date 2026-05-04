!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="50e2364a-de08-4614-99eb-7129d9f20962",e._sentryDebugIdIdentifier="sentry-dbid-50e2364a-de08-4614-99eb-7129d9f20962")}catch(e){}}(),(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[80],{1679:(e,t,a)=>{"use strict";a.r(t),a.d(t,{ComponentMod:()=>q,default:()=>B});var i,r={};a.r(r),a.d(r,{DELETE:()=>C,GET:()=>E,HEAD:()=>P,OPTIONS:()=>R,PATCH:()=>T,POST:()=>x,PUT:()=>w,runtime:()=>m});var o={};a.r(o),a.d(o,{patchFetch:()=>M,routeModule:()=>I,serverHooks:()=>A,workAsyncStorage:()=>D,workUnitAsyncStorage:()=>N});var n=a(1496),s=a(1599),c=a(3657),l=a(3586),d=a(7755),p=a(5010),u=a(424),f=a(2110),g=a(8202);let m="edge",y={name:e=>`
You are an AI assistant for Plokymarket, a Bangladesh prediction market platform.
Suggest a catchy, engaging event title based on the context.

Current Title: "${e.name||"empty"}"
Category: ${e.category}
Context: ${e.description||"N/A"}

=== BANGLADESH CONTEXT ===
Sports: BPL, Cricket, Football - use team names like Dhaka, Chattogram, Khulna, Cumilla
Politics: Elections, City Corporation - use party names, leader names
Economy: USD-BDT rate, inflation, stock market
Entertainment: Bollywood, Dhallywood, K-pop

REQUIREMENTS:
- Catchy title in Bengali/English mix
- Max 100 characters
- Include key terms for searchability
- Clear prediction topic

Return JSON:
{
  "value": "suggested title",
  "confidence": 85,
  "reasoning": "why this title works",
  "alternatives": ["alt1", "alt2"]
}
`,question:e=>`
Formulate a clear Yes/No prediction question for this event.

Title: "${e.name}"
Current Question: "${e.question||"empty"}"
Category: ${e.category}

=== REQUIREMENTS ===
- Clear Yes/No answer
- Verifiable outcome
- Specific timeframe
- Unambiguous language
- Mix of Bengali and English

Return JSON:
{
  "value": "Will [event] happen by [date]?",
  "confidence": 90,
  "reasoning": "explanation",
  "alternatives": ["alt question 1", "alt question 2"]
}
`,description:e=>`
Write a compelling description for this prediction market event.

Title: "${e.name}"
Question: "${e.question}"
Category: ${e.category}

=== BANGLADESH CONTEXT ===
Include relevant local context:
- Sports: Team form, player stats, head-to-head
- Politics: Recent polls, candidate popularity
- Economy: Current rates, trends

Return JSON:
{
  "value": "2-3 sentence description",
  "confidence": 80,
  "reasoning": "why this description is effective"
}
`,category:e=>`
Determine the best category for this event.

Title: "${e.name}"
Description: "${e.description||"N/A"}"

Available categories:
- sports (BPL, Cricket, Football, IPL)
- politics (Elections, City Corporation)
- economy (USD-BDT, Inflation, Stock)
- entertainment (Bollywood, Movies)
- technology (AI, Crypto, Mobile)
- international (Global events)
- social (Trends, Festivals)
- weather (Cyclone, Monsoon)

Return JSON:
{
  "value": "category_name",
  "confidence": 95,
  "reasoning": "why this category fits"
}
`,tags:e=>`
Suggest relevant tags for this event.

Title: "${e.name}"
Category: ${e.category}
Description: "${e.description||"N/A"}"

=== REQUIREMENTS ===
- 3-5 tags
- Mix of Bengali and English
- Searchable keywords
- Popular terms
- Comma-separated

Return JSON:
{
  "value": "tag1, tag2, tag3, tag4",
  "confidence": 85,
  "reasoning": "why these tags"
}
`,trading_closes_at:e=>`
Suggest appropriate trading end date for this event.

Title: "${e.name}"
Category: ${e.category}

=== GUIDELINES ===
- Sports: 1-7 days before match
- Politics: 1-3 days before election
- Economy: 7-30 days for predictions
- Entertainment: Before release/announcement

Return JSON:
{
  "value": "2024-03-15T18:00:00",
  "confidence": 80,
  "reasoning": "why this date"
}
`};async function h(e){let t=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:e}]}],generationConfig:{temperature:.7,maxOutputTokens:1024}})});if(!t.ok)throw Error("Gemini API failed");let a=await t.json(),i=a.candidates?.[0]?.content?.parts?.[0]?.text;if(!i)throw Error("No content from Gemini");try{let e=i.match(/\{[\s\S]*\}/);if(e)return JSON.parse(e[0])}catch(e){console.error("JSON parse error:",i)}return null}async function v(e){let t=Date.now();try{let{field:a,current_data:i,context:r}=await e.json();if(!a||!y[a])return f.Rp.json({error:"Invalid field"},{status:400});let o=y[a](i),n=await h(o);if(!n)throw Error("Failed to generate suggestion");return f.Rp.json({success:!0,suggestion:{value:n.value,confidence:n.confidence||80,reasoning:n.reasoning||"AI generated suggestion",alternatives:n.alternatives||[]},execution_time_ms:Date.now()-t})}catch(e){return console.error("Field suggestion error:",e),f.Rp.json({error:e.message},{status:500})}}let b={...u},S="workUnitAsyncStorage"in b?b.workUnitAsyncStorage:"requestAsyncStorage"in b?b.requestAsyncStorage:void 0;function k(e,t){return"phase-production-build"===process.env.NEXT_PHASE||"function"!=typeof e?e:new Proxy(e,{apply:(e,a,i)=>{let r;try{let e=S?.getStore();r=e?.headers}catch{}return g.f(e,{method:t,parameterizedRoute:"/api/ai/suggest-field",headers:r}).apply(a,i)}})}let E=k(void 0,"GET"),x=k(v,"POST"),w=k(void 0,"PUT"),T=k(void 0,"PATCH"),C=k(void 0,"DELETE"),P=k(void 0,"HEAD"),R=k(void 0,"OPTIONS"),I=new l.AppRouteRouteModule({definition:{kind:d.A.APP_ROUTE,page:"/api/ai/suggest-field/route",pathname:"/api/ai/suggest-field",filename:"route",bundlePath:"app/api/ai/suggest-field/route"},resolvedPagePath:"/root/workspace/plokymarket/apps/web/src/app/api/ai/suggest-field/route.ts",nextConfigOutput:"standalone",userland:r}),{workAsyncStorage:D,workUnitAsyncStorage:N,serverHooks:A}=I;function M(){return(0,p.V5)({workAsyncStorage:D,workUnitAsyncStorage:N})}let O=null==(i=self.__RSC_MANIFEST)?void 0:i["/api/ai/suggest-field/route"],_=(e=>e?JSON.parse(e):void 0)(self.__RSC_SERVER_MANIFEST);O&&_&&(0,s.fQ)({page:"/api/ai/suggest-field/route",clientReferenceManifest:O,serverActionsManifest:_,serverModuleMap:(0,n.e)({serverActionsManifest:_})});let q=o,B=c.s.wrap(I,{nextConfig:{env:{_sentryRewriteFramesDistDir:".next",_sentryRewriteFramesAssetPrefixPath:"",_sentryRelease:"1a41ba1a652cdb1d6f9b856030f430a312dea476"},eslint:{ignoreDuringBuilds:!0},typescript:{ignoreBuildErrors:!0,tsconfigPath:"tsconfig.json"},distDir:".next",cleanDistDir:!0,assetPrefix:"",cacheMaxMemorySize:0x3200000,configOrigin:"next.config.js",useFileSystemPublicRoutes:!0,generateEtags:!0,pageExtensions:["tsx","ts","jsx","js"],poweredByHeader:!0,compress:!0,images:{deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[16,32,48,64,96,128,256,384],path:"/_next/image",loader:"default",loaderFile:"",domains:[],disableStaticImages:!1,minimumCacheTTL:60,formats:["image/webp"],dangerouslyAllowSVG:!1,contentSecurityPolicy:"script-src 'none'; frame-src 'none'; sandbox;",contentDispositionType:"attachment",remotePatterns:[],unoptimized:!1},devIndicators:{position:"bottom-left"},onDemandEntries:{maxInactiveAge:6e4,pagesBufferLength:5},amp:{canonicalBase:""},basePath:"",sassOptions:{},trailingSlash:!1,i18n:null,productionBrowserSourceMaps:!1,excludeDefaultMomentLocales:!0,serverRuntimeConfig:{},publicRuntimeConfig:{},reactProductionProfiling:!1,reactStrictMode:null,reactMaxHeadersLength:6e3,httpAgentOptions:{keepAlive:!0},logging:{},expireTime:31536e3,staticPageGenerationTimeout:60,output:"standalone",modularizeImports:{"@mui/icons-material":{transform:"@mui/icons-material/{{member}}"},lodash:{transform:"lodash/{{member}}"}},outputFileTracingRoot:"/root/workspace/plokymarket/apps/web",experimental:{nodeMiddleware:!1,cacheLife:{default:{stale:300,revalidate:900,expire:0xfffffffe},seconds:{stale:0,revalidate:1,expire:60},minutes:{stale:300,revalidate:60,expire:3600},hours:{stale:300,revalidate:3600,expire:86400},days:{stale:300,revalidate:86400,expire:604800},weeks:{stale:300,revalidate:604800,expire:2592e3},max:{stale:300,revalidate:2592e3,expire:0xfffffffe}},cacheHandlers:{},cssChunking:!0,multiZoneDraftMode:!1,appNavFailHandling:!1,prerenderEarlyExit:!0,serverMinification:!0,serverSourceMaps:!1,linkNoTouchStart:!1,caseSensitiveRoutes:!1,clientSegmentCache:!1,dynamicOnHover:!1,preloadEntriesOnStart:!0,clientRouterFilter:!0,clientRouterFilterRedirects:!1,fetchCacheKeyPrefix:"",middlewarePrefetch:"flexible",optimisticClientCache:!0,manualClientBasePath:!1,cpus:1,memoryBasedWorkersCount:!1,imgOptConcurrency:null,imgOptTimeoutInSeconds:7,imgOptMaxInputPixels:0xfff8001,imgOptSequentialRead:null,isrFlushToDisk:!0,workerThreads:!1,optimizeCss:!1,nextScriptWorkers:!1,scrollRestoration:!1,externalDir:!1,disableOptimizedLoading:!1,gzipSize:!0,craCompat:!1,esmExternals:!0,fullySpecified:!1,swcTraceProfiling:!1,forceSwcTransforms:!1,largePageDataBytes:128e3,typedRoutes:!1,typedEnv:!1,clientTraceMetadata:["baggage","sentry-trace"],parallelServerCompiles:!1,parallelServerBuildTraces:!1,ppr:!1,authInterrupts:!1,webpackMemoryOptimizations:!1,optimizeServerReact:!0,useEarlyImport:!1,viewTransition:!1,routerBFCache:!1,staleTimes:{dynamic:0,static:300},serverComponentsHmrCache:!0,staticGenerationMaxConcurrency:8,staticGenerationMinPagesPerWorker:25,dynamicIO:!1,inlineCss:!1,useCache:!1,optimizePackageImports:["lucide-react","date-fns","lodash-es","ramda","antd","react-bootstrap","ahooks","@ant-design/icons","@headlessui/react","@headlessui-float/react","@heroicons/react/20/solid","@heroicons/react/24/solid","@heroicons/react/24/outline","@visx/visx","@tremor/react","rxjs","@mui/material","@mui/icons-material","recharts","react-use","effect","@effect/schema","@effect/platform","@effect/platform-node","@effect/platform-browser","@effect/platform-bun","@effect/sql","@effect/sql-mssql","@effect/sql-mysql2","@effect/sql-pg","@effect/sql-squlite-node","@effect/sql-squlite-bun","@effect/sql-squlite-wasm","@effect/sql-squlite-react-native","@effect/rpc","@effect/rpc-http","@effect/typeclass","@effect/experimental","@effect/opentelemetry","@material-ui/core","@material-ui/icons","@tabler/icons-react","mui-core","react-icons/ai","react-icons/bi","react-icons/bs","react-icons/cg","react-icons/ci","react-icons/di","react-icons/fa","react-icons/fa6","react-icons/fc","react-icons/fi","react-icons/gi","react-icons/go","react-icons/gr","react-icons/hi","react-icons/hi2","react-icons/im","react-icons/io","react-icons/io5","react-icons/lia","react-icons/lib","react-icons/lu","react-icons/md","react-icons/pi","react-icons/ri","react-icons/rx","react-icons/si","react-icons/sl","react-icons/tb","react-icons/tfi","react-icons/ti","react-icons/vsc","react-icons/wi"]},htmlLimitedBots:"Mediapartners-Google|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti",bundlePagesRouterDependencies:!1,configFile:"/root/workspace/plokymarket/apps/web/next.config.js",configFileName:"next.config.js",serverExternalPackages:["pg","pgpass","pg-pool","amqplib","connect","dataloader","express","generic-pool","graphql","@hapi/hapi","ioredis","kafkajs","koa","lru-memoizer","mongodb","mongoose","mysql","mysql2","knex","pg","pg-pool","@node-redis/client","@redis/client","redis","tedious"],turbopack:{root:"/root/workspace/plokymarket/apps/web"}}})},5356:e=>{"use strict";e.exports=require("node:buffer")},5521:e=>{"use strict";e.exports=require("node:async_hooks")},6487:()=>{},8335:()=>{}},e=>{var t=t=>e(e.s=t);e.O(0,[227],()=>t(1679));var a=e.O();(_ENTRIES="undefined"==typeof _ENTRIES?{}:_ENTRIES)["middleware_app/api/ai/suggest-field/route"]=a}]);
//# sourceMappingURL=route.js.map