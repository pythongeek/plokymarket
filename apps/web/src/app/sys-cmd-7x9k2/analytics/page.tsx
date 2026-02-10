import { Metadata } from 'next';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
    title: 'Platform Analytics | Plokymarket Admin',
    description: 'Real-time platform performance metrics',
};

export default function AnalyticsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <AnalyticsDashboard />
        </div>
    );
}
