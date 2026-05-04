"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="df0110d3-3295-4f1b-bcc7-3e7d0c8ddd36",e._sentryDebugIdIdentifier="sentry-dbid-df0110d3-3295-4f1b-bcc7-3e7d0c8ddd36")}catch(e){}}(),exports.id=4969,exports.ids=[4969],exports.modules={84969:(e,t,n)=>{n.d(t,{runGrowthAgent:()=>i});let a="gemini-2.5-flash",o="gemini-2.0-flash-001",r=`# ROLE: Chief Growth Officer & Viral Trend Analyst (Plokymarket BD)
Your mission is to ensure Plokymarket Bangladesh is always at the center of public conversation. You turn news into opportunities and markets into viral content.

# CORE OPERATIONAL PROTOCOLS:

1. REAL-TIME TREND MINING:
   - Scan Whitelisted News APIs, Google Trends (Bangladesh), and Local RSS Feeds.
   - Focus Categories: Sports (BCB/BPL/Football), Politics, Local Memes, and National Economy.
   - Identify "Early Signals": Topics with a 50% increase in search/discussion volume within the last 4 hours.

2. VIRAL PROBABILITY SCORING (VPS):
   - For every trend, calculate a 'Viral Score' (1-10).
   - High Score Criteria: Controversy, High Emotional Impact, or Binary Outcome potential.
   - Suggest 3 specific market titles for any trend with VPS > 7.

3. DYNAMIC MARKET PROPOSAL:
   - Propose market structures: Binary (Yes/No) or Categorical.
   - Example: If a player is under-performing, propose: "Will [Player Name] score a half-century in the next BPL match?"

4. MULTI-CHANNEL CONTENT GENERATION:
   - Generate high-engagement Bangla content for:
     a) Facebook/Instagram (Catchy Title + Emotional Hook + 'How to Trade' guide).
     b) Twitter/X (Professional Thread with data points).
     c) Telegram/WhatsApp (Urgent Alert style).
   - Use 'Gen-Z' and 'Professional' Bangla tones depending on the channel.

# OUTPUT SCHEMA (STRICT JSON):
{
  "trend_analysis": {
    "topic": "ট্রেন্ডিং টপিকের নাম",
    "viral_score": 1-10,
    "source_link": "URL",
    "reasoning_bn": "কেন এটি জনপ্রিয় হচ্ছে তার যুক্তি বাংলায়"
  },
  "market_suggestions": [
    {
      "title_bn": "মার্কেটের শিরোনাম বাংলায়",
      "category": "Sports | Politics | etc",
      "potential_engagement": "High | Medium"
    }
  ],
  "social_assets": {
    "facebook_post_bn": "ফেসবুক ক্যাপশন (ইমোজি সহ)",
    "twitter_thread_bn": ["Tweet 1", "Tweet 2"],
    "telegram_alert_bn": "টেলিগ্রাম এলার্ট টেক্সট",
    "hashtags": ["#PlokymarketBD", "#BangladeshTrends"]
  }
}`;async function s(e,t,n=a){let i=`https://generativelanguage.googleapis.com/v1beta/models/${n}:generateContent?key=${t}`,l=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:r}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.7,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!l.ok){let r=await l.text();if(n===a&&(r.includes("not found")||r.includes("not supported")||r.includes("is not available")))return console.warn(`[GrowthAgent] ${a} unavailable, falling back to ${o}`),s(e,t,o);throw Error(`Growth Agent Gemini error (${l.status}): ${r.substring(0,300)}`)}let c=await l.json(),g=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!g)throw Error("Empty response from Growth Agent");return g}async function i(e){let t=process.env.GEMINI_API_KEY;if(!t)throw Error("GEMINI_API_KEY not configured — cannot run Growth Agent");console.log(`[GrowthAgent] Mining trends${e.topic?` for: ${e.topic}`:""}${e.category?` [${e.category}]`:""}`);let n=`Analyze the current trending topics in Bangladesh and generate prediction market opportunities for Plokymarket BD.

${e.topic?`Specific Topic to Analyze: "${e.topic}"`:"Find the HOTTEST trending topic in Bangladesh RIGHT NOW."}
${e.category?`Category Focus: ${e.category}`:"Scan ALL categories: Sports (BPL/BCB/Football), Politics, Economy, Entertainment."}
${e.rawTrends?`
Raw Trend Data:
${e.rawTrends}`:""}
${e.rawQuery?`
Additional Context: "${e.rawQuery}"`:""}
Current Time (UTC): ${new Date().toISOString()}

MANDATORY STEPS:
1. Use Google Search to find what's trending in Bangladesh RIGHT NOW.
2. Calculate the Viral Probability Score (VPS) based on controversy, emotional impact, and binary outcome potential.
3. Suggest at least 3 prediction market titles in Bengali for trends with VPS > 7.
4. Generate viral social media content for Facebook (Gen-Z tone with emojis), Twitter/X (professional thread), and Telegram (urgent alert style).
5. Include relevant Bengali hashtags.
6. Output in strict JSON schema.`,a=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let n=e.match(/\{[\s\S]*\}/);if(n)return JSON.parse(n[0]);throw Error("Could not parse JSON from Growth Agent response")}(await s(n,t)),o={trend_analysis:{topic:a.trend_analysis?.topic||"",viral_score:Math.max(1,Math.min(10,Number(a.trend_analysis?.viral_score)||1)),source_link:a.trend_analysis?.source_link||"",reasoning_bn:a.trend_analysis?.reasoning_bn||""},market_suggestions:(a.market_suggestions||[]).map(e=>({title_bn:e.title_bn||"",category:e.category||"General",potential_engagement:"High"===e.potential_engagement?"High":"Low"===e.potential_engagement?"Low":"Medium"})),social_assets:{facebook_post_bn:a.social_assets?.facebook_post_bn||"",twitter_thread_bn:a.social_assets?.twitter_thread_bn||[],telegram_alert_bn:a.social_assets?.telegram_alert_bn||"",hashtags:a.social_assets?.hashtags||["#PlokymarketBD"]}};return console.log(`[GrowthAgent] Complete — topic: "${o.trend_analysis.topic}", VPS: ${o.trend_analysis.viral_score}/10, markets: ${o.market_suggestions.length}`),o}}};
//# sourceMappingURL=4969.js.map