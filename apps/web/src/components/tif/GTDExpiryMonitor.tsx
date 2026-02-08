/**
 * GTD Expiry Monitor Component
 * 
 * Shows GTD orders nearing expiry
 * Allows extending expiry times
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useTIF, useGTDCountdown } from '@/hooks/useTIF';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Order } from '@/types';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Timer,
  RefreshCw,
  Edit3,
  X,
} from 'lucide-react';

interface GTDExpiryMonitorProps {
  userId: string;
  onOrderExpired?: (orderId: string) => void;
}

function GTDOrderItem({
  order,
  onExtend,
}: {
  order: Order;
  onExtend: (order: Order) => void;
}) {
  const { formattedTime, isExpired, timeRemaining } = useGTDCountdown(order.gtd_expiry || null);
  
  const isUrgent = timeRemaining < 300000; // Less than 5 minutes
  const isWarning = timeRemaining < 600000; // Less than 10 minutes

  return (
    <div className={`p-3 rounded-lg border ${isExpired ? 'bg-red-500/5 border-red-500/20' : 'bg-muted'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {order.id.substring(0, 8)}...
            </span>
            <Badge variant={order.side === 'buy' ? 'default' : 'secondary'} className="text-xs">
              {order.side?.toUpperCase()}
            </Badge>
          </div>
          
          <div className="mt-1 text-sm">
            ৳{order.price} × {order.quantity - (order.filled_quantity || 0)} remaining
          </div>
          
          {order.filled_quantity > 0 && (
            <div className="text-xs text-muted-foreground">
              {order.filled_quantity} filled
            </div>
          )}
        </div>

        <div className="text-right">
          <div className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : isUrgent ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'}`}>
            {isExpired ? (
              <X className="h-3 w-3" />
            ) : (
              <Timer className="h-3 w-3" />
            )}
            <span className="text-sm font-medium">
              {isExpired ? 'Expired' : formattedTime}
            </span>
          </div>
          
          {!isExpired && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs mt-1"
              onClick={() => onExtend(order)}
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Extend
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function GTDExpiryMonitor({
  userId,
  onOrderExpired,
}: GTDExpiryMonitorProps) {
  const [extendOrder, setExtendOrder] = useState<Order | null>(null);
  const [newExpiry, setNewExpiry] = useState('');
  const { toast } = useToast();
  
  const { gtdOrdersNearingExpiry, refreshGTDOrders } = useTIF(userId, {
    onExpiry: (orderId) => {
      toast({
        title: 'GTD Order Expired',
        description: `Order ${orderId.substring(0, 8)} has expired`,
        variant: 'default',
      });
      onOrderExpired?.(orderId);
    },
  });

  const urgentOrders = gtdOrdersNearingExpiry.filter(o => {
    if (!o.gtd_expiry) return false;
    const remaining = new Date(o.gtd_expiry).getTime() - Date.now();
    return remaining < 600000 && remaining > 0; // Less than 10 minutes
  });

  const expiredOrders = gtdOrdersNearingExpiry.filter(o => {
    if (!o.gtd_expiry) return false;
    return new Date(o.gtd_expiry).getTime() <= Date.now();
  });

  const handleExtend = async () => {
    if (!extendOrder || !newExpiry) return;

    const { updateGTDExpiry } = await import('@/lib/tif/service');
    const result = await updateGTDExpiry(extendOrder.id, newExpiry);

    if (result.success) {
      toast({
        title: 'Expiry Extended',
        description: 'GTD expiry time has been updated',
        variant: 'default',
      });
      refreshGTDOrders();
    } else {
      toast({
        title: 'Extension Failed',
        description: result.message,
        variant: 'destructive',
      });
    }

    setExtendOrder(null);
    setNewExpiry('');
  };

  const minExpiryTime = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              GTD Expiry Monitor
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={refreshGTDOrders}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {urgentOrders.length > 0 && (
            <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                {urgentOrders.length} order(s) expiring within 10 minutes
              </AlertDescription>
            </Alert>
          )}

          {expiredOrders.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-700">
                <X className="h-4 w-4" />
                <span className="font-medium">{expiredOrders.length} order(s) expired</span>
              </div>
            </div>
          )}

          {gtdOrdersNearingExpiry.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No GTD orders nearing expiry</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {gtdOrdersNearingExpiry.map((order) => (
                  <GTDOrderItem
                    key={order.id}
                    order={order}
                    onExtend={setExtendOrder}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Extend Dialog */}
      <Dialog open={!!extendOrder} onOpenChange={() => setExtendOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Extend GTD Expiry
            </DialogTitle>
            <DialogDescription>
              Set a new expiry time for this order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="text-sm font-medium">Order</div>
              <div className="text-xs text-muted-foreground font-mono">
                {extendOrder?.id.substring(0, 12)}...
              </div>
              <div className="mt-1 text-sm">
                ৳{extendOrder?.price} × {extendOrder?.quantity}
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Expiry Time</Label>
              <Input
                type="datetime-local"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                min={minExpiryTime}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 5 minutes from now
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handleExtend} disabled={!newExpiry}>
              Extend Expiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Need to import Alert and AlertDescription
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export default GTDExpiryMonitor;
