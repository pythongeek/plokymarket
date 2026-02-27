'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  UserPlus,
  Award,
  Bell,
  DollarSign,
  Activity,
  MoreHorizontal,
  Filter,
  Settings,
  Pause,
  Play,
  X,
  Check,
  ChevronDown,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import {
  Activity as ActivityType,
  ActivityAggregation,
  ContentType,
  FeedPreferences,
  MarketMovementActivity,
  TraderActivity,
  SocialInteractionActivity,
  SystemNotificationActivity,
  TrendingMarketActivity
} from '@/types/social';

// ===================================
// ACTIVITY ICON MAP
// ===================================

const activityIcons: Record<ContentType, React.ReactNode> = {
  market_movement: <TrendingUp className="w-4 h-4" />,
  trader_activity: <Activity className="w-4 h-4" />,
  system_notification: <Bell className="w-4 h-4" />,
  social_interaction: <MessageSquare className="w-4 h-4" />,
  trending_market: <BarChart3 className="w-4 h-4" />,
  comment_reply: <MessageSquare className="w-4 h-4" />,
  mention: <UserPlus className="w-4 h-4" />,
  follow: <UserPlus className="w-4 h-4" />,
  badge_earned: <Award className="w-4 h-4" />,
  market_resolve: <Check className="w-4 h-4" />
};

const activityColors: Record<ContentType, string> = {
  market_movement: 'bg-blue-500/10 text-blue-500',
  trader_activity: 'bg-purple-500/10 text-purple-500',
  system_notification: 'bg-amber-500/10 text-amber-500',
  social_interaction: 'bg-green-500/10 text-green-500',
  trending_market: 'bg-pink-500/10 text-pink-500',
  comment_reply: 'bg-cyan-500/10 text-cyan-500',
  mention: 'bg-indigo-500/10 text-indigo-500',
  follow: 'bg-emerald-500/10 text-emerald-500',
  badge_earned: 'bg-yellow-500/10 text-yellow-500',
  market_resolve: 'bg-green-500/10 text-green-500'
};

// ===================================
// SINGLE ACTIVITY ITEM
// ===================================

interface ActivityItemProps {
  activity: ActivityType;
  onMarkRead?: () => void;
  compact?: boolean;
}

function ActivityItem({ activity, onMarkRead, compact = false }: ActivityItemProps) {
  const renderContent = () => {
    switch (activity.type) {
      case 'market_movement': {
        const data = activity.data as MarketMovementActivity;
        const isPositive = data.priceChange >= 0;
        return (
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">{data.marketQuestion}</span>
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className={cn(
                'flex items-center gap-1',
                isPositive ? 'text-green-500' : 'text-red-500'
              )}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{data.priceChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">
                ${data.newPrice.toFixed(2)} (was ${data.oldPrice.toFixed(2)})
              </span>
            </div>
          </div>
        );
      }

      case 'trader_activity': {
        const data = activity.data as TraderActivity;
        return (
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">{data.traderName}</span>
              {' '}{data.action}
              {data.amount && (
                <span className="text-muted-foreground"> ${data.amount.toLocaleString()}</span>
              )}
              {data.position && (
                <Badge
                  variant="outline"
                  className={cn(
                    'ml-2 text-[10px]',
                    data.position === 'YES' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                  )}
                >
                  {data.position}
                </Badge>
              )}
            </p>
            {data.marketQuestion && (
              <p className="text-xs text-muted-foreground">{data.marketQuestion}</p>
            )}
          </div>
        );
      }

      case 'social_interaction': {
        const data = activity.data as SocialInteractionActivity;
        return (
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">{data.sourceUserName}</span>
              {' '}{data.interactionType === 'reply' ? 'replied to your comment' :
                data.interactionType === 'mention' ? 'mentioned you' :
                  data.interactionType === 'upvote' ? 'upvoted your comment' :
                    'started following you'}
            </p>
            {data.content && (
              <p className="text-xs text-muted-foreground italic">"{data.content}"</p>
            )}
          </div>
        );
      }

      case 'system_notification': {
        const data = activity.data as SystemNotificationActivity;
        return (
          <div className="space-y-1">
            <p className="text-sm">{data.message}</p>
            {data.marketQuestion && (
              <p className="text-xs text-muted-foreground">{data.marketQuestion}</p>
            )}
            {data.amount && (
              <p className={cn(
                'text-xs font-medium',
                data.amount > 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {data.amount > 0 ? '+' : ''}${Math.abs(data.amount).toLocaleString()}
              </p>
            )}
          </div>
        );
      }

      case 'trending_market': {
        const data = activity.data as TrendingMarketActivity;
        return (
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">{data.marketQuestion}</span>
              {' '}is trending
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>${data.volume24h.toLocaleString()} volume (24h)</span>
              <span>•</span>
              <span>{(data.priceMovement * 100).toFixed(1)}% price movement</span>
            </div>
          </div>
        );
      }

      case 'badge_earned': {
        const data = activity.data as { badgeId: string; badgeName: string };
        return (
          <div className="space-y-1">
            <p className="text-sm">You earned a new badge!</p>
            <p className="text-sm font-medium text-primary">{data.badgeName}</p>
          </div>
        );
      }

      default:
        return <p className="text-sm">{JSON.stringify(activity.data)}</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg transition-colors',
        !activity.is_read && 'bg-primary/5',
        'hover:bg-muted/50'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        activityColors[activity.type]
      )}>
        {activityIcons[activity.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {renderContent()}

          {!activity.is_read && onMarkRead && (
            <button
              onClick={onMarkRead}
              className="flex-shrink-0 w-2 h-2 rounded-full bg-primary"
              title="Mark as read"
            />
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(activity.created_at).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </motion.div>
  );
}

// ===================================
// ACTIVITY AGGREGATION CARD
// ===================================

interface ActivityAggregationCardProps {
  aggregation: ActivityAggregation;
  onExpand?: () => void;
}

function ActivityAggregationCard({ aggregation, onExpand }: ActivityAggregationCardProps) {
  const typeLabels: Record<ActivityAggregation['aggregation_type'], string> = {
    daily: 'Daily Summary',
    market_update: 'Market Updates',
    social_digest: 'Social Activity'
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-medium">{typeLabels[aggregation.aggregation_type]}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {aggregation.summary.total_activities} updates
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {aggregation.summary.highlights.map((highlight, i) => (
            <p key={i} className="text-sm text-muted-foreground">• {highlight}</p>
          ))}
        </div>
        {onExpand && (
          <Button variant="ghost" size="sm" onClick={onExpand} className="mt-3 w-full">
            <ChevronDown className="w-4 h-4 mr-2" />
            View All
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ===================================
// MUTE KEYWORDS DIALOG
// ===================================

function MuteKeywordsDialog({
  keywords,
  onUpdate
}: {
  keywords: string[];
  onUpdate: (keywords: string[]) => Promise<void>;
}) {
  const [newKeyword, setNewKeyword] = useState('');
  const [localKeywords, setLocalKeywords] = useState(keywords);

  const handleAdd = () => {
    if (newKeyword.trim() && !localKeywords.includes(newKeyword.trim().toLowerCase())) {
      setLocalKeywords([...localKeywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword('');
    }
  };

  const handleRemove = (keyword: string) => {
    setLocalKeywords(localKeywords.filter(k => k !== keyword));
  };

  const handleSave = async () => {
    await onUpdate(localKeywords);
    toast({ title: 'Mute list updated' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage Muted Keywords
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Muted Keywords</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter keyword to mute..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!newKeyword.trim()}>
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-auto">
            {localKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No muted keywords. Add keywords to filter out unwanted content.
              </p>
            ) : (
              localKeywords.map(keyword => (
                <div key={keyword} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{keyword}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(keyword)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===================================
// FEED CONTROLS
// ===================================

interface FeedControlsProps {
  preferences: FeedPreferences;
  onUpdatePreferences: (prefs: Partial<FeedPreferences>) => Promise<void>;
  unreadCount: number;
  onMarkAllRead: () => Promise<void>;
  onPauseNotifications: (duration?: number) => Promise<void>;
}

function FeedControls({
  preferences,
  onUpdatePreferences,
  unreadCount,
  onMarkAllRead,
  onPauseNotifications
}: FeedControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = async () => {
    await onUpdatePreferences({
      market_movements_weight: localPrefs.market_movements_weight,
      trader_activity_weight: localPrefs.trader_activity_weight,
      system_notifications_weight: localPrefs.system_notifications_weight,
      social_interactions_weight: localPrefs.social_interactions_weight,
      trending_markets_weight: localPrefs.trending_markets_weight,
      compact_mode: localPrefs.compact_mode,
      auto_expand_threads: localPrefs.auto_expand_threads,
      muted_keywords: localPrefs.muted_keywords
    });
    setIsOpen(false);
    toast({ title: 'Preferences saved' });
  };

  return (
    <div className="flex items-center gap-2">
      {unreadCount > 0 && (
        <Badge variant="default" className="gap-1">
          <Bell className="w-3 h-3" />
          {unreadCount}
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onMarkAllRead}
        disabled={unreadCount === 0}
      >
        <Check className="w-4 h-4 mr-1" />
        Mark Read
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPauseNotifications(60)}
        disabled={preferences.notifications_paused}
      >
        {preferences.notifications_paused ? (
          <><Play className="w-4 h-4 mr-1" /> Resume</>
        ) : (
          <><Pause className="w-4 h-4 mr-1" /> Pause</>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            Feed Settings
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Feed Preferences</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Content Type Weights */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Content Priorities</h4>

              <div className="space-y-3">
                {[
                  { key: 'market_movements_weight', label: 'Market Movements', icon: TrendingUp },
                  { key: 'trader_activity_weight', label: 'Trader Activity', icon: Activity },
                  { key: 'system_notifications_weight', label: 'Notifications', icon: Bell },
                  { key: 'social_interactions_weight', label: 'Social', icon: MessageSquare },
                  { key: 'trending_markets_weight', label: 'Trending', icon: BarChart3 },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {label}
                      </div>
                      <span className="text-muted-foreground">
                        {localPrefs[key as keyof FeedPreferences] as number}%
                      </span>
                    </div>
                    <Slider
                      value={[localPrefs[key as keyof FeedPreferences] as number]}
                      onValueChange={([v]) => setLocalPrefs(p => ({ ...p, [key]: v }))}
                      max={100}
                      step={10}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Display Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Display Options</h4>

              <div className="flex items-center justify-between">
                <span className="text-sm">Compact Mode</span>
                <Switch
                  checked={localPrefs.compact_mode}
                  onCheckedChange={(v) => setLocalPrefs(p => ({ ...p, compact_mode: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-expand Threads</span>
                <Switch
                  checked={localPrefs.auto_expand_threads}
                  onCheckedChange={(v) => setLocalPrefs(p => ({ ...p, auto_expand_threads: v }))}
                />
              </div>
            </div>

            <Separator />

            {/* Muted Items */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Muted Items</h4>

              <div className="space-y-3">
                <MuteKeywordsDialog
                  keywords={localPrefs.muted_keywords}
                  onUpdate={(keywords) => setLocalPrefs(p => ({ ...p, muted_keywords: keywords }))}
                />

                <div className="text-sm text-muted-foreground space-y-1">
                  {localPrefs.muted_keywords.length > 0 && (
                    <p>• {localPrefs.muted_keywords.length} keywords muted</p>
                  )}
                  {localPrefs.muted_users.length > 0 && (
                    <p>• {localPrefs.muted_users.length} users muted</p>
                  )}
                  {localPrefs.muted_markets.length > 0 && (
                    <p>• {localPrefs.muted_markets.length} markets muted</p>
                  )}
                  {localPrefs.muted_keywords.length === 0 &&
                    localPrefs.muted_users.length === 0 &&
                    localPrefs.muted_markets.length === 0 && (
                      <p>No muted items</p>
                    )}
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Preferences
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ===================================
// MAIN ACTIVITY FEED COMPONENT
// ===================================

interface ActivityFeedProps {
  userId?: string;
  marketId?: string;
  filterTypes?: ContentType[];
  enableInfiniteScroll?: boolean;
  batchSize?: number;
  className?: string;
}

export function ActivityFeed({
  userId,
  marketId,
  filterTypes,
  enableInfiniteScroll = true,
  batchSize = 20,
  className
}: ActivityFeedProps) {
  const { currentUser, isAuthenticated } = useStore();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [aggregations, setAggregations] = useState<ActivityAggregation[]>([]);
  const [preferences, setPreferences] = useState<FeedPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');

  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load initial data
  const loadActivities = useCallback(async (reset = false) => {
    if (isLoading && !reset) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'all') params.append('type', activeFilter);
      if (marketId) params.append('market_id', marketId);
      if (cursor && !reset) params.append('cursor', cursor);
      params.append('limit', batchSize.toString());

      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();

      if (reset) {
        setActivities(data.activities || []);
        setAggregations(data.aggregations || []);
      } else {
        setActivities(prev => [...prev, ...(data.activities || [])]);
        setAggregations(prev => [...prev, ...(data.aggregations || [])]);
      }

      setPreferences(data.preferences);
      setUnreadCount(data.unread_count || 0);
      setHasMore(data.has_more);
      setCursor(data.next_cursor);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, cursor, batchSize]);

  useEffect(() => {
    loadActivities(true);
  }, [activeFilter]);

  // Infinite scroll observer
  useEffect(() => {
    if (!enableInfiniteScroll || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadActivities();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [enableInfiniteScroll, hasMore, isLoading, loadActivities]);

  // Virtual list
  const allItems = useMemo(() => [...aggregations, ...activities], [aggregations, activities]);

  const virtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5
  });

  const handleMarkRead = async (activityId: string) => {
    await fetch(`/api/feed/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityIds: [activityId] })
    });

    setActivities(prev =>
      prev.map(a => a.id === activityId ? { ...a, is_read: true } : a)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/feed/read', { method: 'POST' });
    setActivities(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnreadCount(0);
    toast({ title: 'All activities marked as read' });
  };

  const handleUpdatePreferences = async (updates: Partial<FeedPreferences>) => {
    await fetch('/api/feed/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    setPreferences(prev => prev ? { ...prev, ...updates } : null);
  };

  const handlePauseNotifications = async (duration?: number) => {
    await fetch('/api/feed/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration })
    });
    setPreferences(prev => prev ? {
      ...prev,
      notifications_paused: !!duration,
      notifications_pause_until: duration
        ? new Date(Date.now() + duration * 60000).toISOString()
        : undefined
    } : null);
    toast({ title: duration ? 'Notifications paused' : 'Notifications resumed' });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Activity Feed</h2>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {activeFilter === 'all' ? 'All Types' : activeFilter.replace('_', ' ')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setActiveFilter('all')}>
                All Types
              </DropdownMenuItem>
              {Object.keys(activityIcons).map(type => (
                <DropdownMenuItem key={type} onClick={() => setActiveFilter(type as ContentType)}>
                  {type.replace('_', ' ')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {preferences && (
          <FeedControls
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            unreadCount={unreadCount}
            onMarkAllRead={handleMarkAllRead}
            onPauseNotifications={handlePauseNotifications}
          />
        )}
      </div>

      {/* Feed Content */}
      <div
        ref={parentRef}
        className="space-y-2 max-h-[calc(100vh-200px)] overflow-auto"
      >
        {isLoading && activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            Loading your feed...
          </div>
        ) : activities.length === 0 && aggregations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity.</p>
            <p className="text-sm">Start trading or following users to see updates!</p>
          </div>
        ) : (
          <>
            {/* Aggregations */}
            {aggregations.map(agg => (
              <ActivityAggregationCard
                key={agg.id}
                aggregation={agg}
                onExpand={() => {
                  // Expand aggregation
                }}
              />
            ))}

            {/* Activities */}
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative'
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = allItems[virtualItem.index];
                if ('aggregation_type' in item) return null; // Skip aggregations in virtual list

                return (
                  <div
                    key={item.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`
                    }}
                  >
                    <ActivityItem
                      activity={item as ActivityType}
                      onMarkRead={() => handleMarkRead(item.id)}
                      compact={preferences?.compact_mode}
                    />
                  </div>
                );
              })}
            </div>

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="py-4 text-center">
              {isLoading && activities.length > 0 && (
                <span className="text-muted-foreground">Loading more...</span>
              )}
              {!hasMore && activities.length > 0 && (
                <span className="text-muted-foreground text-sm">No more activities</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
