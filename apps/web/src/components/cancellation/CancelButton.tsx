/**
 * Advanced Cancel Button Component
 * 
 * Features:
 * - Shows cancellation progress
 * - Handles in-flight states
 * - Race condition visualization
 * - Confirmation dialogs
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCancellation } from '@/hooks/useCancellation';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  RotateCcw,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

interface CancelButtonProps {
  order: Order;
  userId: string;
  onCancelSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showConfirmation?: boolean;
}

export function CancelButton({
  order,
  userId,
  onCancelSuccess,
  variant = 'outline',
  size = 'sm',
  showConfirmation = true,
}: CancelButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const {
    cancelOrder,
    cancellationState,
    resetState,
  } = useCancellation({
    onSuccess: (result) => {
      toast({
        title: 'Order Cancelled',
        description: result.message,
        variant: 'default',
      });
      onCancelSuccess?.();
      setShowDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Cancellation Failed',
        description: error,
        variant: 'destructive',
      });
    },
    onRaceCondition: (result) => {
      toast({
        title: 'Race Condition Detected',
        description: `Fill occurred during cancellation. ${result.filledDuringCancel} units filled.`,
        variant: 'default',
      });
      setShowDetails(true);
    },
  });

  const canCancel = ['open', 'partially_filled', 'OPEN', 'PARTIAL'].includes(order.status);
  const isCancelling = cancellationState.isCancelling;

  const handleCancel = async () => {
    if (showConfirmation && !showDialog) {
      setShowDialog(true);
      return;
    }

    await cancelOrder(order.id, userId);
  };

  const getStatusIcon = () => {
    switch (cancellationState.stage) {
      case 'soft-cancel':
        return <Clock className="h-4 w-4 animate-pulse" />;
      case 'waiting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'hard-cancel':
        return <Shield className="h-4 w-4" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <X className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'cancelling':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Cancelling...
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600">
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!canCancel && order.status !== 'cancelling') {
    return getStatusBadge();
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleCancel}
        disabled={isCancelling || order.status === 'cancelling'}
        className="relative"
      >
        {isCancelling ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Cancelling...
          </>
        ) : (
          <>
            {getStatusIcon()}
            <span className="ml-2">Cancel</span>
          </>
        )}
      </Button>

      {/* Cancellation Progress Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Order Details */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono">{order.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={order.status === 'open' ? 'default' : 'secondary'}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Filled:</span>
                <span>{order.filled_quantity} / {order.quantity}</span>
              </div>
            </div>

            {/* Progress */}
            {isCancelling && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{cancellationState.message}</span>
                  <span>{cancellationState.progress}%</span>
                </div>
                <Progress value={cancellationState.progress} className="h-2" />
              </div>
            )}

            {/* Race Condition Alert */}
            {cancellationState.result?.filledDuringCancel ? (
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  A fill of {cancellationState.result.filledDuringCancel} units occurred during cancellation.
                  The cancellation was processed with the partial fill.
                </AlertDescription>
              </Alert>
            ) : null}

            {/* Error */}
            {cancellationState.stage === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{cancellationState.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2">
            {!isCancelling && cancellationState.stage !== 'complete' && (
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Keep Order
              </Button>
            )}

            {isCancelling ? (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </Button>
            ) : cancellationState.stage === 'complete' ? (
              <Button onClick={() => { setShowDialog(false); resetState(); }}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Done
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Confirm Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Race Condition Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Race Condition Resolved
            </DialogTitle>
            <DialogDescription>
              Your order experienced a race condition between cancellation and fill.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                The system automatically resolved this conflict. Fill events take precedence over cancellations.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium">Final State</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Final Status:</span>
                <Badge>{cancellationState.result?.finalStatus || order.status}</Badge>

                <span className="text-muted-foreground">Filled During Cancel:</span>
                <span>{cancellationState.result?.filledDuringCancel || 0} units</span>

                <span className="text-muted-foreground">Released Collateral:</span>
                <span>৳{cancellationState.result?.releasedCollateral?.toFixed(2) || '0.00'}</span>

                <span className="text-muted-foreground">Sequence Number:</span>
                <span className="font-mono">#{cancellationState.result?.sequenceNumber || 0}</span>
              </div>
            </div>

            {cancellationState.result?.cancelRecordId && (
              <div className="text-xs text-muted-foreground">
                Cancellation Record: {cancellationState.result.cancelRecordId}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDetails(false)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
