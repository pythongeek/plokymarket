import { Metadata } from 'next';
import { headers } from 'next/headers';
import { SecureAdminLayout } from '@/components/admin/SecureAdminLayout';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'System Control Panel',
  description: 'Administrative Control Interface',
  robots: { index: false, follow: false },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const adminId = headerList.get('x-admin-id');
  const adminEmail = headerList.get('x-admin-email');
  const adminLevel = headerList.get('x-admin-level');

  const initialAdmin = adminId ? {
    id: adminId,
    email: adminEmail || '',
    is_super_admin: adminLevel === 'super',
    last_login: new Date().toISOString(),
  } : null;

  return (
    <SecureAdminLayout initialAdmin={initialAdmin}>
      {children}
    </SecureAdminLayout>
  );
}
