/**
 * Pro-Rata Matching Visualizer
 * 
 * Displays:
 * - Proportional allocation calculation
 * - Remainder distribution
 * - Time priority visualization
 * - Price level allocation breakdown
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProRataMatching } from '@/hooks/useMatchingEngine';
import { useToast } from '@/components/ui/use-toast';
import {
  PieChart,
  Calculator,
  Clock,
  Users,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';

interface OrderInQueue {
  id: string;
  size: number;
  timePriority: number;
  proportional: number;
  remainder: number;
  total: number;
}

interface ProRataVisualizerProps {
  priceLevelId?: string;
}

export function ProRataVisualizer({
  priceLevelId,
}: ProRataVisualizerProps) {
  const [incomingSize, setIncomingSize] = useState('10000');
  const [mockQueue, setMockQueue] = useState<OrderInQueue[]>([
    { id: 'A', size: 5000, timePriority: 1, proportional: 0, remainder: 0, total: 0 },
    { id: 'B', size: 3000, timePriority: 2, proportional: 0, remainder: 0, total: 0 },
    { id: 'C', size: 2000, timePriority: 3, proportional: 0, remainder: 0, total: 0 },
  ]);
  
  const { calculate, isCalculating } = useProRataMatching();
  const { toast } = useToast();

  const totalVolume = mockQueue.reduce((sum, o) => sum + o.size, 0);

  const handleCalculate = () => {
    const size = parseFloat(incomingSize);
    if (isNaN(size) || size <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid incoming size',
        variant: 'destructive',
      });
      return;
    }

    // Calculate pro-rata fills
    let remaining = size;
    let allocated = 0;

    const updated = mockQueue.map((order) => {
      const proportional = (size * order.size) / totalVolume;
      const fill = Math.min(proportional, order.size, remaining);
      
      allocated += fill;
      remaining -= fill;
      
      return {
        ...order,
        proportional: fill,
        remainder: 0,
        total: fill,
      };
    });

    // Distribute remainder by time priority
    let remainder = size - allocated;
    const withRemainder = updated.map((order) => {
      const additional = Math.min(order.size - order.total, remainder);
      remainder -= additional;
      
      return {
        ...order,
        remainder: additional,
        total: order.total + additional,
      };
    });

    setMockQueue(withRemainder);

    toast({
      title: 'Pro-Rata Calculation Complete',
      description: `Allocated ${size.toLocaleString()} across ${mockQueue.length} orders`,
    });
  };

  const reset = () => {
    setMockQueue([
      { id: 'A', size: 5000, timePriority: 1, proportional: 0, remainder: 0, total: 0 },
      { id: 'B', size: 3000, timePriority: 2, proportional: 0, remainder: 0, total: 0 },
      { id: 'C', size: 2000, timePriority: 3, proportional: 0, remainder: 0, total: 0 },
    ]);
    setIncomingSize('10000');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Pro-Rata Matching Visualizer
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Info className="h-3 w-3 mr-1" />
            Demo
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Incoming Order Size</Label>
            <Input
              type="number"
              value={incomingSize}
              onChange={(e) => setIncomingSize(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Total Volume in Queue</Label>
            <div className="h-8 flex items-center px-3 rounded-md bg-muted text-sm">
              {totalVolume.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="flex-1"
            size="sm"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Pro-Rata
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Explanation */}
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-700">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-3 w-3" />
            <span className="font-medium">How Pro-Rata Works:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Proportional allocation based on order size</li>
            <li>Remainder distributed by time priority (FIFO)</li>
          </ol>
        </div>

        {/* Queue Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Order Queue</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Time Priority</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {mockQueue.map((order, index) => (
                <div
                  key={order.id}
                  className="p-3 rounded-lg bg-muted space-y-2"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">Order {order.id}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Priority {order.timePriority}
                    </Badge>
                  </div>

                  {/* Original Size */}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Original Size:</span>
                    <span>{order.size.toLocaleString()}</span>
                  </div>

                  {/* Proportional Allocation */}
                  {order.proportional > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Proportional:</span>
                        <span>{order.proportional.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={(order.proportional / order.size) * 100}
                        className="h-1 bg-blue-500"
                      />
                    </div>
                  )}

                  {/* Remainder */}
                  {order.remainder > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Remainder:</span>
                        <span>{order.remainder.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={(order.remainder / order.size) * 100}
                        className="h-1 bg-yellow-500"
                      />
                    </div>
                  )}

                  {/* Total */}
                  {order.total > 0 && (
                    <div className="flex justify-between text-sm font-medium pt-1 border-t">
                      <span>Total Allocated:</span>
                      <span className="text-green-600">
                        {order.total.toLocaleString()}
                        {' '}
                        <span className="text-xs text-muted-foreground">
                          ({((order.total / order.size) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Summary */}
        {mockQueue.some(o => o.total > 0) && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-primary/10 rounded-lg p-2">
              <div className="text-lg font-bold">
                {mockQueue.reduce((sum, o) => sum + o.proportional, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Proportional</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-2">
              <div className="text-lg font-bold">
                {mockQueue.reduce((sum, o) => sum + o.remainder, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Remainder</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2">
              <div className="text-lg font-bold">
                {mockQueue.reduce((sum, o) => sum + o.total, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProRataVisualizer;
