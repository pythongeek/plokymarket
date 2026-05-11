'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';

const ADMIN_PATH = '/sys-cmd-7x9k2';

export function HeaderWrapper() {
  const pathname = usePathname();
  
  // Skip header on admin panel (it has its own)
  if (pathname?.startsWith(ADMIN_PATH)) {
    return null;
  }
  
  return <Navbar />;
}
