import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Unlock, ZoomIn, ZoomOut, Maximize2, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OrderBookControlsProps {
    zoom: number;
    onZoomChange: (value: number) => void;
    granularity: number;
    onGranularityChange: (value: number) => void;
    isLocked: boolean;
    onLockToggle: () => void;
    onFitSpread: () => void;
    onFitDepth: () => void;
    volatility?: number; // 0 to 1
    spreadPct?: number;
}

export const OrderBookControls: React.FC<OrderBookControlsProps> = ({
    zoom,
    onZoomChange,
    granularity,
    onGranularityChange,
    isLocked,
    onLockToggle,
    onFitSpread,
    onFitDepth,
    volatility = 0.02,
    spreadPct = 0.001
}) => {
    // Recommendation logic
    const getRecommendation = () => {
        if (volatility > 0.05) return { zoom: 0.5, text: "High Volatility: 0.5x zoom suggested" };
        if (spreadPct > 0.02) return { zoom: 1.0, text: "Wide Spread: 1.0x zoom suggested" };
        if (spreadPct < 0.0005) return { zoom: 5.0, text: "Tight Spread: 5.0x zoom suggested" };
        return null;
    };

    const rec = getRecommendation();

    return (
        <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-grow max-w-[200px]">
                    <ZoomOut className="w-4 h-4 text-muted-foreground" />
                    <Slider
                        value={[zoom]}
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        onValueChange={([v]) => !isLocked && onZoomChange(v)}
                        disabled={isLocked}
                        className="cursor-pointer"
                    />
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-2">
                    <Select value={granularity.toString()} onValueChange={(v) => onGranularityChange(parseInt(v))}>
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue placeholder="Granularity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">0.01% (x1)</SelectItem>
                            <SelectItem value="5">0.05% (x5)</SelectItem>
                            <SelectItem value="10">0.10% (x10)</SelectItem>
                            <SelectItem value="50">0.50% (x50)</SelectItem>
                            <SelectItem value="100">1.00% (x100)</SelectItem>
                        </SelectContent>
                    </Select>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={onLockToggle}
                                >
                                    {isLocked ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isLocked ? 'Unlock Settings' : 'Lock Settings'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <div className="flex items-center gap-2 justify-between">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={onFitSpread}>
                        Fit Spread
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={onFitDepth}>
                        Fit Depth
                    </Button>
                </div>

                {rec && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-500 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded-full cursor-pointer" onClick={() => !isLocked && onZoomChange(rec.zoom)}>
                        <Zap className="w-3 h-3" />
                        <span>{rec.text}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
