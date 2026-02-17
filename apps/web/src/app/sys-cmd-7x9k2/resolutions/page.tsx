/**
 * Admin Resolutions Page
 * Market resolution management interface
 */

import { Metadata } from 'next';
import { ResolutionPanel } from '@/components/admin/ResolutionPanel';

export const metadata: Metadata = {
  title: 'Resolution Management | Plokymarket Admin',
  description: 'Manage market resolutions and AI oracle decisions',
};

export default function ResolutionsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ResolutionPanel />
    </div>
  );
}
