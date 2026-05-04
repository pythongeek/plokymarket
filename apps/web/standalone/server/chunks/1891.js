"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="27e6b94c-4c95-4b4e-b4a5-dd76f2e4810b",e._sentryDebugIdIdentifier="sentry-dbid-27e6b94c-4c95-4b4e-b4a5-dd76f2e4810b")}catch(e){}}(),exports.id=1891,exports.ids=[1891],exports.modules={1891:(e,t,n)=>{n.d(t,{runConciergeAgent:()=>r});let a="gemini-2.5-flash",o="gemini-2.0-flash-001",i=`# ROLE: Senior Concierge & Prediction Market Mentor (Plokymarket BD)
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
}`;async function s(e,t,n=a){let r=`https://generativelanguage.googleapis.com/v1beta/models/${n}:generateContent?key=${t}`,l=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:i}]},contents:e,tools:[{google_search:{}}],generationConfig:{temperature:.4,maxOutputTokens:2048,responseMimeType:"application/json"}})});if(!l.ok){let i=await l.text();if(n===a&&(i.includes("not found")||i.includes("not supported")||i.includes("is not available")))return console.warn(`[ConciergeAgent] ${a} unavailable, falling back to ${o}`),s(e,t,o);throw Error(`Concierge Agent Gemini error (${l.status}): ${i.substring(0,300)}`)}let c=await l.json(),d=c.candidates?.[0]?.content?.parts?.[0]?.text;if(!d)throw Error("Empty response from Concierge Agent");return d}async function r(e){let t=process.env.GEMINI_API_KEY;if(!t)throw Error("GEMINI_API_KEY not configured — cannot run Concierge Agent");console.log("[ConciergeAgent] Handling query:",e.message.substring(0,60));let n=[];if(e.conversationHistory)for(let t of e.conversationHistory)n.push({role:"assistant"===t.role?"model":"user",parts:[{text:t.content}]});let a="";if(e.userContext){let t=e.userContext;a=`

[USER CONTEXT — INTERNAL, DO NOT SHARE RAW DATA]
- Balance: ৳${t.balance??"N/A"}
- Locked: ৳${t.lockedBalance??0}
- Total Trades: ${t.totalTrades??0}
- Recent: ${t.recentWins??0} wins, ${t.recentLosses??0} losses
- Deposit Method: ${t.depositMethod||"unknown"}
- Member Since: ${t.memberSince||"unknown"}`}n.push({role:"user",parts:[{text:`${e.message}${a}${e.dataStore?`

[Data Store: ${e.dataStore}]`:""}`}]});let o=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let n=e.match(/\{[\s\S]*\}/);return n?JSON.parse(n[0]):{text_bn:e,suggested_actions:[],category:"general",is_escalation_needed:!1}}(await s(n,t)),i=["education","operational","dispute","safety","general"].includes(o.category)?o.category:"general",r={text_bn:o.text_bn||o.text||"",suggested_actions:(o.suggested_actions||[]).map(e=>({label_bn:e.label_bn||e.label||"",action:e.action||"navigate",url:e.url})),category:i,is_escalation_needed:o.is_escalation_needed??!1,responsible_gaming_alert:o.responsible_gaming_alert||void 0};return console.log(`[ConciergeAgent] Complete — category: ${r.category}, escalate: ${r.is_escalation_needed}, actions: ${r.suggested_actions.length}`),r}}};
//# sourceMappingURL=1891.js.map