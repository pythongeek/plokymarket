import { Metadata } from 'next';
import { MarketMonitor } from '@/components/admin/monitoring/MarketMonitor';

export const metadata: Metadata = {
  title: 'বাজার মনিটরিং | Admin Market Monitor',
  description: 'Real-time market monitoring and analytics',
};

export default function MarketMonitorPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-2">
      <MarketMonitor />
    </div>
  );
}
