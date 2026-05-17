import { Metadata } from 'next';
import CryptoWalletManager from '@/components/admin/CryptoWalletManager';
import { SecureAdminLayout } from '@/components/admin/SecureAdminLayout';

export const metadata: Metadata = {
  title: 'ক্রিপ্টো ওয়ালেট মেনেজমেন্ট | Admin',
  description: 'Manage platform crypto deposit addresses',
};

export default function CryptoWalletsPage() {
  return (
    <SecureAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ক্রিপ্টো ওয়ালেট মেনেজমেন্ট</h1>
          <p className="text-muted-foreground mt-2">
            প্লাটফরমের ক্রিপ্টো ডিপোজিট ঠিকানা গুলি পরিচালনা করুন — BEP20, TRC20, TON, ERC20
          </p>
        </div>
        <CryptoWalletManager />
      </div>
    </SecureAdminLayout>
  );
}
