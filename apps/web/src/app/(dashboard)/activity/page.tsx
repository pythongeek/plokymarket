import { ActivityService } from '@/lib/activity/service';
import { ActivityItem } from '@/components/activity/ActivityItem';

export const revalidate = 60; // Revalidate every minute

export default async function ActivityPage() {
    const service = new ActivityService();
    // In a real scenario with proper auth, this calls the DB
    // For now, we might get empty array if migration not run, handling that gracefully

    let activities = [];
    try {
        activities = await service.getGlobalFeed();
    } catch (e) {
        console.error("Feed fetch failed (db likely not ready)", e);
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
                <p className="text-muted-foreground">See what's happening on Plokymarket right now.</p>
            </div>

            <div className="space-y-4">
                {activities.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">No recent activity. Be the first!</p>
                    </div>
                ) : (
                    activities.map((activity: any) => (
                        <ActivityItem key={activity.id} activity={activity} />
                    ))
                )}
            </div>
        </div>
    );
}
