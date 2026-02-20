import { Metadata } from 'next';
import WithdrawalProcessing from '@/components/admin/WithdrawalProcessing';
import { SecureAdminLayout } from '@/components/admin/SecureAdminLayout';

export const metadata: Metadata = {
  title: 'উইথড্র ম্যানেজমেন্ট | Admin',
  description: 'Manage user withdrawal requests',
};

export default function WithdrawalsPage() {
  return (
    <SecureAdminLayout>
      <WithdrawalProcessing />
    </SecureAdminLayout>
  );
}
