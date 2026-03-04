'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Smartphone,
    Zap,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Percent,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';

interface Order {
    price: number;
    quantity: number;
    total: number;
}

interface MobileTradingPanelProps {
    marketId: string;
    marketSlug: string;
    yesPrice: number;
    noPrice: number;
    onOrderPlaced?: (order: { outcome: 'YES' | 'NO'; quantity: number; price: number }) => void;
}

export function MobileTradingPanel({
    marketId,
    marketSlug,
    yesPrice,
    noPrice,
    onOrderPlaced
}: MobileTradingPanelProps) {
    const { t } = useTranslation();
    const supabase = createClient();

    const [activeView, setActiveView] = useState<'order' | 'book'>('order');
    const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
    const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
    const [quantity, setQuantity] = useState<string>('');
    const [isPlacing, setIsPlacing] = useState(false);

    // Quick amount buttons
    const quickAmounts = [10, 25, 50, 100, 250, 500];

    const calculateTotal = useCallback(() => {
        const qty = parseFloat(quantity) || 0;
        const price = outcome === 'YES' ? yesPrice : noPrice;
        return (qty * price).toFixed(2);
    }, [quantity, outcome, yesPrice, noPrice]);

    const handleQuickAmount = (amount: number) => {
        const price = outcome === 'YES' ? yesPrice : noPrice;
        if (price > 0) {
            const qty = amount / price;
            setQuantity(qty.toFixed(4));
        }
    };

    const handlePlaceOrder = async () => {
        const qty = parseFloat(quantity);
        if (!qty || qty <= 0) return;

        setIsPlacing(true);
        try {
            // Place order via API
            const price = outcome === 'YES' ? yesPrice : noPrice;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please login to trade');
                return;
            }

            const response = await fetch('/api/trading/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    market_id: marketId,
                    outcome,
                    order_type: 'market',
                    side: orderSide,
                    quantity: qty,
                    user_id: user.id,
                }),
            });

            if (response.ok) {
                setQuantity('');
                onOrderPlaced?.({ outcome, quantity: qty, price });

                // Haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            } else {
                const error = await response.json();
                alert(error.message || 'Order failed');
            }
        } catch (error) {
            console.error('Order error:', error);
            alert('Failed to place order');
        } finally {
            setIsPlacing(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Mobile Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Quick Trade
                </h3>

                {/* View Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setActiveView('order')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${activeView === 'order' ? 'bg-primary text-primary-foreground' : ''
                            }`}
                    >
                        Order
                    </button>
                    <button
                        onClick={() => setActiveView('book')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${activeView === 'book' ? 'bg-primary text-primary-foreground' : ''
                            }`}
                    >
                        Book
                    </button>
                </div>
            </div>

            {/* Order Entry View */}
            {activeView === 'order' && (
                <div className="space-y-4">
                    {/* Outcome Toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setOutcome('YES')}
                            className={`p-3 rounded-lg border-2 transition-all ${outcome === 'YES'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : 'border-muted'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ArrowUp className={`w-4 h-4 ${outcome === 'YES' ? 'text-green-500' : ''}`} />
                                <span className="font-bold">YES</span>
                            </div>
                            <div className="text-center mt-1 text-green-500 font-semibold">
                                {(yesPrice * 100).toFixed(0)}%
                            </div>
                        </button>

                        <button
                            onClick={() => setOutcome('NO')}
                            className={`p-3 rounded-lg border-2 transition-all ${outcome === 'NO'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-muted'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ArrowDown className={`w-4 h-4 ${outcome === 'NO' ? 'text-red-500' : ''}`} />
                                <span className="font-bold">NO</span>
                            </div>
                            <div className="text-center mt-1 text-red-500 font-semibold">
                                {(noPrice * 100).toFixed(0)}%
                            </div>
                        </button>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Quick Amount (BDT)</label>
                        <div className="grid grid-cols-6 gap-1">
                            {quickAmounts.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => handleQuickAmount(amount)}
                                    className="p-2 text-xs bg-muted rounded hover:bg-muted/80 transition-colors"
                                >
                                    ৳{amount}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity Input */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Quantity (YES shares)</label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="text-lg font-semibold"
                        />
                    </div>

                    {/* Order Summary */}
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price</span>
                            <span className="font-medium">${outcome === 'YES' ? yesPrice.toFixed(2) : noPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Quantity</span>
                            <span className="font-medium">{parseFloat(quantity || '0').toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total</span>
                            <span>৳{calculateTotal()}</span>
                        </div>
                    </div>

                    {/* Place Order Button */}
                    <Button
                        onClick={handlePlaceOrder}
                        disabled={isPlacing || !quantity || parseFloat(quantity) <= 0}
                        className={`w-full py-6 text-lg font-bold ${outcome === 'YES'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {isPlacing ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Zap className="w-5 h-5 mr-2" />
                                Place Order
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Order Book View (Simplified for mobile) */}
            {activeView === 'book' && (
                <div className="space-y-2">
                    <div className="text-sm text-muted-foreground text-center">
                        Tap prices to auto-fill
                    </div>

                    {/* YES Orders */}
                    <div
                        onClick={() => {
                            setOutcome('YES');
                            setQuantity('1');
                        }}
                        className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 cursor-pointer"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ArrowUp className="w-4 h-4 text-green-500" />
                                <span className="font-bold">YES</span>
                            </div>
                            <span className="text-green-500 font-bold">{(yesPrice * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    {/* NO Orders */}
                    <div
                        onClick={() => {
                            setOutcome('NO');
                            setQuantity('1');
                        }}
                        className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 cursor-pointer"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ArrowDown className="w-4 h-4 text-red-500" />
                                <span className="font-bold">NO</span>
                            </div>
                            <span className="text-red-500 font-bold">{(noPrice * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                        Swipe between order entry and quick view
                    </p>
                </div>
            )}
        </div>
    );
}

export default MobileTradingPanel;
