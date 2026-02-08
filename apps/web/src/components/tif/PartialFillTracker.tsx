/**
 * Partial Fill Tracker Component
 * 
 * Shows:
 * - Fill progress
 * - VWAP calculation
 * - Fill history
 * - Remaining quantity
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useTIF, useGTDCountdown } from '@/hooks/useTIF';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Order, PartialFillState } from '@/types';
import {
  PieChart,
  History,
  Clock,
  TrendingUp,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  Timer,
} from 'lucide-react';

interface PartialFillTrackerProps {
  order: Order;
  userId: string;
  onReEnter?: (newOrderId: string) => void;
}

export function PartialFillTracker({
  order,
  userId,
  onReEnter,
}: PartialFillTrackerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  
  const {
    partialFillState,
    fillRecords,
    vwapResult,
    refreshFillState,
    reEnterOrder,
    isLoading,
  } = useTIF(userId);

  const { formattedTime, isExpired } = useGTDCountdown(order.gtd_expiry || null);

  // Load state on mount
  useState(() => {
    refreshFillState(order.id);
  });

  const filledPercent = order.original_quantity
    ? ((order.filled_quantity || 0) / order.original_quantity) * 100
    : 0;

  const remainingQty = (order.original_quantity || order.quantity) - (order.filled_quantity || 0);

  const handleReEnter = async () => {
    if (!partialFillState) return;

    const result = await reEnterOrder(order.id, order.price);
    
    if (result.newOrderId) {
      toast({
        title: 'Order Re-entered',
        description: result.message,
        variant: 'default',
      });
      onReEnter?.(result.newOrderId);
    } else {
      toast({
        title: 'Re-entry Failed',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = () => {
    if (filledPercent >= 100) return 'bg-green-500';
    if (filledPercent > 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Fill Progress
          </CardTitle>
          <div className="flex items-center gap-2">
            {order.tif && (
              <Badge variant="outline" className="text-xs">
                {order.tif}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => refreshFillState(order.id)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {order.filled_quantity || 0} / {order.original_quantity || order.quantity} filled
            </span>
            <span className="font-medium">{filledPercent.toFixed(1)}%</span>
          </div>
          <Progress value={filledPercent} className={`h-2 ${getStatusColor()}`} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">VWAP</div>
            <div className="font-semibold">
              ৳{order.avg_fill_price?.toFixed(4) || vwapResult.averagePrice.toFixed(4)}
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Remaining</div>
            <div className="font-semibold">{remainingQty.toFixed(6)}</div>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Fills</div>
            <div className="font-semibold">{order.fill_count || fillRecords.length}</div>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Last Fill</div>
            <div className="font-semibold text-xs">
              {order.last_fill_at
                ? new Date(order.last_fill_at).toLocaleTimeString()
                : 'Never'}
            </div>
          </div>
        </div>

        {/* GTD Countdown */}
        {order.tif === 'GTD' && order.gtd_expiry && (
          <div className={`rounded-lg p-3 ${isExpired ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
            <div className="flex items-center gap-2">
              <Timer className={`h-4 w-4 ${isExpired ? 'text-red-600' : 'text-yellow-600'}`} />
              <span className={`text-sm ${isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
                {isExpired ? 'Expired' : `Expires in ${formattedTime}`}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <History className="h-4 w-4 mr-2" />
                Fill History
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Fill History
                </DialogTitle>
                <DialogDescription>
                  Detailed record of all fills for this order
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">
                      ৳{vwapResult.averagePrice.toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">VWAP</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">
                      {vwapResult.totalQuantity.toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Qty</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">
                      ৳{vwapResult.totalValue.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Value</div>
                  </div>
                </div>

                {/* Fill List */}
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {fillRecords.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No fills recorded yet</p>
                      </div>
                    ) : (
                      fillRecords.map((fill, index) => (
                        <div
                          key={fill.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              #{fill.fill_number}
                            </Badge>
                            <div>
                              <div className="text-sm font-medium">
                                {fill.quantity.toFixed(6)} @ ৳{fill.price.toFixed(4)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(fill.filled_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              ৳{fill.total_value.toFixed(2)}
                            </div>
                            <Badge
                              variant={fill.is_maker ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {fill.is_maker ? 'Maker' : 'Taker'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          {order.tif === 'GTC' && remainingQty > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleReEnter}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Re-enter
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Re-enter order with adjusted price</p>
                  <p className="text-xs text-muted-foreground">
                    Unchanged price = same priority
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PartialFillTracker;
