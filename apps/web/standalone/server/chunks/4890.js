"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="93d52cc2-964f-46b4-94bf-38a9af97b3a6",e._sentryDebugIdIdentifier="sentry-dbid-93d52cc2-964f-46b4-94bf-38a9af97b3a6")}catch(e){}}(),exports.id=4890,exports.ids=[1891,4890],exports.modules={1891:(e,t,a)=>{a.d(t,{runConciergeAgent:()=>r});let n="gemini-2.5-flash",o="gemini-2.0-flash-001",s=`# ROLE: Senior Concierge & Prediction Market Mentor (Plokymarket BD)
Your mission is to provide "White-Glove" support to users. You are not just a chatbot; you are a financial educator and a dispute mediator. Your goal is to simplify complex concepts and ensure a friction-less user experience.

# CORE INTERACTION PROTOCOLS:

1. TRADING EDUCATION (The Mentor Role):
   - Explain 'Odds' using simple Bangladeshi analogies (e.g., "১০ টাকার টিকিটে ৮ টাকা জেতার সম্ভাবনা").
   - Simplify 'Order Books' and 'Limit Orders' for beginners. 
   - If a user asks "How much can I win?", calculate potential profit based on current market prices.

2. OPERATIONAL GUIDANCE (Deposit/Withdrawal):
   - Provide step-by-step instructions for bKash, Nagad, and Rocket deposits.
   - If a transaction is delayed, explain the "Transaction Mining" or "Manual Verification" process clearly in Bangla.
   - Proactively offer troubleshooting steps if a user mentions a failed payment.

3. EMPATHETIC DISPUTE MEDIATION:
   - When a user is upset about a lost market, do not be robotic. 
   - Use the 'Oracle Evidence' to explain exactly why the market resolved the way it did. 
   - Provide links to official sources (Prothom Alo, Daily Star) to back up the resolution.

4. USER RETENTION & SAFETY:
   - Identify signs of "Gambling Addiction" or distress and provide responsible gaming reminders.
   - Encourage users to check 'Risk Scores' before placing large trades.

# TONE & LANGUAGE:
- Language: Native, friendly, and professional Bangla (শুদ্ধ ও প্রাঞ্জল বাংলা).
- Tone: Empathetic, patient, and authoritative.
- Avoid technical jargon unless you explain it immediately after.

# RAG & GROUNDING RULES:
- Always prioritize information from the 'Plokymarket Implementation Guide' and 'FAQ' data store.
- If the information is not in the data store, explicitly state that you are connecting them to a human admin.

# OUTPUT SCHEMA (STRICT JSON):
{
  "text_bn": "ব্যবহারকারীর প্রশ্নের বিস্তারিত উত্তর বাংলায়",
  "suggested_actions": [
    {
      "label_bn": "বাটনের টেক্সট বাংলায়",
      "action": "action_type (e.g., open_url, navigate, contact_admin)",
      "url": "optional URL"
    }
  ],
  "category": "education | operational | dispute | safety | general",
  "is_escalation_needed": false,
  "responsible_gaming_alert": "optional alert message in Bangla if needed"
}`;async function i(e,t,a=n){let r=`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${t}`,l=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:s}]},contents:e,tools:[{google_search:{}}],generationConfig:{temperature:.4,maxOutputTokens:2048,responseMimeType:"application/json"}})});if(!l.ok){let s=await l.text();if(a===n&&(s.includes("not found")||s.includes("not supported")||s.includes("is not available")))return console.warn(`[ConciergeAgent] ${n} unavailable, falling back to ${o}`),i(e,t,o);throw Error(`Concierge Agent Gemini error (${l.status}): ${s.substring(0,300)}`)}let c=await l.json(),d=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!d)throw Error("Empty response from Concierge Agent");return d}async function r(e){let t=process.env.GEMINI_API_KEY;if(!t)throw Error("GEMINI_API_KEY not configured — cannot run Concierge Agent");console.log("[ConciergeAgent] Handling query:",e.message.substring(0,60));let a=[];if(e.conversationHistory)for(let t of e.conversationHistory)a.push({role:"assistant"===t.role?"model":"user",parts:[{text:t.content}]});let n="";if(e.userContext){let t=e.userContext;n=`

[USER CONTEXT — INTERNAL, DO NOT SHARE RAW DATA]
- Balance: ৳${t.balance??"N/A"}
- Locked: ৳${t.lockedBalance??0}
- Total Trades: ${t.totalTrades??0}
- Recent: ${t.recentWins??0} wins, ${t.recentLosses??0} losses
- Deposit Method: ${t.depositMethod||"unknown"}
- Member Since: ${t.memberSince||"unknown"}`}a.push({role:"user",parts:[{text:`${e.message}${n}${e.dataStore?`

[Data Store: ${e.dataStore}]`:""}`}]});let o=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let a=e.match(/\{[\s\S]*\}/);return a?JSON.parse(a[0]):{text_bn:e,suggested_actions:[],category:"general",is_escalation_needed:!1}}(await i(a,t)),s=["education","operational","dispute","safety","general"].includes(o.category)?o.category:"general",r={text_bn:o.text_bn||o.text||"",suggested_actions:(o.suggested_actions||[]).map(e=>({label_bn:e.label_bn||e.label||"",action:e.action||"navigate",url:e.url})),category:s,is_escalation_needed:o.is_escalation_needed??!1,responsible_gaming_alert:o.responsible_gaming_alert||void 0};return console.log(`[ConciergeAgent] Complete — category: ${r.category}, escalate: ${r.is_escalation_needed}, actions: ${r.suggested_actions.length}`),r}},54890:(e,t,a)=>{a.d(t,{handleSupportQuery:()=>s});var n=a(1891);async function o(e){try{let{createClient:t}=await Promise.resolve().then(a.bind(a,49975)),n=await t(),{data:o}=await n.from("wallets").select("balance, locked_balance").eq("user_id",e).single(),{count:s}=await n.from("trades").select("id",{count:"exact",head:!0}).eq("user_id",e),{data:i}=await n.from("profiles").select("created_at, preferred_payment").eq("id",e).single();return{balance:o?.balance??0,lockedBalance:o?.locked_balance??0,totalTrades:s??0,recentWins:0,recentLosses:0,depositMethod:i?.preferred_payment||"bKash",memberSince:i?.created_at||void 0}}catch(e){return console.warn("[Support] Failed to fetch user account summary:",e instanceof Error?e.message:e),{}}}async function s(e,t,a){let s;console.log(`[Support] Handling query${t?` for user ${t}`:""}: "${e.substring(0,50)}"`),t&&(s=await o(t));let i={message:e,userId:t,userContext:s,conversationHistory:a,dataStore:"plokymarket-docs-v1"},r=await (0,n.runConciergeAgent)(i);return r.is_escalation_needed&&console.warn(`[Support] ⚠️ User ${t||"anonymous"} needs human admin escalation`),r.responsible_gaming_alert&&console.warn(`[Support] 🎰 Responsible gaming alert for user ${t||"anonymous"}: ${r.responsible_gaming_alert}`),{text_bn:r.text_bn,suggested_actions:r.suggested_actions,category:r.category,needsHumanAdmin:r.is_escalation_needed,responsibleGamingAlert:r.responsible_gaming_alert}}}};
//# sourceMappingURL=4890.js.map