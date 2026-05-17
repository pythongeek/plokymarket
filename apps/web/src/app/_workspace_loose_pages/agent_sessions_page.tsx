import { Metadata } from 'next';
import AgentSessionMonitor from '@/components/admin/AgentSessionMonitor';
import { SecureAdminLayout } from '@/components/admin/SecureAdminLayout';

export const metadata: Metadata = {
  title: 'এজেন্ট সেশন মনিটর | Admin',
  description: 'Monitor live deposit agent sessions',
};

export default function AgentSessionsPage() {
  return (
    <SecureAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">এজেন্ট সেশন মনিটর</h1>
          <p className="text-muted-foreground mt-2">
            লাইভ ডিপোজিট সেশন মনিটরিং — সক্রিয়, অপেক্ষমাণ ও সম্পন্ন সেশন দেখুন
          </p>
        </div>
        <AgentSessionMonitor />
      </div>
    </SecureAdminLayout>
  );
}
