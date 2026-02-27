/**
 * Format Utilities for Plokymarket
 */

/**
 * Format a number as Bangladeshi Taka (BDT)
 */
export function formatBDT(amount: number): string {
    if (amount >= 1e7) return `৳${(amount / 1e7).toFixed(2)} কোটি`; // Crore
    if (amount >= 1e5) return `৳${(amount / 1e5).toFixed(2)} লাখ`; // Lakh
    if (amount >= 1e3) return `৳${(amount / 1e3).toFixed(1)}K`;
    return `৳${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format time to relative string (fallback for date-fns)
 */
export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'এইমাত্র';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} মিনিট আগে`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ঘণ্টা আগে`;
    return `${Math.floor(diffInSeconds / 86400)} দিন আগে`;
}
