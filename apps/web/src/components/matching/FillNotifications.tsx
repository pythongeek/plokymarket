/**
 * Fill Notifications Component
 * 
 * Displays:
 * - Real-time fill notifications
 * - Multi-channel delivery status
 * - Large fill alerts
 * - Fill history with filtering
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMatchingEngine } from '@/hooks/useMatchingEngine';
import { useToast } from '@/components/ui/use-toast';
import {
  Bell,
  Check,
  Mail,
  Webhook,
  Database,
  Activity,
  Shield,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { FillNotification } from '@/types';

interface FillNotificationsProps {
  marketId: string;
  userId: string;
}

function NotificationItem({ notification }: { notification: FillNotification }) {
  const isLargeFill = notification.totalValue >= 100000;
  const isBuy = notification.side === 'buy' || notification.side === 'BUY';
  
  // Channel status icons
  const channels = [
    { icon: Activity, status: notification.websocketSent, label: 'WebSocket' },
    { icon: Database, status: notification.persistentStored, label: 'Database' },
    { icon: Mail, status: notification.emailSent, label: 'Email' },
    { icon: Webhook, status: notification.webhookDelivered, label: 'Webhook' },
    { icon: Shield, status: notification.auditLogged, label: 'Audit' },
  ];

  return (
    <div className={`p-3 rounded-lg border ${isLargeFill ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-muted/50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isBuy ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={`font-medium ${isBuy ? 'text-green-600' : 'text-red-600'}`}>
            {isBuy ? 'Buy' : 'Sell'} Fill
          </span>
          {isLargeFill && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 text-xs">
              Large
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(notification.createdAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Quantity:</span>{' '}
          <span className="font-medium">{notification.quantity.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Price:</span>{' '}
          <span className="font-medium">৳{notification.price.toFixed(4)}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Total Value:</span>{' '}
          <span className="font-medium">৳{notification.totalValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Channel Status */}
      <div className="mt-3 flex items-center gap-3">
        {channels.map((channel) => (
          <div key={channel.label} className="flex items-center gap-1">
            <channel.icon
              className={`h-3 w-3 ${
                channel.status ? 'text-green-500' : 'text-gray-300'
              }`}
            />
          </div>
        ))}
      </div>

      {notification.retryCount > 0 && (
        <div className="mt-2 text-xs text-yellow-600">
          <AlertCircle className="inline h-3 w-3 mr-1" />
          Retried {notification.retryCount} time(s)
        </div>
      )}
    </div>
  );
}

export function FillNotifications({
  marketId,
  userId,
}: FillNotificationsProps) {
  const { recentFills, unreadFillCount, markFillsAsRead } = useMatchingEngine(marketId, userId);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const handleMarkAsRead = () => {
    markFillsAsRead();
    toast({
      title: 'Notifications marked as read',
      description: `${unreadFillCount} notification(s) cleared`,
    });
  };

  const filteredFills = recentFills.filter((fill) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'large') return fill.totalValue >= 100000;
    if (activeTab === 'buy') return fill.side === 'buy' || fill.side === 'BUY';
    if (activeTab === 'sell') return fill.side === 'sell' || fill.side === 'SELL';
    return true;
  });

  const largeFills = recentFills.filter(f => f.totalValue >= 100000).length;
  const buyFills = recentFills.filter(f => f.side === 'buy' || f.side === 'BUY').length;
  const sellFills = recentFills.filter(f => f.side === 'sell' || f.side === 'SELL').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Fill Notifications
            {unreadFillCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadFillCount}
              </Badge>
            )}
          </CardTitle>
          {unreadFillCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark Read
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-1 text-xs">
                {recentFills.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="large">
              Large
              <Badge variant="secondary" className="ml-1 text-xs">
                {largeFills}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="buy">
              Buy
              <Badge variant="secondary" className="ml-1 text-xs">
                {buyFills}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sell">
              Sell
              <Badge variant="secondary" className="ml-1 text-xs">
                {sellFills}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredFills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  filteredFills.map((fill) => (
                    <NotificationItem key={fill.id} notification={fill} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default FillNotifications;
