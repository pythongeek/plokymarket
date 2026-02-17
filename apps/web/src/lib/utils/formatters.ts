// Currency and number formatting utilities
// Bangladesh-specific formatting

export function formatCurrency(amount: number | string, currency: 'USDT' | 'BDT' = 'USDT'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0';
  
  if (currency === 'BDT') {
    // Bangladesh Taka formatting with comma separator
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } else {
    // USDT formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }
}

export function formatNumber(num: number | string, options: { decimals?: number; compact?: boolean } = {}): string {
  const { decimals = 2, compact = false } = options;
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard'
  }).format(number);
}

export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

export function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'deposit': 'ডিপোজিট',
    'withdrawal': 'উইথড্র',
    'bonus': 'বোনাস',
    'exchange': 'এক্সচেঞ্জ',
    'refund': 'রিফান্ড',
    'fee': 'ফি',
    'commission': 'কমিশন'
  };
  
  return typeMap[type] || type;
}

export function formatTransactionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'অপেক্ষমান',
    'completed': 'সম্পন্ন',
    'failed': 'ব্যর্থ',
    'reversed': 'বাতিল'
  };
  
  return statusMap[status] || status;
}

export function formatKYCStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'পেন্ডিং',
    'verified': 'ভেরিফাইড',
    'rejected': 'প্রত্যাখ্যাত'
  };
  
  return statusMap[status] || status;
}

export function formatMFSProvider(provider: string): string {
  const providerMap: Record<string, string> = {
    'bkash': 'bKash',
    'nagad': 'Nagad',
    'rocket': 'Rocket',
    'upay': 'Upay'
  };
  
  return providerMap[provider] || provider;
}