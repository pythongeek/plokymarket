'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Settings, Percent, TrendingUp, Shield } from 'lucide-react';

interface SiteSettings {
  global_trading_fee?: number;
  global_maker_rebate?: number;
  min_spread_for_reward?: number;
  [key: string]: string | number | boolean | undefined;
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/site-settings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSettings(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update');
      }
      setSettings((prev) => ({ ...prev, [key]: data.value }));
      toast({ title: 'Success', description: `${key} updated to ${data.value}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const settingCards = [
    {
      key: 'global_trading_fee',
      label: 'Global Trading Fee',
      description: 'Default fee applied to all trades (%)',
      icon: Percent,
      defaultValue: 2.0,
      min: 0,
      max: 100,
      step: 0.01,
    },
    {
      key: 'global_maker_rebate',
      label: 'Global Maker Rebate',
      description: 'Rebate percentage for liquidity providers (%)',
      icon: TrendingUp,
      defaultValue: 0.05,
      min: 0,
      max: 100,
      step: 0.001,
    },
    {
      key: 'min_spread_for_reward',
      label: 'Min Spread for Reward',
      description: 'Minimum spread % required to earn spread rewards',
      icon: Shield,
      defaultValue: 0.5,
      min: 0,
      max: 100,
      step: 0.01,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          Site Settings
        </h1>
        <p className="text-slate-400 mt-2">Manage platform-wide financial parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingCards.map((card) => {
          const currentValue = settings[card.key] ?? card.defaultValue;
          const Icon = card.icon;
          return (
            <Card key={card.key} className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Icon className="w-5 h-5 text-blue-500" />
                  {card.label}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Current Value</Label>
                  <Badge variant="outline" className="text-white border-slate-600">
                    {typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue}%
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={card.min}
                    max={card.max}
                    step={card.step}
                    defaultValue={currentValue}
                    className="bg-slate-950 border-slate-800 text-white"
                    onChange={(e) => {
                      // debounce not needed — admin presses Save
                    }}
                    id={`input-${card.key}`}
                  />
                  <Button
                    size="sm"
                    disabled={saving[card.key]}
                    onClick={() => {
                      const input = document.getElementById(`input-${card.key}`) as HTMLInputElement;
                      updateSetting(card.key, input.value);
                    }}
                  >
                    {saving[card.key] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
