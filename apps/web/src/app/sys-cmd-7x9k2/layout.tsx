import { Metadata } from 'next';
import { SecureAdminLayout } from '@/components/admin/SecureAdminLayout';

export const metadata: Metadata = {
  title: 'System Control Panel',
  description: 'Administrative Control Interface',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SecureAdminLayout>{children}</SecureAdminLayout>;
}
