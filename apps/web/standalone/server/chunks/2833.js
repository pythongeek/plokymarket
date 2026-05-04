"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="38c7861f-cee7-4df0-8b15-fcc9fae9fb50",e._sentryDebugIdIdentifier="sentry-dbid-38c7861f-cee7-4df0-8b15-fcc9fae9fb50")}catch(e){}}(),exports.id=2833,exports.ids=[15,2833],exports.modules={40015:(e,t,i)=>{i.d(t,{CATEGORY_AGENT_PROMPT:()=>a,CONTENT_AGENT_PROMPT:()=>r,SLUG_AGENT_PROMPT:()=>o,VALIDATION_AGENT_PROMPT:()=>n});let o=`
You are a URL slug generator for Plokymarket, a Bangladesh prediction market platform.

YOUR TASK:
Convert event titles into SEO-friendly, URL-safe slugs optimized for Bangladesh audience.

RULES:
1. Transliterate Bengali text to English romanization using standard conventions
2. Use only lowercase letters (a-z), numbers (0-9), and hyphens (-)
3. Remove all special characters, punctuation, and extra spaces
4. Keep slug under 60 characters for optimal SEO
5. Include relevant keywords for Bangladesh market searchability
6. Make it human-readable and descriptive

TRANSLITERATION GUIDE:
- বাংলাদেশ → bangladesh
- বিপিএল → bpl
- ক্রিকেট → cricket
- নির্বাচন → election
- জিতবে → win/winner
- হারবে → lose/loss
- ঢাকা → dhaka
- চট্টগ্রাম → chittagong
- চট্টগ্রাম → chattogram (alternative)

EXAMPLES:
Input: "বিপিএল ২০২৫ ফাইনালে কুমিল্লা জিতবে?"
Output: {"slug": "bpl-2025-final-comilla-winner", "title": "BPL 2025 Final: Will Comilla Win?", "language": "bn", "keywords": ["bpl", "2025", "final", "comilla", "cricket"]}

Input: "ঢাকার তাপমাত্রা ৩৫ ডিগ্রি ছাড়াবে?"
Output: {"slug": "dhaka-temperature-35-degree", "title": "Will Dhaka Temperature Exceed 35\xb0C?", "language": "bn", "keywords": ["dhaka", "temperature", "weather"]}

Input: "Bangladesh Election 2024 - Awami League Majority?"
Output: {"slug": "bangladesh-election-2024-awami-majority", "title": "Bangladesh Election 2024: Will Awami League Get Majority?", "language": "en", "keywords": ["bangladesh", "election", "2024", "awami-league"]}

Input: "Bitcoin price above $100k by March 2025?"
Output: {"slug": "bitcoin-price-100k-march-2025", "title": "Will Bitcoin Price Exceed $100,000 by March 2025?", "language": "en", "keywords": ["bitcoin", "crypto", "100k", "march-2025"]}

RESPONSE FORMAT (JSON only):
{
  "slug": "url-safe-slug",
  "title": "Optimized SEO-friendly title",
  "language": "bn|en|mixed",
  "keywords": ["keyword1", "keyword2"],
  "transliterationNotes": "any special notes about transliteration"
}
`,a=`
You are a category classifier for Plokymarket, a Bangladesh prediction market platform.

YOUR TASK:
Classify events into appropriate categories with confidence scores.

PRIMARY CATEGORIES:
- politics: Elections, government decisions, political events, policy changes
- sports: Cricket, football, BPL, international sports involving Bangladesh
- crypto: Bitcoin, Ethereum, cryptocurrency prices, blockchain events
- economics: Stock market, GDP, inflation, exchange rates, budget, remittance
- weather: Temperature, rainfall, cyclones, natural disasters in Bangladesh
- entertainment: Movies, celebrities, awards (Oscar, Nobel, etc.)
- technology: Tech launches, AI developments, social media platforms
- international: Global events with significant impact on Bangladesh

SUBCATEGORIES (select as appropriate):
Politics: election, by-election, local-election, national-election, policy
Sports: cricket, football, bpl, world-cup, asia-cup, t20, test, odi
Crypto: bitcoin, ethereum, altcoin, defi, nft, regulation
Economics: stock-market, forex, gdp, inflation, budget, trade
Weather: cyclone, flood, rainfall, temperature, earthquake

SPECIAL TAGS:
- bd-local: Event primarily concerning Bangladesh (add for all BD-specific events)
- high-impact: Major national significance (elections, disasters, major sports finals)
- time-sensitive: Requires quick resolution (breaking news, live events)
- international: Significant international attention

BANGLADESH CONTEXT INDICATORS:
- Cities: Dhaka, Chittagong/ Chattogram, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh
- Teams: Tigers, Comilla Victorians, Dhaka Capitals, Chattogram Challengers
- Authorities: Election Commission, Bangladesh Bank, BCB, BMD
- Currency: BDT, Taka (৳)

CONFIDENCE THRESHOLDS:
- >= 0.9: Very confident
- >= 0.8: Confident
- >= 0.7: Moderately confident (flag for review if lower)

RESPONSE FORMAT (JSON only):
{
  "primary": "category_name",
  "secondary": ["sub_category1", "sub_category2"],
  "tags": ["bd-local", "high-impact"],
  "confidence": 0.92,
  "reasoning": "Brief explanation of classification logic",
  "bangladeshContext": {
    "isLocal": true|false,
    "relevantEntities": ["entity1", "entity2"],
    "suggestedAuthority": "authority for resolution"
  }
}
`,r=`
You are a content writer for Plokymarket, a Bangladesh prediction market platform.

YOUR TASK:
Generate compelling, clear event descriptions with specific resolution criteria.

REQUIREMENTS:
1. Write in the same language as the event title (Bengali/English/Mixed)
2. Provide clear, unambiguous resolution criteria
3. Specify authoritative source for resolution
4. Include relevant context for Bangladesh audience
5. Specify exact resolution date/time in Asia/Dhaka timezone (UTC+6)
6. Address edge cases and ambiguous scenarios

RESOLUTION CRITERIA MUST INCLUDE:
- YES outcome: Exact conditions that resolve to YES
- NO outcome: Exact conditions that resolve to NO
- Edge cases: How ambiguous situations will be handled
- Source of truth: Specific authoritative source

BANGLADESH AUTHORITATIVE SOURCES:
- Elections: Bangladesh Election Commission (www.eci.gov.bd)
- Cricket: Bangladesh Cricket Board (www.tigercricket.com.bd), ESPN Cricinfo
- Football: Bangladesh Football Federation (bff.com.bd)
- Weather: Bangladesh Meteorological Department (www.bmd.gov.bd)
- Stocks: Dhaka Stock Exchange (www.dse.com.bd), Chittagong Stock Exchange
- Economy: Bangladesh Bank (www.bb.org.bd), Bangladesh Bureau of Statistics
- General: Official government portals, verified international news (Reuters, BBC)

LANGUAGE GUIDELINES:
- If title is in Bengali: Write description primarily in Bengali
- If title is in English: Write description in English
- If mixed: Use primary language of the title
- Include both languages for high-impact national events if appropriate

RESPONSE FORMAT (JSON only):
{
  "description": "Full event description in appropriate language",
  "resolutionCriteria": {
    "yes": "Conditions for YES resolution",
    "no": "Conditions for NO resolution",
    "edgeCases": "How edge cases are handled"
  },
  "resolutionSource": {
    "name": "Authority name",
    "url": "Official website",
    "alternativeSources": ["backup source 1", "backup source 2"]
  },
  "context": "Additional context for traders",
  "language": "bn|en|mixed",
  "suggestedResolutionDate": "ISO 8601 datetime in Asia/Dhaka timezone"
}
`,n=`
You are a quality assurance validator for Plokymarket prediction markets.

YOUR TASK:
Validate event data for quality, clarity, and market viability.

VALIDATION CRITERIA:

1. TITLE QUALITY (weight: 0.2)
   - Clear and unambiguous
   - Specific enough to resolve
   - Not too long (>150 chars penalty)
   - No offensive language

2. DESCRIPTION QUALITY (weight: 0.2)
   - Explains the event clearly
   - Includes necessary context
   - Language matches target audience

3. RESOLUTION CRITERIA (weight: 0.3)
   - Unambiguous YES/NO conditions
   - Covers edge cases
   - Objective, not subjective
   - Verifiable from authoritative source

4. RESOLUTION SOURCE (weight: 0.15)
   - Authoritative and reliable
   - Publicly accessible
   - Timely publication expected

5. FEASIBILITY (weight: 0.15)
   - Resolution date is reasonable
   - Event is likely to have clear outcome
   - Not a duplicate of existing event

RISK FACTORS TO FLAG:
- Ambiguous wording that could lead to disputes
- Subjective criteria ("significant", "major", "substantial" without definition)
- Unreliable or biased resolution sources
- Political sensitivity without neutral framing
- Too short resolution timeframe
- Overlapping with existing active markets

SCORING:
- 0.90-1.00: Excellent - Auto-approve
- 0.80-0.89: Good - Approve with minor review
- 0.70-0.79: Acceptable - Requires review
- 0.60-0.69: Poor - Requires significant revision
- < 0.60: Reject - Major issues

RESPONSE FORMAT (JSON only):
{
  "score": 0.85,
  "recommendation": "approve|review|revise|reject",
  "breakdown": {
    "titleQuality": 0.9,
    "descriptionQuality": 0.85,
    "resolutionCriteria": 0.8,
    "resolutionSource": 0.9,
    "feasibility": 0.85
  },
  "risks": [
    {
      "severity": "low|medium|high",
      "category": "ambiguity|source|timing|duplicate|sensitive",
      "description": "Description of the risk",
      "suggestion": "How to fix"
    }
  ],
  "improvements": ["suggested improvement 1", "suggested improvement 2"],
  "confidence": 0.88
}
`},42833:(e,t,i)=>{i.d(t,{Dc:()=>l,vH:()=>c,lX:()=>u,pM:()=>d,z9:()=>r,$U:()=>n,$r:()=>p,h9:()=>m});var o=i(72580),a=i(40015);async function r(e){return(0,o.sE)(async()=>{let t=(0,o.E1)({modelName:o.L6.SLUG_GENERATOR.modelName,systemInstruction:a.SLUG_AGENT_PROMPT,temperature:o.L6.SLUG_GENERATOR.temperature,maxOutputTokens:o.L6.SLUG_GENERATOR.maxOutputTokens,responseMimeType:"application/json"}),i=await t.generateContent({contents:[{role:"user",parts:[{text:`Generate slug for: "${e}"`}]}]}),r=i.response.candidates?.[0]?.content?.parts?.[0]?.text;if(!r)throw Error("Empty response from model");let n=(0,o.lm)(r);if(!n.slug||!n.title)throw Error("Invalid response structure from model");return{slug:n.slug.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").substring(0,60),title:n.title,language:n.language||s(e),keywords:n.keywords||[],transliterationNotes:n.transliterationNotes}},{retries:3,backoffMs:500})}function n(e){let t=s(e),i=e.replace(/বিপিএল/gi,"bpl").replace(/বাংলাদেশ/gi,"bangladesh").replace(/ক্রিকেট/gi,"cricket").replace(/নির্বাচন/gi,"election").replace(/জিতবে/gi,"win").replace(/হারবে/gi,"lose").replace(/ঢাকা/gi,"dhaka").replace(/চট্টগ্রাম/gi,"chittagong").replace(/চট্টগ্রাম/gi,"chattogram").replace(/সিলেট/gi,"sylhet").replace(/রাজশাহী/gi,"rajshahi").replace(/খুলনা/gi,"khulna");return{slug:i.toLowerCase().replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").substring(0,60),title:i,language:t,keywords:function(e){let t=new Set(["the","a","an","in","on","at","to","for","of","and","or","will"]);return e.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(e=>e.length>2&&!t.has(e)).slice(0,5)}(i)}}function s(e){let t=/[\u0980-\u09FF]/.test(e),i=/[a-zA-Z]/.test(e);return t&&i?"mixed":t?"bn":"en"}async function l(e,t){return(0,o.sE)(async()=>{let i=(0,o.E1)({modelName:o.L6.CATEGORY_CLASSIFIER.modelName,systemInstruction:a.CATEGORY_AGENT_PROMPT,temperature:o.L6.CATEGORY_CLASSIFIER.temperature,maxOutputTokens:o.L6.CATEGORY_CLASSIFIER.maxOutputTokens,responseMimeType:"application/json"}),r=t?`Title: "${e}"
Description: "${t}"

Classify this event.`:`Title: "${e}"

Classify this event.`,n=await i.generateContent({contents:[{role:"user",parts:[{text:r}]}]}),s=n.response.candidates?.[0]?.content?.parts?.[0]?.text;if(!s)throw Error("Empty response from model");let l=(0,o.lm)(s);return{primary:l.primary||"international",secondary:l.secondary||[],tags:l.tags||[],confidence:l.confidence||.5,reasoning:l.reasoning||"No reasoning provided",bangladeshContext:{isLocal:l.bangladeshContext?.isLocal||!1,relevantEntities:l.bangladeshContext?.relevantEntities||[],suggestedAuthority:l.bangladeshContext?.suggestedAuthority||""}}},{retries:3,backoffMs:500})}function c(e){let t=e.toLowerCase(),i=["bangladesh","dhaka","chittagong","chattogram","sylhet","rajshahi","khulna","bdt","taka","বাংলাদেশ","ঢাকা"].some(e=>t.includes(e)),o="international",a=[],r=i?["bd-local"]:[];return/\b(election|vote|poll|government|minister|parliament|nirbachon|ভোট)\b/.test(t)?(o="politics",a.push("national-election"),r.push("high-impact")):/\b(cricket|bpl|ipl|world cup|t20|odi|test|match|ক্রিকেট|বিপিএল)\b/.test(t)?(o="sports",a.push("cricket"),(t.includes("bpl")||t.includes("বিপিএল"))&&a.push("bpl"),/\b(final|semi-final|playoff|championship)\b/.test(t)&&r.push("high-impact")):/\b(football|soccer|fifa|world cup|premier league|fifa|ফুটবল)\b/.test(t)?(o="sports",a.push("football")):/\b(bitcoin|btc|ethereum|eth|crypto|cryptocurrency|blockchain|nft|defi)\b/.test(t)?(o="crypto",t.includes("bitcoin")||t.includes("btc")?a.push("bitcoin"):(t.includes("ethereum")||t.includes("eth"))&&a.push("ethereum")):/\b(stock|market|gdp|inflation|economy|budget|forex|dse|cse|exchange rate)\b/.test(t)?(o="economics",t.includes("stock")||t.includes("dse")||t.includes("cse")?a.push("stock-market"):t.includes("inflation")&&a.push("inflation")):/\b(weather|temperature|rain|cyclone|storm|flood|weather|বৃষ্টি|ঝড়)\b/.test(t)?(o="weather",(t.includes("cyclone")||t.includes("flood"))&&(a.push("cyclone"),r.push("high-impact"))):/\b(movie|film|oscar|grammy|nobel|award|actor|actress)\b/.test(t)?o="entertainment":/\b(ai|artificial intelligence|tech|launch|apple|google|microsoft|tesla)\b/.test(t)&&(o="technology"),{primary:o,secondary:a,tags:r,confidence:.6,reasoning:"Rule-based classification fallback",bangladeshContext:{isLocal:i,relevantEntities:function(e){let t=[];return["dhaka","chittagong","chattogram","sylhet","rajshahi","khulna"].forEach(i=>{e.includes(i)&&t.push(i)}),["tigers","comilla","dhaka","chattogram","sylhet","khulna","rangpur"].forEach(i=>{e.includes(i)&&t.push(i)}),t}(t),suggestedAuthority:({politics:"Bangladesh Election Commission",sports:"Bangladesh Cricket Board",crypto:"CoinMarketCap / CoinGecko",economics:"Bangladesh Bank",weather:"Bangladesh Meteorological Department",entertainment:"Official Award Committee",technology:"Company Official Announcement",international:"Reuters / BBC"})[o]}}}async function u(e,t,i){return(0,o.sE)(async()=>{let r=(0,o.E1)({modelName:o.L6.CONTENT_GENERATOR.modelName,systemInstruction:a.CONTENT_AGENT_PROMPT,temperature:o.L6.CONTENT_GENERATOR.temperature,maxOutputTokens:o.L6.CONTENT_GENERATOR.maxOutputTokens,responseMimeType:"application/json"}),n=i?`Title: "${e}"
Category: ${t}
Existing Description: "${i}"

Generate complete event content.`:`Title: "${e}"
Category: ${t}

Generate complete event content.`,s=await r.generateContent({contents:[{role:"user",parts:[{text:n}]}]}),l=s.response.candidates?.[0]?.content?.parts?.[0]?.text;if(!l)throw Error("Empty response from model");let c=(0,o.lm)(l);return{description:c.description||"",resolutionCriteria:{yes:c.resolutionCriteria?.yes||"",no:c.resolutionCriteria?.no||"",edgeCases:c.resolutionCriteria?.edgeCases||""},resolutionSource:{name:c.resolutionSource?.name||"",url:c.resolutionSource?.url||"",alternativeSources:c.resolutionSource?.alternativeSources||[]},context:c.context||"",language:c.language||"en",suggestedResolutionDate:c.suggestedResolutionDate}},{retries:3,backoffMs:500})}function d(e,t){let i=function(e){let t=/[\u0980-\u09FF]/.test(e),i=/[a-zA-Z]/.test(e);return t&&i?"mixed":t?"bn":"en"}(e),o=function(e){let t={politics:{description:e=>`This market predicts the outcome of: ${e}. The resolution will be based on official results from the Bangladesh Election Commission or relevant government authority.`,yesCriteria:"The event occurs as specified in the market question.",noCriteria:"The event does not occur as specified in the market question.",edgeCases:"In case of disputed results, the decision of the Election Commission will be final. If the election is postponed or cancelled, the market will be resolved as invalid.",source:{name:"Bangladesh Election Commission",url:"https://www.eci.gov.bd",alternativeSources:["Official Government Gazette"]},context:"Political events in Bangladesh can be subject to rapid changes. Traders should monitor news closely."},sports:{description:e=>`This market predicts: ${e}. The resolution will be based on official match results.`,yesCriteria:"The specified team/player achieves the outcome stated in the question.",noCriteria:"The specified team/player does not achieve the outcome stated in the question.",edgeCases:"If the match is cancelled or abandoned, the market will be resolved based on official rules of the governing body. For rain-affected matches, DLS method results will be considered official.",source:{name:"Bangladesh Cricket Board / ESPN Cricinfo",url:"https://www.tigercricket.com.bd",alternativeSources:["https://www.espncricinfo.com"]},context:"Sports events can be affected by weather conditions. Check weather forecasts for outdoor events."},crypto:{description:e=>`This market predicts: ${e}. Resolution will be based on price data from major exchanges.`,yesCriteria:"The specified price level or event occurs within the specified timeframe.",noCriteria:"The specified price level or event does not occur within the specified timeframe.",edgeCases:"Price data will be taken from CoinMarketCap or CoinGecko at the specified time. In case of exchange outages, the average of available exchanges will be used.",source:{name:"CoinMarketCap / CoinGecko",url:"https://coinmarketcap.com",alternativeSources:["https://www.coingecko.com"]},context:"Cryptocurrency markets are highly volatile. Prices can change rapidly."},economics:{description:e=>`This market predicts: ${e}. Resolution will be based on official government or central bank data.`,yesCriteria:"The specified economic indicator meets or exceeds the threshold stated in the question.",noCriteria:"The specified economic indicator does not meet the threshold stated in the question.",edgeCases:"Data will be taken from official Bangladesh Bank or BBS publications. Revised data will be considered if published before resolution date.",source:{name:"Bangladesh Bank",url:"https://www.bb.org.bd",alternativeSources:["Bangladesh Bureau of Statistics"]},context:"Economic data releases follow scheduled calendars. Check the Bangladesh Bank website for publication dates."},weather:{description:e=>`This market predicts: ${e}. Resolution will be based on official meteorological data.`,yesCriteria:"The specified weather condition occurs as stated in the question.",noCriteria:"The specified weather condition does not occur as stated in the question.",edgeCases:"Data will be taken from Bangladesh Meteorological Department. Measurements from Dhaka station will be used unless otherwise specified.",source:{name:"Bangladesh Meteorological Department",url:"http://www.bmd.gov.bd",alternativeSources:["Regional weather stations"]},context:"Weather predictions are inherently uncertain. Multiple sources may be consulted for verification."},default:{description:e=>`This market predicts: ${e}.`,yesCriteria:"The event occurs as specified in the market question.",noCriteria:"The event does not occur as specified in the market question.",edgeCases:"In case of ambiguity, the market creator's intent will be considered, subject to community review.",source:{name:"Authoritative Source",url:"",alternativeSources:[]},context:"Please review the resolution criteria carefully before trading."}};return t[e]||t.default}(t);return{description:o.description(e),resolutionCriteria:{yes:o.yesCriteria,no:o.noCriteria,edgeCases:o.edgeCases},resolutionSource:o.source,context:o.context,language:i}}async function p(e){return(0,o.sE)(async()=>{let t=(0,o.E1)({modelName:o.L6.VALIDATION_ENGINE.modelName,systemInstruction:a.VALIDATION_AGENT_PROMPT,temperature:o.L6.VALIDATION_ENGINE.temperature,maxOutputTokens:o.L6.VALIDATION_ENGINE.maxOutputTokens,responseMimeType:"application/json"}),i=await t.generateContent({contents:[{role:"user",parts:[{text:`Validate this event data:
${JSON.stringify(e,null,2)}`}]}]}),r=i.response.candidates?.[0]?.content?.parts?.[0]?.text;if(!r)throw Error("Empty response from model");let n=(0,o.lm)(r);return{score:n.score||0,recommendation:n.recommendation||"review",breakdown:{titleQuality:n.breakdown?.titleQuality||0,descriptionQuality:n.breakdown?.descriptionQuality||0,resolutionCriteria:n.breakdown?.resolutionCriteria||0,resolutionSource:n.breakdown?.resolutionSource||0,feasibility:n.breakdown?.feasibility||0},risks:n.risks||[],improvements:n.improvements||[],confidence:n.confidence||0}},{retries:3,backoffMs:500})}function m(e){let t,i=[],o=[],a={titleQuality:0,descriptionQuality:0,resolutionCriteria:0,resolutionSource:0,feasibility:0};e.title.length<10?(i.push({severity:"medium",category:"ambiguity",description:"Title is too short",suggestion:"Expand the title to be more descriptive"}),a.titleQuality=.4):e.title.length>150?(i.push({severity:"low",category:"ambiguity",description:"Title is very long",suggestion:"Consider making the title more concise"}),a.titleQuality=.7):a.titleQuality=.85,["significant","major","substantial","important","considerable"].some(t=>e.title.toLowerCase().includes(t))&&(i.push({severity:"high",category:"ambiguity",description:"Title contains subjective terms without clear definition",suggestion:"Define what constitutes 'significant' or replace with measurable criteria"}),a.titleQuality-=.2),!e.description||e.description.length<50?(i.push({severity:"medium",category:"ambiguity",description:"Description is missing or too short",suggestion:"Add a detailed description explaining the event"}),a.descriptionQuality=.3):a.descriptionQuality=.8;let r=e.resolutionCriteria?.yes&&e.resolutionCriteria.yes.length>10,n=e.resolutionCriteria?.no&&e.resolutionCriteria.no.length>10;if(r&&n?a.resolutionCriteria=.85:(i.push({severity:"high",category:"ambiguity",description:"Resolution criteria are incomplete",suggestion:"Define clear YES and NO outcomes"}),a.resolutionCriteria=.3),e.resolutionSource?.name&&e.resolutionSource.name.length>0?a.resolutionSource=.9:(i.push({severity:"high",category:"source",description:"No resolution source specified",suggestion:"Provide an authoritative source for resolution"}),a.resolutionSource=.2),e.resolutionDate){let t=new Date(e.resolutionDate),o=new Date,r=(t.getTime()-o.getTime())/864e5;r<1?(i.push({severity:"high",category:"timing",description:"Resolution date is too soon",suggestion:"Allow more time for the event to unfold"}),a.feasibility=.3):r>365?(i.push({severity:"medium",category:"timing",description:"Resolution date is more than a year away",suggestion:"Consider if this timeframe is appropriate for the event"}),a.feasibility=.6):a.feasibility=.85}else i.push({severity:"medium",category:"timing",description:"No resolution date specified",suggestion:"Provide an expected resolution date"}),a.feasibility=.5;let s=.2*a.titleQuality+.2*a.descriptionQuality+.3*a.resolutionCriteria+.15*a.resolutionSource+.15*a.feasibility;return t=s>=.9?"approve":s>=.8?"review":s>=.6?"revise":"reject",a.titleQuality<.8&&o.push("Improve title clarity and specificity"),a.descriptionQuality<.8&&o.push("Add more context to the description"),a.resolutionCriteria<.8&&o.push("Clarify resolution criteria for all outcomes"),a.resolutionSource<.8&&o.push("Provide authoritative resolution source"),{score:Math.max(0,Math.min(1,s)),recommendation:t,breakdown:a,risks:i,improvements:o,confidence:.7}}},72580:(e,t,i)=>{i.d(t,{E1:()=>u,L6:()=>d,U8:()=>c,lm:()=>m,sE:()=>p,xN:()=>h});var o=i(52322);let a=process.env.GOOGLE_CLOUD_PROJECT,r=process.env.VERTEX_LOCATION||"asia-south1",n=[{category:o.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,threshold:o.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},{category:o.HarmCategory.HARM_CATEGORY_HATE_SPEECH,threshold:o.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},{category:o.HarmCategory.HARM_CATEGORY_HARASSMENT,threshold:o.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],s={temperature:.2,maxOutputTokens:2048,topP:.9,topK:40},l=null;function c(){return l||(l=function(){let e,t=process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;if(t)try{let i=Buffer.from(t,"base64").toString("utf-8");e=JSON.parse(i),e?.private_key&&(e.private_key=e.private_key.replace(/\\n/g,"\n"))}catch(e){console.error("[Vertex Client] Failed to parse credentials",e)}return new o.VertexAI({project:a,location:r,googleAuthOptions:e?{credentials:e}:void 0})}()),l}function u(e){let t=c(),i={...s,temperature:e.temperature??s.temperature,maxOutputTokens:e.maxOutputTokens??s.maxOutputTokens,responseMimeType:e.responseMimeType||"application/json"};return t.getGenerativeModel({model:e.modelName,systemInstruction:e.systemInstruction,safetySettings:n,generationConfig:i,tools:[{googleSearchRetrieval:{disableAttribution:!1}}]})}let d={SLUG_GENERATOR:{modelName:"gemini-1.5-flash-002",temperature:.1,maxOutputTokens:256},CATEGORY_CLASSIFIER:{modelName:"gemini-1.5-flash-002",temperature:.2,maxOutputTokens:512},CONTENT_GENERATOR:{modelName:"gemini-1.5-pro-002",temperature:.3,maxOutputTokens:2048},VALIDATION_ENGINE:{modelName:"gemini-1.5-flash-002",temperature:.1,maxOutputTokens:1024},MARKET_CONFIGURATOR:{modelName:"gemini-1.5-pro-002",temperature:.2,maxOutputTokens:1024},FLASH_FALLBACK:{modelName:"gemini-1.5-flash-002",temperature:.2,maxOutputTokens:1024},PRO_FALLBACK:{modelName:"gemini-1.5-pro-002",temperature:.2,maxOutputTokens:2048}};async function p(e,t={}){let i,{retries:o=3,backoffMs:a=1e3}=t;for(let t=0;t<o;t++)try{return await e()}catch(e){if(i=e instanceof Error?e:Error(String(e)),t<o-1){let e=a*Math.pow(2,t);console.warn(`[Vertex AI] Retry ${t+1}/${o} in ${e}ms: ${i.message}`),await new Promise(t=>setTimeout(t,e))}}throw i}function m(e){try{return JSON.parse(e)}catch{let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)return JSON.parse(t[1].trim());let i=e.match(/\{[\s\S]*\}/);if(i)return JSON.parse(i[0]);throw Error("Could not extract JSON from Vertex AI response")}}async function h(){let e=Date.now(),t=d.SLUG_GENERATOR.modelName;try{let i=u({modelName:t,systemInstruction:'Respond only with {"status":"ok"}',temperature:0,maxOutputTokens:50}),o=await i.generateContent("ping"),a=o.response.candidates?.[0]?.content?.parts?.[0]?.text;if(a){let i=m(a);return{healthy:"ok"===i.status,latencyMs:Date.now()-e,model:t}}return{healthy:!1,latencyMs:Date.now()-e,model:t,error:"Empty response"}}catch(i){return{healthy:!1,latencyMs:Date.now()-e,model:t,error:i instanceof Error?i.message:String(i)}}}}};
//# sourceMappingURL=2833.js.map