'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Users, ShieldAlert, Zap } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export function CopyTradingSettings() {
    const [isActive, setIsActive] = useState(false);
    const [allocation, setAllocation] = useState(10);
    const [stopLoss, setStopLoss] = useState(15);

    const handleSave = () => {
        toast({
            title: "Settings Saved",
            description: `Copy trading is now ${isActive ? 'active' : 'inactive'}.`,
        });
    };

    return (
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-400" />
                        <CardTitle>Copy Trading Settings</CardTitle>
                    </div>
                    <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        className="data-[state=checked]:bg-blue-500"
                    />
                </div>
                <CardDescription>
                    Automatically mirror trades of experts you follow.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-400" />
                            Allocation per Trade (%)
                        </Label>
                        <span className="text-sm font-bold text-blue-400">{allocation}%</span>
                    </div>
                    <Slider
                        value={[allocation]}
                        onValueChange={(v) => setAllocation(v[0])}
                        max={50}
                        step={1}
                        disabled={!isActive}
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                        Percentage of available balance per mirrored trade.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-400" />
                            Emergency Stop Loss (%)
                        </Label>
                        <span className="text-sm font-bold text-red-400">{stopLoss}%</span>
                    </div>
                    <Slider
                        value={[stopLoss]}
                        onValueChange={(v) => setStopLoss(v[0])}
                        max={50}
                        step={5}
                        disabled={!isActive}
                    />
                </div>

                <Button
                    className="w-full bg-blue-600 hover:bg-blue-500"
                    onClick={handleSave}
                >
                    Update Settings
                </Button>
            </CardContent>
        </Card>
    );
}
