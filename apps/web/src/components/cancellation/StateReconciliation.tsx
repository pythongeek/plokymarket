/**
 * State Reconciliation Component
 * 
 * Features:
 * - Detects state mismatches after reconnection
 * - Shows reconciliation progress
 * - Displays conflicts and resolutions
 * - Auto-reconciliation on mount
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Wifi,
  Clock,
  Shield,
} from 'lucide-react';
import { reconcileOrderStates } from '@/lib/cancellation/service';
import type { Order, ReconcileOrderState } from '@/types';

interface StateReconciliationProps {
  orders: Order[];
  userId: string;
  isOnline?: boolean;
  onReconciliationComplete?: (results: ReconcileOrderState[]) => void;
  autoReconcile?: boolean;
}

interface ConflictItem {
  orderId: string;
  localStatus: string;
  serverStatus: string;
  localFilled: number;
  serverFilled: number;
  resolution: string;
}

export function StateReconciliation({
  orders,
  userId,
  isOnline = true,
  onReconciliationComplete,
  autoReconcile = true,
}: StateReconciliationProps) {
  const [isReconciling, setIsReconciling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [lastReconcileTime, setLastReconcileTime] = useState<Date | null>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [results, setResults] = useState<ReconcileOrderState[]>([]);
  const [wasOffline, setWasOffline] = useState(false);
  const { toast } = useToast();

  // Track online status changes
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Just came back online - trigger reconciliation
      if (autoReconcile) {
        handleReconcile();
      }
    }
  }, [isOnline, wasOffline, autoReconcile]);

  // Auto-reconcile on mount if enabled
  useEffect(() => {
    if (autoReconcile && orders.length > 0) {
      handleReconcile();
    }
  }, []);

  const handleReconcile = useCallback(async () => {
    if (isReconciling || orders.length === 0) return;

    setIsReconciling(true);
    setProgress(10);

    try {
      const orderIds = orders.map(o => o.id);
      
      // Animate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 80));
      }, 50);

      const reconcileResults = await reconcileOrderStates(orderIds);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(reconcileResults);

      // Identify conflicts
      const conflictItems: ConflictItem[] = [];
      
      for (const result of reconcileResults) {
        const localOrder = orders.find(o => o.id === result.orderId);
        if (!localOrder) continue;

        const hasConflict = 
          localOrder.status !== result.currentStatus ||
          localOrder.filled_quantity !== result.filledQuantity;

        if (hasConflict) {
          conflictItems.push({
            orderId: result.orderId,
            localStatus: localOrder.status,
            serverStatus: result.currentStatus,
            localFilled: localOrder.filled_quantity,
            serverFilled: result.filledQuantity,
            resolution: getResolutionDescription(result.currentStatus, result.changesSinceSequence),
          });
        }
      }

      setConflicts(conflictItems);
      setLastReconcileTime(new Date());

      // Show appropriate toast
      if (conflictItems.length > 0) {
        toast({
          title: 'State Synchronized',
          description: `${conflictItems.length} orders had state changes while offline. Tap to review.`,
          variant: 'default',
          action: (
            <Button variant="outline" size="sm" onClick={() => setShowDetails(true)}>
              Review
            </Button>
          ),
        });
      } else {
        toast({
          title: 'State Synchronized',
          description: 'All orders are up to date.',
          variant: 'default',
        });
      }

      onReconciliationComplete?.(reconcileResults);
      setWasOffline(false);

    } catch (error: any) {
      toast({
        title: 'Reconciliation Failed',
        description: error.message || 'Failed to synchronize order states',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsReconciling(false), 500);
    }
  }, [orders, isReconciling, autoReconcile, onReconciliationComplete, toast]);

  const getResolutionDescription = (status: string, changes: any[]): string => {
    if (status === 'FILLED') return 'Order was fully filled';
    if (status === 'CANCELLED') return 'Order was cancelled';
    if (status === 'CANCELLING') return 'Cancellation in progress';
    if (status === 'EXPIRED') return 'Order expired';
    if (changes.length > 0) return `${changes.length} state changes occurred`;
    return 'State synchronized';
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <>
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        ) : wasOffline ? (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Reconnecting...
          </Badge>
        ) : conflicts.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20"
            onClick={() => setShowDetails(true)}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {conflicts.length} conflicts
          </Button>
        ) : (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <Wifi className="h-3 w-3 mr-1" />
            Synced
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReconcile}
          disabled={isReconciling || !isOnline}
          className="h-7 px-2"
        >
          {isReconciling ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          <span className="ml-1 text-xs">{formatTime(lastReconcileTime)}</span>
        </Button>
      </div>

      {/* Reconciliation Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              State Reconciliation
            </DialogTitle>
            <DialogDescription>
              Review and resolve state conflicts detected during synchronization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Progress */}
            {isReconciling && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Synchronizing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                <div className="text-xs text-blue-600/80">Total Orders</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {orders.length - conflicts.length}
                </div>
                <div className="text-xs text-green-600/80">In Sync</div>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{conflicts.length}</div>
                <div className="text-xs text-yellow-600/80">Conflicts</div>
              </div>
            </div>

            {/* Conflicts List */}
            {conflicts.length > 0 ? (
              <>
                <Alert className="bg-yellow-500/10 border-yellow-500/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    {conflicts.length} order(s) had state changes while you were offline. 
                    Server state has been applied.
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-64 border rounded-lg">
                  <div className="p-4 space-y-3">
                    {conflicts.map((conflict) => (
                      <div
                        key={conflict.orderId}
                        className="p-3 rounded-lg bg-muted space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">
                            {conflict.orderId.substring(0, 12)}...
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Resolved
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">Local State</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {conflict.localStatus}
                              </Badge>
                              <span className="text-xs">{conflict.localFilled} filled</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">Server State</span>
                            <div className="flex items-center gap-2">
                              <Badge className="text-xs">
                                {conflict.serverStatus}
                              </Badge>
                              <span className="text-xs">{conflict.serverFilled} filled</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Resolution: {conflict.resolution}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All orders synchronized</p>
                <p className="text-sm text-muted-foreground">
                  No conflicts detected. Your local state matches the server.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            <Button 
              onClick={handleReconcile} 
              disabled={isReconciling || !isOnline}
            >
              {isReconciling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-sync Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default StateReconciliation;
