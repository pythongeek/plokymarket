import { Metadata } from 'next';
import { SystemMonitor } from '@/components/admin/monitoring/SystemMonitor';

export const metadata: Metadata = {
    title: 'System Monitoring | Plokymarket Admin',
    description: 'Real-time platform health and performance monitoring',
};

export default function MonitoringPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <SystemMonitor />
        </div>
    );
}
