import { Metadata } from 'next';
import { TradeMonitor } from '@/components/admin/monitoring/TradeMonitor';

export const metadata: Metadata = {
  title: 'ট্রেড মনিটরিং | Admin Trade Monitor',
  description: 'Real-time trade monitoring and analytics',
};

export default function TradesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-2">
      <TradeMonitor />
    </div>
  );
}
