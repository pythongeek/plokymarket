import { Metadata } from 'next';
import { SecureAdminLayout } from '@/components/admin/SecureAdminLayout';

export const metadata: Metadata = {
  title: 'Market Control Center',
  description: 'Market Creation and Management',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SecureAdminLayout>{children}</SecureAdminLayout>;
}
