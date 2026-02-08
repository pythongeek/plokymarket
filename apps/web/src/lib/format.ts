/**
 * Formatting utilities for currency, dates, and numbers
 * Bangladesh locale support
 */

// Currency formatting
export function formatCurrency(
  value: number, 
  currency: 'BDT' | 'USD' = 'BDT',
  decimals: number = 2
): string {
  if (currency === 'BDT') {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value).replace('BDT', '৳');
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Percentage formatting
export function formatPercentage(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('bn-BD', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: 'exceptZero'
  }).format(value / 100);
}

// Number formatting with Bangladesh locale
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('bn-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Compact number formatting (K, M, B)
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('bn-BD', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
}

// Date formatting
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat('bn-BD', options || defaultOptions).format(d);
}

// Date time formatting
export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Relative time formatting
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat('bn', { numeric: 'auto' });
  
  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
}

// Duration formatting
export function formatDuration(days: number): string {
  if (days < 1) return 'আজ';
  if (days === 1) return '১ দিন';
  if (days < 30) return `${days} দিন`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} মাস`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  if (remainingMonths === 0) return `${years} বছর`;
  return `${years} বছর ${remainingMonths} মাস`;
}

// Phone number formatting (Bangladesh)
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `+880 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

// Address formatting (Bangladesh)
export function formatAddress(
  street: string,
  city: string,
  district: string,
  postcode?: string
): string {
  const parts = [street, city, district];
  if (postcode) parts.push(postcode);
  return parts.join(', ');
}
