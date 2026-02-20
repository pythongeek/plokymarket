'use client';

import { useExchangeRate } from '@/hooks/useExchangeRate';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExchangeRateDisplay() {
  const { rate, loading, error, refresh, lastUpdated } = useExchangeRate();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">বর্তমান এক্সচেঞ্জ রেট</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">
              ৳{rate.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">/ 1 USDT</span>
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1">
              ত্রুটি: {error} (ফলব্যাক রেট ব্যবহৃত)
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="text-gray-500 hover:text-blue-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {lastUpdated && (
            <p className="text-xs text-gray-400">
              আপডেট: {lastUpdated.toLocaleTimeString('bn-BD')}
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-500" />
          Binance P2P মার্কেট
        </span>
        <span>•</span>
        <span>প্রতি ৫ মিনিটে আপডেট</span>
      </div>
    </div>
  );
}
