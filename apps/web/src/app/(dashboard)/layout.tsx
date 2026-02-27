'use client';

import { Navbar } from '@/components/layout/Navbar';
import dynamic from 'next/dynamic';

const BetSlip = dynamic(() => import('@/components/trading/BetSlip').then(mod => mod.BetSlip), {
  ssr: false,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <BetSlip />
    </div>
  );
}
