/**
 * Admin Daily Topics Page
 */

import { Metadata } from 'next';
import { DailyTopicsPanel } from '@/components/admin/DailyTopicsPanel';

export const metadata: Metadata = {
  title: 'AI Daily Topics | Plokymarket Admin',
  description: 'Manage AI-generated daily prediction market topics',
};

export default function DailyTopicsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <DailyTopicsPanel />
    </div>
  );
}
