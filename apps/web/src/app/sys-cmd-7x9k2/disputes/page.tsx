/**
 * Admin Disputes Page
 * Dispute and manual review management interface
 */

import { Metadata } from 'next';
import { DisputePanel } from '@/components/admin/DisputePanel';

export const metadata: Metadata = {
  title: 'Dispute & Review Management | Plokymarket Admin',
  description: 'Handle disputes and manual market resolutions',
};

export default function DisputesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <DisputePanel />
    </div>
  );
}
