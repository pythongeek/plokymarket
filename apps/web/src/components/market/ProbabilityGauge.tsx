'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface Props {
  yesPrice: number;
  noPrice: number;
  uniqueTraders?: number;
}

export function ProbabilityGauge({ yesPrice, noPrice, uniqueTraders = 0 }: Props) {
  const { t } = useTranslation();
  const yesPercent = Math.round((yesPrice || 0.5) * 100);
  const noPercent = 100 - yesPercent;

  const label = yesPercent >= 70 ? '🚀 Very Likely' : yesPercent >= 50 ? '👍 Likely' : yesPercent >= 30 ? '🤔 Maybe' : '👎 Unlikely';
  const color = yesPercent >= 50 ? 'bg-green-500' : 'bg-red-500';
  const textColor = yesPercent >= 50 ? 'text-green-600' : 'text-red-600';

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">📊 What people think</span>
          <span className={`text-sm font-black ${textColor}`}>{label}</span>
        </div>

        {/* Thermometer bar */}
        <div className="relative h-8 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${color} transition-all duration-700 rounded-full`}
            style={{ width: `${yesPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-white drop-shadow-md">
              {yesPercent}% say YES
            </span>
          </div>
        </div>

        {/* Ticks */}
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          <span>0% → NO</span>
          <span>50/50</span>
          <span>100% → YES</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <div className={`text-lg font-black ${textColor}`}>{yesPercent}%</div>
            <div className="text-[10px] text-muted-foreground">YES chance</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-foreground">{noPercent}%</div>
            <div className="text-[10px] text-muted-foreground">NO chance</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-foreground">{uniqueTraders.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">traders</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
