/**
 * Batch Cancellation Panel
 * 
 * Features:
 * - Select multiple orders for cancellation
 * - Progress tracking for batch operations
 * - Summary of results
 * - Conflict resolution display
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useBatchCancellation } from '@/hooks/useCancellation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type { Order } from '@/types';

interface BatchCancelPanelProps {
  orders: Order[];
  userId: string;
  onCancelComplete?: () => void;
}

export function BatchCancelPanel({
  orders,
  userId,
  onCancelComplete,
}: BatchCancelPanelProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const cancellableOrders = orders.filter(o => 
    ['open', 'partially_filled', 'OPEN', 'PARTIAL'].includes(o.status)
  );

  const { cancelBatch, progress, results, isProcessing } = useBatchCancellation(5);

  const toggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleAll = () => {
    if (selectedOrders.size === cancellableOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(cancellableOrders.map(o => o.id)));
    }
  };

  const handleCancel = async () => {
    setShowConfirm(false);
    
    const orderIds = Array.from(selectedOrders);
    const cancelResults = await cancelBatch(orderIds, userId);
    
    const successful = cancelResults.filter(r => r.success).length;
    const failed = cancelResults.filter(r => !r.success).length;
    const withRaceConditions = cancelResults.filter(r => r.filledDuringCancel && r.filledDuringCancel > 0).length;

    toast({
      title: 'Batch Cancellation Complete',
      description: `${successful} cancelled, ${failed} failed, ${withRaceConditions} had race conditions`,
      variant: failed > 0 ? 'destructive' : 'default',
    });

    setSelectedOrders(new Set());
    onCancelComplete?.();
  };

  const successfulCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const raceConditionCount = results.filter(r => r.filledDuringCancel && r.filledDuringCancel > 0).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Batch Cancel Orders
          </CardTitle>
          <Badge variant="secondary">
            {selectedOrders.size} selected
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cancelling orders...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && !isProcessing && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{successfulCount}</div>
              <div className="text-xs text-green-600/80">Successful</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-xs text-red-600/80">Failed</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{raceConditionCount}</div>
              <div className="text-xs text-yellow-600/80">Race Conditions</div>
            </div>
          </div>
        )}

        {/* Order List */}
        {cancellableOrders.length > 0 ? (
          <>
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={selectedOrders.size === cancellableOrders.length && cancellableOrders.length > 0}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all {cancellableOrders.length} cancellable orders
              </span>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {cancellableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={() => toggleOrder(order.id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={order.side === 'buy' ? 'default' : 'secondary'} className="text-xs">
                          {order.side?.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          {order.id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        ৳{order.price} × {order.quantity - (order.filled_quantity || 0)} remaining
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {order.filled_quantity || 0}/{order.quantity} filled
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              variant="destructive"
              className="w-full"
              disabled={selectedOrders.size === 0 || isProcessing}
              onClick={() => setShowConfirm(true)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel {selectedOrders.size} Orders
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No cancellable orders</p>
            <p className="text-sm">All orders are either filled, cancelled, or already being cancelled.</p>
          </div>
        )}

        {/* Refresh Button */}
        {!isProcessing && results.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onCancelComplete}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Orders
          </Button>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Batch Cancellation
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to cancel {selectedOrders.size} orders. This action cannot be undone.
              <br /><br />
              Some orders may experience race conditions if they are being matched at the moment of cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Orders</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel {selectedOrders.size} Orders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
