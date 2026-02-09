import { ActivityFeed } from '@/components/social/ActivityFeed';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activity Feed | Plokymarket',
  description: 'Stay updated with market movements, trader activity, and social interactions on Plokymarket.',
};

export const revalidate = 0; // Disable caching for real-time feed

export default function ActivityPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ActivityFeed 
        enableInfiniteScroll={true}
        batchSize={20}
      />
    </div>
  );
}
