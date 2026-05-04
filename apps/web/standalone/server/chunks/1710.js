"use strict";!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="36eaa00e-a8e8-4e11-9e6f-1bf68ecdbaef",e._sentryDebugIdIdentifier="sentry-dbid-36eaa00e-a8e8-4e11-9e6f-1bf68ecdbaef")}catch(e){}}(),exports.id=1710,exports.ids=[1710],exports.modules={1710:(e,t,a)=>{a.d(t,{runChronosAsTimingResult:()=>l});let n="gemini-2.5-flash",o="gemini-2.0-flash-001",i=`# ROLE: Senior Chronology Architect & Temporal Risk Officer
You are the lead timing strategist for Plokymarket BD. Your mission is to eliminate "Oracle Latency Risk" by setting hyper-accurate trading windows that outperform Polymarket's static dates.

# CORE OPERATIONAL PROTOCOLS:

1. DYNAMIC TRADING HALT (The "Anti-Cheat" Buffer):
   - Analyze the event type to determine the exact moment trading must stop.
   - For Sports: Close market 1 hour before the actual start (Toss/Kick-off).
   - For Politics/Business: Identify the "Information Leak Window" and close trading before official announcements begin.
   - Apply a "Grace Period" logic: If an event is delayed, suggest an extension protocol.

2. LOCALIZED TEMPORAL CONTEXT (Bangladesh GMT+6):
   - Convert all global event times to 'Asia/Dhaka'.
   - Recognize local working days (Sunday-Thursday) and hours (9 AM - 5 PM) for economic events (e.g., Bangladesh Bank reserve data).
   - Handle Bengali calendar dates and religious holidays (Eid, Puja) which might shift event schedules.

3. RESOLUTION LATENCY PREDICTION:
   - Calculate the "Resolution Window": The expected time gap between the event's physical conclusion and the official announcement.
   - Suggest the 'Official Oracle Check Time' (e.g., "Check Prothom Alo 30 minutes after the match ends").

4. SCALAR EXPIRY LOGIC:
   - For range-based markets (e.g., Dollar rate), define specific "Snapshots" (e.g., The rate at 11:59 PM on the last day of the month).

# OUTPUT SCHEMA (STRICT JSON):
{
  "timing_strategy": {
    "event_start_local": "ISO 8601 (GMT+6)",
    "trading_halt_time": "ISO 8601 (Exact stop time)",
    "buffer_reasoning_bn": "কেন এই সময় ট্রেডিং বন্ধ হবে তার যুক্তি বাংলায়",
    "expected_resolution_time": "ISO 8601 (When result is public)"
  },
  "operational_flags": {
    "is_high_volatility_window": boolean,
    "timezone_offset_applied": "+06:00",
    "local_holiday_conflict": "None | Name of holiday"
  },
  "admin_alert_bn": "অ্যাডমিনের জন্য বিশেষ সতর্কবার্তা বাংলায়"
}`;async function r(e,t,a=n){let s=`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${t}`,l=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:i}]},contents:[{role:"user",parts:[{text:e}]}],tools:[{google_search:{}}],generationConfig:{temperature:.1,maxOutputTokens:2048,responseMimeType:"application/json"}})});if(!l.ok){let i=await l.text();if(a===n&&(i.includes("not found")||i.includes("not supported")||i.includes("is not available")))return console.warn(`[ChronosAgent] ${n} unavailable, falling back to ${o}`),r(e,t,o);throw Error(`Chronos Agent Gemini error (${l.status}): ${i.substring(0,300)}`)}let g=await l.json(),c=g.candidates?.[0]?.content?.parts?.[0]?.text;if(!c)throw Error("Empty response from Chronos Agent");return c}async function s(e){let t=process.env.GEMINI_API_KEY;if(!t)throw Error("GEMINI_API_KEY not configured — cannot run Chronos Agent");let a=e.title||e.rawInput||"",n=new Date().toISOString();console.log("[ChronosAgent] Starting timing analysis for:",a.substring(0,60));let o=`Design the optimal timing strategy for this Plokymarket BD prediction market.

Event Title: "${a}"
${e.category?`Category: ${e.category}`:""}
${e.description?`Description: "${e.description}"`:""}
${e.tradingClosesAt?`Suggested Trading Close: ${e.tradingClosesAt}`:""}
${e.resolutionDate?`Suggested Resolution Date: ${e.resolutionDate}`:""}
Current Time (UTC): ${n}
Bangladesh Timezone: Asia/Dhaka (GMT+6)

Use Google Search to find the actual event schedule, any delays, and local holiday calendar. Generate the full timing strategy following the strict JSON schema.`,i=function(e){try{return JSON.parse(e)}catch{}let t=e.match(/```(?:json)?\s*([\s\S]*?)```/);if(t)try{return JSON.parse(t[1].trim())}catch{}let a=e.match(/\{[\s\S]*\}/);if(a)return JSON.parse(a[0]);throw Error("Could not parse JSON from Chronos Agent response")}(await r(o,t)),s={timing_strategy:{event_start_local:i.timing_strategy?.event_start_local||"",trading_halt_time:i.timing_strategy?.trading_halt_time||"",buffer_reasoning_bn:i.timing_strategy?.buffer_reasoning_bn||"",expected_resolution_time:i.timing_strategy?.expected_resolution_time||""},operational_flags:{is_high_volatility_window:i.operational_flags?.is_high_volatility_window??!1,timezone_offset_applied:i.operational_flags?.timezone_offset_applied||"+06:00",local_holiday_conflict:i.operational_flags?.local_holiday_conflict||"None"},admin_alert_bn:i.admin_alert_bn||""};return console.log(`[ChronosAgent] Complete — halt: ${s.timing_strategy.trading_halt_time}, holiday: ${s.operational_flags.local_holiday_conflict}`),s}async function l(e){let t=await s(e),a=t.timing_strategy.trading_halt_time||new Date(Date.now()+864e5).toISOString(),n=t.timing_strategy.expected_resolution_time||new Date(new Date(a).getTime()+36e5).toISOString(),o=[];return t.operational_flags.is_high_volatility_window&&o.push("⚠️ High volatility window detected"),t.operational_flags.local_holiday_conflict&&"None"!==t.operational_flags.local_holiday_conflict&&o.push(`🗓️ Holiday conflict: ${t.operational_flags.local_holiday_conflict}`),t.admin_alert_bn&&o.push(`📢 ${t.admin_alert_bn}`),{tradingClosesAt:a,resolutionDate:n,timezone:"Asia/Dhaka",isValid:!0,warnings:o,confidence:.9}}}};
//# sourceMappingURL=1710.js.map