/**
 * Timing Agent (Chronos Algorithm)
 * - ISO-8601 time format handling
 * - Asia/Dhaka timezone conversion
 * - Auto-close timing based on event type
 */

import { TimingResult, AgentContext } from './types';
import { executeWithFailover } from './provider-switcher';

// Bangladesh standard timezone
const BD_TIMEZONE = 'Asia/Dhaka';
const BD_UTC_OFFSET = 6; // UTC+6

// Event type to default duration mapping (in hours)
const EVENT_DURATIONS: Record<string, number> = {
  'cricket_match': 8,
  'football_match': 3,
  'election': 24,
  'crypto_daily': 24,
  'crypto_weekly': 168, // 7 days
  'weather_daily': 24,
  'default': 24,
};

/**
 * Detect event type from title
 */
function detectEventType(title: string): string {
  const normalized = title.toLowerCase();
  
  if (normalized.includes('ক্রিকেট') || normalized.includes('বিপিএল') || normalized.includes('টি২০')) {
    return 'cricket_match';
  }
  
  if (normalized.includes('ফুটবল') || normalized.includes('ফিফা') || normalized.includes('ওয়ার্ল্ড কাপ')) {
    return 'football_match';
  }
  
  if (normalized.includes('নির্বাচন') || normalized.includes('ভোট') || normalized.includes('ইলেকশন')) {
    return 'election';
  }
  
  if (normalized.includes('দাম') || normalized.includes('মূল্য') || normalized.includes('বিটকয়েন')) {
    if (normalized.includes('সপ্তাহ') || normalized.includes('week')) {
      return 'crypto_weekly';
    }
    return 'crypto_daily';
  }
  
  if (normalized.includes('আবহাওয়া') || normalized.includes('তাপমাত্রা') || normalized.includes('বৃষ্টি')) {
    return 'weather_daily';
  }
  
  return 'default';
}

/**
 * Parse date from various formats
 */
function parseDate(dateInput: string | Date | undefined): Date | null {
  if (!dateInput) return null;
  
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  
  // Try ISO format
  const isoDate = new Date(dateInput);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try Bengali date patterns
  // e.g., "১৫ ফেব্রুয়ারি ২০২৫"
  const bengaliNumbers: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  
  const bengaliMonths: Record<string, number> = {
    'জানুয়ারি': 0, 'ফেব্রুয়ারি': 1, 'মার্চ': 2, 'এপ্রিল': 3,
    'মে': 4, 'জুন': 5, 'জুলাই': 6, 'আগস্ট': 7,
    'সেপ্টেম্বর': 8, 'অক্টোবর': 9, 'নভেম্বর': 10, 'ডিসেম্বর': 11,
  };
  
  // Convert Bengali numbers to English
  let converted = dateInput;
  for (const [bn, en] of Object.entries(bengaliNumbers)) {
    converted = converted.replace(new RegExp(bn, 'g'), en);
  }
  
  // Try to extract date components
  for (const [monthName, monthIndex] of Object.entries(bengaliMonths)) {
    if (converted.includes(monthName)) {
      const match = converted.match(/(\d{1,2})\s+\w+\s+(\d{4})/);
      if (match) {
        const day = parseInt(match[1], 10);
        const year = parseInt(match[2], 10);
        return new Date(year, monthIndex, day);
      }
    }
  }
  
  return null;
}

/**
 * Convert to Asia/Dhaka timezone
 */
export function convertToDhakaTime(date: Date): Date {
  // Create a new date with BD timezone offset
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (BD_UTC_OFFSET * 3600000));
}

/**
 * Convert from Dhaka time to UTC
 */
export function convertFromDhakaToUTC(date: Date): Date {
  const utc = date.getTime() - (BD_UTC_OFFSET * 3600000);
  return new Date(utc - (date.getTimezoneOffset() * 60000));
}

/**
 * Format date for display in Dhaka timezone
 */
export function formatForDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dhakaTime = convertToDhakaTime(d);
  
  return dhakaTime.toLocaleString('bn-BD', {
    timeZone: BD_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate auto-close time (5 minutes before event)
 */
function calculateAutoClose(eventTime: Date): Date {
  const autoClose = new Date(eventTime.getTime() - 5 * 60 * 1000); // 5 minutes before
  return autoClose;
}

/**
 * Validate timing
 */
function validateTiming(
  tradingClosesAt: Date,
  resolutionDate: Date
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const now = new Date();
  
  // Check if dates are in the past
  if (tradingClosesAt < now) {
    return { isValid: false, warnings: ['Trading close time is in the past'] };
  }
  
  if (resolutionDate < now) {
    return { isValid: false, warnings: ['Resolution date is in the past'] };
  }
  
  // Check if resolution is after trading close
  if (resolutionDate <= tradingClosesAt) {
    warnings.push('Resolution should be after trading closes');
  }
  
  // Check minimum duration (at least 1 hour)
  const duration = resolutionDate.getTime() - tradingClosesAt.getTime();
  if (duration < 60 * 60 * 1000) {
    warnings.push('Minimum 1 hour gap recommended between close and resolution');
  }
  
  // Check if too far in future (more than 1 year)
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (resolutionDate.getTime() - now.getTime() > oneYear) {
    warnings.push('Event is more than 1 year in the future');
  }
  
  return { isValid: warnings.length === 0, warnings };
}

/**
 * Rule-based timing analysis
 */
function analyzeTimingRuleBased(context: AgentContext): TimingResult {
  const eventType = detectEventType(context.title || '');
  const duration = EVENT_DURATIONS[eventType] || EVENT_DURATIONS.default;
  
  // Parse existing dates or create defaults
  let tradingClosesAt = parseDate(context.tradingClosesAt);
  let resolutionDate = parseDate(context.resolutionDate);
  
  // If no dates provided, create defaults
  if (!tradingClosesAt) {
    tradingClosesAt = new Date();
    tradingClosesAt.setHours(tradingClosesAt.getHours() + duration);
  }
  
  if (!resolutionDate) {
    resolutionDate = new Date(tradingClosesAt.getTime() + 60 * 60 * 1000); // 1 hour after close
  }
  
  // Apply auto-close logic (5 min before event for sports)
  if (eventType === 'cricket_match' || eventType === 'football_match') {
    tradingClosesAt = calculateAutoClose(resolutionDate);
  }
  
  const validation = validateTiming(tradingClosesAt, resolutionDate);
  
  return {
    tradingClosesAt: tradingClosesAt.toISOString(),
    resolutionDate: resolutionDate.toISOString(),
    timezone: BD_TIMEZONE,
    isValid: validation.isValid,
    warnings: validation.warnings,
    confidence: 0.75,
  };
}

/**
 * Vertex AI timing analysis (SERVER-SIDE ONLY)
 */
async function analyzeWithVertexAI(context: AgentContext): Promise<TimingResult> {
  const response = await fetch('/api/ai/vertex-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'timing',
      context,
    }),
  });

  if (!response.ok) {
    throw new Error('Vertex AI API call failed');
  }

  const data = await response.json();
  
  const tradingClosesAt = new Date(data.result.tradingClosesAt);
  const resolutionDate = new Date(data.result.resolutionDate);
  const validation = validateTiming(tradingClosesAt, resolutionDate);
  
  return {
    ...data.result,
    timezone: BD_TIMEZONE,
    isValid: validation.isValid,
    warnings: [...validation.warnings, ...(data.result.warnings || [])],
    confidence: 0.85,
  };
}

/**
 * Kimi API timing analysis
 */
async function analyzeWithKimi(context: AgentContext): Promise<TimingResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not set');
  }
  
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-latest',
      messages: [
        {
          role: 'system',
          content: 'You determine optimal timing for prediction markets in Asia/Dhaka timezone (UTC+6).',
        },
        {
          role: 'user',
          content: `Event: "${context.title}"
Current time: ${new Date().toISOString()}

Return JSON with trading close and resolution times:
{
  "tradingClosesAt": "2025-02-26T14:00:00+06:00",
  "resolutionDate": "2025-02-26T20:00:00+06:00",
  "warnings": []
}`,
        },
      ],
      temperature: 0.1,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response');
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  const tradingClosesAt = new Date(parsed.tradingClosesAt);
  const resolutionDate = new Date(parsed.resolutionDate);
  const validation = validateTiming(tradingClosesAt, resolutionDate);
  
  return {
    tradingClosesAt: parsed.tradingClosesAt,
    resolutionDate: parsed.resolutionDate,
    timezone: BD_TIMEZONE,
    isValid: validation.isValid,
    warnings: [...validation.warnings, ...(parsed.warnings || [])],
    confidence: 0.8,
  };
}

/**
 * Main Timing Agent
 */
export async function runTimingAgent(
  context: AgentContext
): Promise<TimingResult> {
  console.log('[TimingAgent] Analyzing timing for:', context.title);
  
  const { result, provider } = await executeWithFailover(
    () => analyzeWithVertexAI(context),
    () => analyzeWithKimi(context),
    () => analyzeTimingRuleBased(context)
  );
  
  console.log(`[TimingAgent] Completed using ${provider}`);
  
  return result;
}

/**
 * Quick timing suggestion
 */
export function quickTimingSuggestion(title: string): {
  tradingClosesAt: string;
  resolutionDate: string;
} {
  const eventType = detectEventType(title);
  const duration = EVENT_DURATIONS[eventType] || EVENT_DURATIONS.default;
  
  const tradingClosesAt = new Date();
  tradingClosesAt.setHours(tradingClosesAt.getHours() + duration);
  
  const resolutionDate = new Date(tradingClosesAt.getTime() + 60 * 60 * 1000);
  
  return {
    tradingClosesAt: tradingClosesAt.toISOString(),
    resolutionDate: resolutionDate.toISOString(),
  };
}

/**
 * Format duration for display
 */
export function formatDuration(hours: number): string {
  if (hours < 24) {
    return `${hours} ঘণ্টা`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return `${days} দিন`;
  }
  return `${days} দিন ${remainingHours} ঘণ্টা`;
}
