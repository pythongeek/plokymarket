/**
 * Currency conversion utilities for BDT to USDT and vice-versa.
 * Bangladesh context: Supports ৳ (BDT) and USDT symbols
 */

// Currency symbols
export const CURRENCY_SYMBOLS = {
  BDT: '৳',
  USDT: 'USDT',
  USD: '$',
} as const;

/**
 * Convert BDT amount to USDT using the current exchange rate.
 * @param bdt - Amount in Bangladeshi Taka
 * @param rate - Exchange rate (BDT per 1 USDT), e.g. 120
 * @returns Amount in USDT, rounded to 6 decimal places
 */
export function bdtToUsdt(bdt: number, rate: number): number {
    if (rate <= 0) return 0;
    return parseFloat((bdt / rate).toFixed(6));
}

/**
 * Convert USDT amount to BDT using the current exchange rate.
 * @param usdt - Amount in USDT
 * @param rate - Exchange rate (BDT per 1 USDT), e.g. 120
 * @returns Amount in BDT, rounded to 2 decimal places
 */
export function usdtToBdt(usdt: number, rate: number): number {
    if (rate <= 0) return 0;
    return parseFloat((usdt * rate).toFixed(2));
}

/**
 * Format BDT for display with Bengali locale
 * Example: ৳১,২৩৪.৫৬
 */
export function formatBDT(amount: number): string {
    const formatted = new Intl.NumberFormat('bn-BD', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
    
    return `${CURRENCY_SYMBOLS.BDT}${formatted}`;
}

/**
 * Format USDT for display
 * Example: USDT ১,২৩৪.৫৬ or USDT 1,234.56
 */
export function formatUSDT(amount: number): string {
    const formatted = new Intl.NumberFormat('bn-BD', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    }).format(amount);
    
    return `${CURRENCY_SYMBOLS.USDT} ${formatted}`;
}

/**
 * Format currency with automatic symbol selection
 * @param amount - Amount to format
 * @param currency - 'BDT' | 'USDT'
 * @returns Formatted string
 */
export function formatCurrency(amount: number, currency: 'BDT' | 'USDT' = 'BDT'): string {
    if (currency === 'USDT') {
        return formatUSDT(amount);
    }
    return formatBDT(amount);
}

/**
 * Format compact currency (for small spaces)
 * Example: ৳১.২K, USDT ৫০০
 */
export function formatCompactCurrency(amount: number, currency: 'BDT' | 'USDT' = 'BDT'): string {
    const absAmount = Math.abs(amount);
    const symbol = currency === 'USDT' ? CURRENCY_SYMBOLS.USDT : CURRENCY_SYMBOLS.BDT;
    
    let formatted: string;
    
    if (absAmount >= 10000000) { // 1 Crore
        formatted = new Intl.NumberFormat('bn-BD', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(amount / 10000000);
        return `${symbol}${formatted} কোটি`;
    } else if (absAmount >= 100000) { // 1 Lakh
        formatted = new Intl.NumberFormat('bn-BD', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(amount / 100000);
        return `${symbol}${formatted} লাখ`;
    } else if (absAmount >= 1000) {
        formatted = new Intl.NumberFormat('bn-BD', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(amount);
        return `${symbol}${formatted}`;
    }
    
    formatted = new Intl.NumberFormat('bn-BD').format(amount);
    return `${symbol}${formatted}`;
}

/**
 * Parse currency input (handle both Bengali and English digits)
 * @param input - User input string
 * @returns Parsed number
 */
export function parseCurrencyInput(input: string): number {
    if (!input) return 0;
    
    // Bengali to English digit mapping
    const bengaliToEnglish: Record<string, string> = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    
    // Convert Bengali digits to English
    let normalized = input;
    Object.entries(bengaliToEnglish).forEach(([bn, en]) => {
        normalized = normalized.replace(new RegExp(bn, 'g'), en);
    });
    
    // Remove currency symbols and non-numeric chars except decimal point
    const cleaned = normalized.replace(/[^\d.]/g, '');
    
    return parseFloat(cleaned) || 0;
}

/**
 * Get exchange rate display
 * @param rate - Exchange rate
 * @returns Formatted rate string
 */
export function formatExchangeRate(rate: number): string {
    return `১ USDT = ${formatBDT(rate)}`;
}

/**
 * Calculate total with fee
 * @param amount - Base amount
 * @param feePercent - Fee percentage
 * @returns Total amount
 */
export function calculateWithFee(amount: number, feePercent: number): number {
    const fee = amount * (feePercent / 100);
    return amount + fee;
}

/**
 * Format price for trading (with consistent decimals)
 * @param price - Price value
 * @returns Formatted price
 */
export function formatTradingPrice(price: number): string {
    return new Intl.NumberFormat('bn-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
}
