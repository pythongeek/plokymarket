"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="1fe5fb2f-df9d-4ce5-9873-22b9c66039c6",e._sentryDebugIdIdentifier="sentry-dbid-1fe5fb2f-df9d-4ce5-9873-22b9c66039c6")}catch(e){}}(),exports.id=9534,exports.ids=[9534],exports.modules={79534:(e,t,a)=>{a.d(t,{runQuantLogicAsMarketLogic:()=>l});let i="gemini-2.5-flash",n="gemini-2.0-flash-001",r=`# ROLE: Senior Quantitative Architect & Prediction Market Engineer
You are the lead logic designer for Plokymarket BD. Your goal is to outperform platforms like Polymarket by providing mathematical precision and clear resolution frameworks that eliminate ambiguity.

# CORE OPERATIONAL PROTOCOLS:

1. DYNAMIC MARKET CLASSIFICATION:
   - Go beyond Binary (Yes/No). Evaluate if the event should be:
     a) Binary: Single event outcome.
     b) Categorical: Multi-choice (e.g., Who will win the 5-nation tournament?).
     c) Scalar: Range-based outcomes (e.g., What will be the USD-BDT rate? Range: 110-130).

2. QUANTITATIVE PARAMETERS (LMSR Engine):
   - Calculate the 'B-Parameter' (Liquidity depth) based on expected volume.
   - Suggest Initial Odds (e.g., 50/50 or weighted based on news sentiment).
   - Apply a dynamic 2% - 3.5% fee structure based on the Risk Score.

3. SETTLEMENT PROTOCOL (Eliminating Ambiguity):
   - Every market must have a "Nullification Clause" (e.g., If the match is abandoned due to rain and no DLS result is produced, the market resolves to 50/50 or refund).
   - Define exact "Resolution Data Points" (e.g., Not just 'news', but 'The closing value on the Bangladesh Bank website at 4:00 PM GMT+6').

4. ANTI-MANIPULATION GUARDRAILS:
   - Identify if the market logic is prone to "Insider Information" (e.g., narrow niche events).
   - Flag any logic that could lead to "Infinite Arbitrage".

# WRITING STYLE & LOCALIZATION:
- Output the 'Title' and 'Resolution Criteria' in high-standard professional Bangla.
- Use native terminology for local context (e.g., "টাকা", "নির্বাচন কমিশন", "বিসিবি নিয়মাবলী").

# OUTPUT SCHEMA (STRICT JSON):
{
  "market_logic": {
    "type": "Binary | Categorical | Scalar",
    "title_bn": "মার্কেটের শিরোনাম (বাংলা)",
    "rules_summary_bn": "খুবই স্পষ্ট এবং আইনি ভাষায় শর্তাবলী",
    "nullification_clause_bn": "বাতিল হওয়ার শর্ত বাংলায়"
  },
  "quant_params": {
    "initial_b_parameter": number,
    "starting_price_yes": 0.00-1.00,
    "recommended_liquidity_cap": number,
    "fee_tier": "Standard | High Volatility"
  },
  "oracle_instructions": {
    "primary_trigger": "URL or Data Point",
    "resolution_timestamp": "ISO 8601",
    "verification_method": "Step-by-step resolution process for Admin"
  }
}`;async function o(e,t,a=i){let s=`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${t}`,l=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:r}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.2,maxOutputTokens:4096,responseMimeType:"application/json"}})});if(!l.ok){let r=await l.text();if(a===i&&(r.includes("not found")||r.includes("not supported")||r.includes("is not available")))return console.warn(`[QuantLogicAgent] ${i} unavailable, falling back to ${n}`),o(e,t,n);throw Error(`Quant Logic Agent Gemini error (${l.status}): ${r.substring(0,300)}`)}let c=await l.json(),u=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!u)throw Error("Empty response from Quant Logic Agent");return u}async function s(e){let t=process.env.GEMINI_API_KEY;if(!t)throw Error("GEMINI_API_KEY not configured — cannot run Quant Logic Agent");let a=e.title||e.rawInput||"";console.log("[QuantLogicAgent] Starting analysis for:",a.substring(0,60));let i=`Design the optimal prediction market structure for the following event on Plokymarket BD.

Event Title: "${a}"
${e.category?`Category: ${e.category}`:""}
${e.description?`Description: "${e.description}"`:""}
${e.outcomes&&e.outcomes.length>0?`Current Outcomes: ${JSON.stringify(e.outcomes)}`:""}
${e.tradingClosesAt?`Trading Closes: ${e.tradingClosesAt}`:""}

Use Google Search to find the latest odds, sentiment data, and relevant context for calibrating the LMSR parameters. Generate the full market design following the strict JSON schema.`,n=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let a=e.match(/\{[\s\S]*\}/);if(a)return JSON.parse(a[0]);throw Error("Could not parse JSON from Quant Logic Agent response")}(await o(i,t)),r={market_logic:{type:n.market_logic?.type||"Binary",title_bn:n.market_logic?.title_bn||a,rules_summary_bn:n.market_logic?.rules_summary_bn||"",nullification_clause_bn:n.market_logic?.nullification_clause_bn||""},quant_params:{initial_b_parameter:Number(n.quant_params?.initial_b_parameter)||100,starting_price_yes:Number(n.quant_params?.starting_price_yes)||.5,recommended_liquidity_cap:Number(n.quant_params?.recommended_liquidity_cap)||5e3,fee_tier:n.quant_params?.fee_tier||"Standard"},oracle_instructions:{primary_trigger:n.oracle_instructions?.primary_trigger||"",resolution_timestamp:n.oracle_instructions?.resolution_timestamp||"",verification_method:n.oracle_instructions?.verification_method||""}};return console.log(`[QuantLogicAgent] Complete — type: ${r.market_logic.type}, B: ${r.quant_params.initial_b_parameter}, fee: ${r.quant_params.fee_tier}`),r}async function l(e){let t=await s(e),a=function(e){let t=(e||"").toLowerCase();return t.includes("categorical")?"categorical":t.includes("scalar")?"scalar":"binary"}(t.market_logic.type),i=e.outcomes&&e.outcomes.length>0?e.outcomes:["হ্যাঁ","না"],n="High Volatility"===t.quant_params.fee_tier?.035:.02;return{marketType:a,outcomes:i,outcomeCount:i.length,liquidityRecommendation:t.quant_params.recommended_liquidity_cap,tradingFee:n,minTradeAmount:10,maxTradeAmount:Math.round(.5*t.quant_params.recommended_liquidity_cap),bParameter:t.quant_params.initial_b_parameter,confidence:Math.min(1,Math.max(.5,t.quant_params.starting_price_yes+.3))}}}};
//# sourceMappingURL=9534.js.map