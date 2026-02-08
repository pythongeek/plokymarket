/**
 * TIF Order Form Component
 * 
 * Supports:
 * - FOK (Fill or Kill)
 * - IOC (Immediate or Cancel)
 * - GTC (Good Till Canceled)
 * - GTD (Good Till Date)
 * - AON (All or Nothing)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useTIF } from '@/hooks/useTIF';
import type { TIFType } from '@/types';
import {
  Clock,
  Zap,
  Infinity,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';

interface TIFOrderFormProps {
  marketId: string;
  userId: string;
  side: 'buy' | 'sell';
  onOrderPlaced?: () => void;
}

const TIF_OPTIONS: { value: TIFType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'GTC',
    label: 'GTC - Good Till Canceled',
    icon: <Infinity className="h-4 w-4" />,
    description: 'Order remains active until filled or manually cancelled',
  },
  {
    value: 'IOC',
    label: 'IOC - Immediate or Cancel',
    icon: <Zap className="h-4 w-4" />,
    description: 'Fill immediately available quantity, cancel the rest',
  },
  {
    value: 'FOK',
    label: 'FOK - Fill or Kill',
    icon: <Shield className="h-4 w-4" />,
    description: 'Complete fill immediately or cancel entire order',
  },
  {
    value: 'GTD',
    label: 'GTD - Good Till Date',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Active until specified date/time, then auto-expires',
  },
  {
    value: 'AON',
    label: 'AON - All or Nothing',
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: 'No partial fills permitted - complete fill or cancel',
  },
];

export function TIFOrderForm({
  marketId,
  userId,
  side,
  onOrderPlaced,
}: TIFOrderFormProps) {
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [tif, setTif] = useState<TIFType>('GTC');
  const [gtdExpiry, setGtdExpiry] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  
  const { toast } = useToast();
  const { placeOrder, orderState, resetOrderState } = useTIF(userId, {
    onSuccess: (result) => {
      toast({
        title: 'Order Placed',
        description: result?.message || 'Order placed successfully',
        variant: 'default',
      });
      onOrderPlaced?.();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Order Failed',
        description: error,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setPrice('');
    setSize('');
    setTif('GTC');
    setGtdExpiry('');
    resetOrderState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || !size) return;

    await placeOrder(
      marketId,
      side,
      parseFloat(price),
      parseFloat(size),
      tif,
      {
        gtdExpiry: tif === 'GTD' ? gtdExpiry : undefined,
      }
    );
  };

  const selectedTif = TIF_OPTIONS.find(t => t.value === tif);
  const isGtd = tif === 'GTD';
  const isSubmitting = orderState.isPlacing;

  // Calculate minimum expiry time (now + 5 minutes)
  const minExpiryTime = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Place {side.toUpperCase()} Order
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TIF Selection */}
          <div className="space-y-2">
            <Label>Time In Force (TIF)</Label>
            <Select value={tif} onValueChange={(v) => setTif(v as TIFType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select TIF type" />
              </SelectTrigger>
              <SelectContent>
                {TIF_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <p className="text-xs text-muted-foreground">
              {selectedTif?.description}
            </p>
          </div>

          {/* GTD Expiry */}
          {isGtd && (
            <div className="space-y-2">
              <Label>Expiry Time</Label>
              <Input
                type="datetime-local"
                value={gtdExpiry}
                onChange={(e) => setGtdExpiry(e.target.value)}
                min={minExpiryTime}
                required={isGtd}
              />
              <p className="text-xs text-muted-foreground">
                Order will be cancelled automatically after this time
              </p>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <Label>Price (৳)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label>Size</Label>
            <Input
              type="number"
              step="0.000001"
              min="0.000001"
              placeholder="0.00"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            />
          </div>

          {/* TIF Warnings */}
          {tif === 'FOK' && (
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-xs">
                FOK orders require immediate complete fill. Order will be cancelled if full size cannot be filled.
              </AlertDescription>
            </Alert>
          )}

          {tif === 'AON' && (
            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 text-xs">
                AON orders do not allow partial fills. Order will be cancelled if complete fill is impossible.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !price || !size || (isGtd && !gtdExpiry)}
            variant={side === 'buy' ? 'default' : 'secondary'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Placing...
              </>
            ) : (
              <>
                {side === 'buy' ? 'Buy' : 'Sell'} {tif}
              </>
            )}
          </Button>

          {/* Result */}
          {orderState.result && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={orderState.result.status === 'open' ? 'default' : 'secondary'}>
                  {orderState.result.status}
                </Badge>
              </div>
              
              {orderState.result.filled !== undefined && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Filled:</span>
                    <span>{orderState.result.filled}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span>{orderState.result.remaining}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Price:</span>
                    <span>৳{orderState.result.avgPrice?.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              <p className="text-xs text-muted-foreground pt-2 border-t">
                {orderState.result.message}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default TIFOrderForm;
