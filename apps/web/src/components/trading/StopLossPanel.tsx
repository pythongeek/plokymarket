'use client';

import { useState, useEffect, useMemo } from 'react';
import { useOrderTypes, OrderType, OrderSide, Outcome } from '@/hooks/useOrderTypes';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface StopLossPanelProps {
    marketId: string;
    currentPrice: number;
    outcome: Outcome;
    positionQuantity?: number;
    avgEntryPrice?: number;
    onSuccess?: (orderId: string) => void;
    onCancel?: () => void;
}

export function StopLossPanel({
    marketId,
    currentPrice,
    outcome,
    positionQuantity = 0,
    avgEntryPrice,
    onSuccess,
    onCancel,
}: StopLossPanelProps) {
    const [orderType, setOrderType] = useState<OrderType>('stop_loss');
    const [side, setSide] = useState<OrderSide>('sell');
    const [quantity, setQuantity] = useState<number>(positionQuantity);
    const [stopPrice, setStopPrice] = useState<number>(0);
    const [limitPrice, setLimitPrice] = useState<number>(0);
    const [showOCO, setShowOCO] = useState(false);
    const [ocoLimitPrice, setOcoLimitPrice] = useState<number>(0);
    const [ocoStopPrice, setOcoStopPrice] = useState<number>(0);

    const {
        validateStopLoss,
        validateOCO,
        calculateStopLoss,
        calculateRisk,
        submitStopLossOrder,
        submitOCOOrder,
        isSubmitting,
        error,
    } = useOrderTypes();

    // Calculate recommended stop prices
    const recommendations = useMemo(() => {
        if (!avgEntryPrice) {
            // Use current price as reference for new orders
            const basePrice = currentPrice;
            return {
                recommended: side === 'buy' ? basePrice * 0.95 : basePrice * 1.05,
                aggressive: side === 'buy' ? basePrice * 0.90 : basePrice * 1.10,
                conservative: side === 'buy' ? basePrice * 0.85 : basePrice * 1.15,
            };
        }

        return calculateStopLoss({
            marketId,
            currentPrice,
            outcome,
            positionQuantity,
            avgEntryPrice,
            side,
        });
    }, [currentPrice, avgEntryPrice, side, positionQuantity, calculateStopLoss, marketId, outcome]);

    // Calculate risk metrics
    const riskMetrics = useMemo(() => {
        if (stopPrice <= 0) return null;

        return calculateRisk(
            {
                marketId,
                currentPrice,
                outcome,
                positionQuantity: quantity,
                avgEntryPrice: avgEntryPrice || currentPrice,
                side,
            },
            stopPrice
        );
    }, [stopPrice, quantity, currentPrice, avgEntryPrice, side, calculateRisk, marketId, outcome]);

    // Validate current order
    const validation = useMemo(() => {
        const order = {
            type: 'stop_loss' as const,
            side,
            outcome,
            quantity,
            stopPrice,
            limitPrice: orderType === 'stop_limit' ? limitPrice : undefined,
        };
        return validateStopLoss(order, currentPrice);
    }, [orderType, side, outcome, quantity, stopPrice, limitPrice, currentPrice, validateStopLoss]);

    // Handle quick recommendation buttons
    const applyRecommendation = (type: 'recommended' | 'aggressive' | 'conservative') => {
        const price = recommendations[type];
        setStopPrice(parseFloat(price.toFixed(2)));

        if (orderType === 'stop_limit') {
            // Set limit price with small spread
            const spread = side === 'buy' ? 0.01 : -0.01;
            setLimitPrice(parseFloat((price + spread).toFixed(2)));
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!validation.isValid) return;

        try {
            let result;

            if (showOCO) {
                const ocoOrder = {
                    type: 'oco' as const,
                    side,
                    outcome,
                    quantity,
                    limitPrice: ocoLimitPrice,
                    stopPrice: ocoStopPrice,
                };
                result = await submitOCOOrder(ocoOrder, marketId);
            } else {
                const order = {
                    type: 'stop_loss' as const,
                    side,
                    outcome,
                    quantity,
                    stopPrice,
                    limitPrice: orderType === 'stop_limit' ? limitPrice : undefined,
                };
                const result = await submitStopLossOrder(order);
                if (result.success) {
                    onSuccess?.(result.orderId ?? '');
                }
            }
        } catch (err) {
            console.error('Order submission failed:', err);
        }
    };

    return (
        <div className="bg-card border rounded-lg p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    {side === 'sell' ? (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    )}
                    {side === 'sell' ? 'Stop-Loss (Sell)' : 'Stop-Loss (Buy)'}
                </h3>
                <button
                    onClick={onCancel}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <XCircle className="w-5 h-5" />
                </button>
            </div>

            {/* Order Type Selection */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setOrderType('stop_loss'); setShowOCO(false); }}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${orderType === 'stop_loss' && !showOCO
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                >
                    Stop-Loss
                </button>
                <button
                    onClick={() => { setOrderType('stop_limit'); setShowOCO(false); }}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${orderType === 'stop_limit' && !showOCO
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                >
                    Stop-Limit
                </button>
                <button
                    onClick={() => setShowOCO(true)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${showOCO
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                >
                    OCO
                </button>
            </div>

            {/* Side Selection */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSide('buy')}
                    className={`flex-1 py-2 rounded-md font-medium transition-colors ${side === 'buy'
                        ? 'bg-green-600 text-white'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => setSide('sell')}
                    className={`flex-1 py-2 rounded-md font-medium transition-colors ${side === 'sell'
                        ? 'bg-red-600 text-white'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                >
                    Sell
                </button>
            </div>

            {/* Current Price Display */}
            <div className="bg-muted/50 rounded-md p-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Price</span>
                    <span className="font-medium">${currentPrice.toFixed(2)}</span>
                </div>
                {avgEntryPrice && (
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Avg. Entry</span>
                        <span className="font-medium">${avgEntryPrice.toFixed(2)}</span>
                    </div>
                )}
                {positionQuantity > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Position Size</span>
                        <span className="font-medium">{positionQuantity} shares</span>
                    </div>
                )}
            </div>

            {/* Quick Recommendations */}
            <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Quick Set Stop Price
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => applyRecommendation('aggressive')}
                        className="flex-1 py-2 px-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                        -10%
                    </button>
                    <button
                        onClick={() => applyRecommendation('recommended')}
                        className="flex-1 py-2 px-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                    >
                        -5%
                    </button>
                    <button
                        onClick={() => applyRecommendation('conservative')}
                        className="flex-1 py-2 px-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-md text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                        -15%
                    </button>
                </div>
            </div>

            {/* Stop Price Input */}
            <div>
                <label className="text-sm font-medium mb-2 block">
                    Stop Price {side === 'sell' ? '(Below)' : '(Above)'}
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                        type="number"
                        value={stopPrice || ''}
                        onChange={(e) => setStopPrice(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        max="1"
                        className="w-full pl-8 pr-4 py-2 border rounded-md"
                        placeholder="0.00"
                    />
                </div>
                {stopPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {side === 'sell'
                            ? `Triggers when price drops to $${stopPrice.toFixed(2)}`
                            : `Triggers when price rises to $${stopPrice.toFixed(2)}`
                        }
                    </p>
                )}
            </div>

            {/* Limit Price (for stop-limit) */}
            {orderType === 'stop_limit' && !showOCO && (
                <div>
                    <label className="text-sm font-medium mb-2 block">Limit Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <input
                            type="number"
                            value={limitPrice || ''}
                            onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            max="1"
                            className="w-full pl-8 pr-4 py-2 border rounded-md"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            )}

            {/* OCO Fields */}
            {showOCO && (
                <div className="space-y-3 p-3 bg-muted/30 rounded-md">
                    <p className="text-sm font-medium">One-Cancels-Other (OCO)</p>
                    <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Limit Price</label>
                        <input
                            type="number"
                            value={ocoLimitPrice || ''}
                            onChange={(e) => setOcoLimitPrice(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Limit price"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Stop Price</label>
                        <input
                            type="number"
                            value={ocoStopPrice || ''}
                            onChange={(e) => setOcoStopPrice(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Stop price"
                        />
                    </div>
                </div>
            )}

            {/* Quantity */}
            <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <input
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-2 border rounded-md"
                    placeholder="0"
                />
            </div>

            {/* Risk Metrics */}
            {riskMetrics && (
                <div className="bg-muted/50 rounded-md p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Risk per Share</span>
                        <span className="font-medium text-red-500">
                            ${riskMetrics.riskAmount.toFixed(2)} ({riskMetrics.riskPercentage.toFixed(1)}%)
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Potential Loss</span>
                        <span className="font-medium text-red-500">
                            ${riskMetrics.potentialLoss.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {/* Validation Errors/Warnings */}
            {validation.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    {validation.errors.map((err, i) => (
                        <p key={i} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {err}
                        </p>
                    ))}
                </div>
            )}

            {validation.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                    {validation.warnings.map((warn, i) => (
                        <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                            <Info className="w-4 h-4 flex-shrink-0" />
                            {warn}
                        </p>
                    ))}
                </div>
            )}

            {/* Error from submission */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!validation.isValid || isSubmitting}
                className={`w-full py-3 rounded-md font-medium transition-colors ${validation.isValid && !isSubmitting
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                        Submitting...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Place {showOCO ? 'OCO' : orderType === 'stop_limit' ? 'Stop-Limit' : 'Stop-Loss'} Order
                    </span>
                )}
            </button>
        </div>
    );
}

export default StopLossPanel;
