/**
 * Timezone Utilities for Plokymarket
 * All dates stored in UTC, displayed in Asia/Dhaka (GMT+6)
 * Industry Standard: "Normalize at the boundary"
 * 
 * Dependencies: dayjs, dayjs/plugin/timezone, dayjs/plugin/utc
 */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/bn'; // Bengali locale

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Default timezone for Bangladesh
const DEFAULT_TIMEZONE = 'Asia/Dhaka';

/**
 * @description Format any date to Bangladesh timezone with Bengali locale
 * @param date - Date string, Date object, or timestamp
 * @param formatStr - Optional format string (default: 'DD MMM YYYY, hh:mm A')
 * @returns Formatted date string in Bengali
 */
export const formatToDhakaTime = (
  date: string | Date | number | null | undefined,
  formatStr: string = 'DD MMM YYYY, hh:mm A'
): string => {
  if (!date) return 'N/A';
  
  try {
    return dayjs(date)
      .tz(DEFAULT_TIMEZONE)
      .locale('bn')
      .format(formatStr);
  } catch (error) {
    console.error('[Timezone] Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * @description Format date with time remaining (e.g., "3 days left")
 * @param date - Target date
 * @returns Object with formatted date and time remaining
 */
export const formatWithTimeRemaining = (
  date: string | Date | number | null | undefined
): { formatted: string; remaining: string; isExpired: boolean } => {
  if (!date) {
    return { formatted: 'N/A', remaining: 'Unknown', isExpired: true };
  }
  
  try {
    const target = dayjs(date).tz(DEFAULT_TIMEZONE);
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const diff = target.diff(now);
    
    const isExpired = diff <= 0;
    
    // Format the date
    const formatted = target.locale('bn').format('DD MMM, hh:mm A');
    
    // Calculate remaining time
    let remaining: string;
    if (isExpired) {
      remaining = 'বন্ধ হয়ে গেছে';
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        remaining = `${days} দিন ${hours} ঘন্টা বাকি`;
      } else if (hours > 0) {
        remaining = `${hours} ঘন্টা ${minutes} মিনিট বাকি`;
      } else {
        remaining = `${minutes} মিনিট বাকি`;
      }
    }
    
    return { formatted, remaining, isExpired };
  } catch (error) {
    console.error('[Timezone] Error calculating time remaining:', error);
    return { formatted: 'Invalid', remaining: 'Unknown', isExpired: true };
  }
};

/**
 * @description Convert local Bangladesh time to UTC for database storage
 * @param localDate - Date string in local Bangladesh time
 * @returns ISO string in UTC
 */
export const convertToUTC = (localDate: string | Date | null | undefined): string | null => {
  if (!localDate) return null;
  
  try {
    // Parse as Bangladesh time, convert to UTC
    return dayjs(localDate)
      .tz(DEFAULT_TIMEZONE, true) // true keeps local time
      .utc()
      .toISOString();
  } catch (error) {
    console.error('[Timezone] Error converting to UTC:', error);
    return null;
  }
};

/**
 * @description Convert UTC from database to Bangladesh time
 * @param utcDate - UTC date string from database
 * @returns Dayjs object in Bangladesh timezone
 */
export const convertFromUTC = (utcDate: string | Date | null | undefined) => {
  if (!utcDate) return null;
  
  try {
    return dayjs(utcDate).utc().tz(DEFAULT_TIMEZONE);
  } catch (error) {
    console.error('[Timezone] Error converting from UTC:', error);
    return null;
  }
};

/**
 * @description Get current time in Bangladesh timezone
 * @returns Dayjs object
 */
export const getCurrentDhakaTime = () => {
  return dayjs().tz(DEFAULT_TIMEZONE);
};

/**
 * @description Parse user input as Bangladesh time
 * @param dateString - User input date string
 * @param timeString - Optional time string (HH:mm)
 * @returns ISO UTC string for database
 */
export const parseUserInputToUTC = (
  dateString: string,
  timeString?: string
): string | null => {
  try {
    const combined = timeString 
      ? `${dateString}T${timeString}:00`
      : dateString;
    
    return dayjs(combined)
      .tz(DEFAULT_TIMEZONE, true)
      .utc()
      .toISOString();
  } catch (error) {
    console.error('[Timezone] Error parsing user input:', error);
    return null;
  }
};

/**
 * @description Format for input[type="datetime-local"]
 * @param utcDate - UTC date from database
 * @returns String in format YYYY-MM-DDTHH:mm for input
 */
export const formatForDateTimeInput = (
  utcDate: string | Date | null | undefined
): string => {
  if (!utcDate) return '';
  
  try {
    return dayjs(utcDate)
      .utc()
      .tz(DEFAULT_TIMEZONE)
      .format('YYYY-MM-DDTHH:mm');
  } catch (error) {
    console.error('[Timezone] Error formatting for input:', error);
    return '';
  }
};

/**
 * @description Add time to a date
 * @param date - Base date
 * @param amount - Amount to add
 * @param unit - Unit (day, hour, minute, etc.)
 * @returns New UTC ISO string
 */
export const addTime = (
  date: string | Date | null | undefined,
  amount: number,
  unit: 'day' | 'hour' | 'minute' | 'second' | 'week' | 'month'
): string | null => {
  if (!date) return null;
  
  try {
    return dayjs(date)
      .add(amount, unit)
      .toISOString();
  } catch (error) {
    console.error('[Timezone] Error adding time:', error);
    return null;
  }
};

/**
 * @description Check if date is in the future (in Bangladesh time)
 * @param date - Date to check
 * @returns boolean
 */
export const isFutureDate = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  try {
    const target = dayjs(date).tz(DEFAULT_TIMEZONE);
    const now = getCurrentDhakaTime();
    return target.isAfter(now);
  } catch (error) {
    console.error('[Timezone] Error checking future date:', error);
    return false;
  }
};

/**
 * @description Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to format
 * @returns Relative time string in Bengali
 */
export const getRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Unknown';
  
  try {
    const target = dayjs(date).tz(DEFAULT_TIMEZONE);
    const now = getCurrentDhakaTime();
    const diffHours = target.diff(now, 'hour');
    const diffDays = target.diff(now, 'day');
    
    if (diffHours < 0 && diffHours > -24) {
      return `${Math.abs(diffHours)} ঘন্টা আগে`;
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} দিন আগে`;
    } else if (diffHours > 0 && diffHours < 24) {
      return `${diffHours} ঘন্টায়`;
    } else if (diffDays > 0) {
      return `${diffDays} দিনে`;
    }
    return 'এখন';
  } catch (error) {
    console.error('[Timezone] Error getting relative time:', error);
    return 'Unknown';
  }
};

// Export configured dayjs instance for advanced use
export { dayjs };
export default dayjs;
