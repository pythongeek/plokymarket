/**
 * Admin Expert Panel Page
 * Expert panel management interface
 */

import { Metadata } from 'next';
import { ExpertPanel } from '@/components/admin/ExpertPanel';

export const metadata: Metadata = {
  title: 'Expert Panel Management | Plokymarket Admin',
  description: 'Manage expert panel, reputation system, and expert votes',
};

export default function ExpertsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ExpertPanel />
    </div>
  );
}
