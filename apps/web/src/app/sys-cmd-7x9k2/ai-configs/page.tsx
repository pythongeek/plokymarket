/**
 * AI Topic Configurations Admin Page
 */

import { Metadata } from 'next';
import { AITopicConfigPanel } from '@/components/admin/AITopicConfigPanel';

export const metadata: Metadata = {
  title: 'AI Topic Configs | Plokymarket Admin',
  description: 'Configure AI news sources and generation settings',
};

export default function AIConfigsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <AITopicConfigPanel />
    </div>
  );
}
