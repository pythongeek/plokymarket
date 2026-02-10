'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  Smartphone,
  Globe,
  MessageSquare,
  Shield,
  Users,
  TrendingUp,
  Activity,
  Check,
  AlertTriangle,
  Moon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ===================================
// NOTIFICATION SETTINGS PAGE
// ===================================

interface ChannelToggleProps {
  channel: 'websocket' | 'push' | 'email' | 'webhook' | 'in_app';
  enabled: boolean;
  onToggle: () => void;
}

function ChannelToggle({ channel, enabled, onToggle }: ChannelToggleProps) {
  const { t } = useTranslation();
  
  const icons = {
    websocket: Globe,
    push: Smartphone,
    email: Mail,
    webhook: Activity,
    in_app: MessageSquare
  };
  
  const Icon = icons[channel];
  
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all',
        enabled
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
      )}
    >
      <Icon className={cn('w-4 h-4', enabled ? 'text-blue-500' : 'text-gray-400')} />
      <span className={cn('text-sm', enabled ? 'text-blue-700' : 'text-gray-600')}>
        {t(`notifications.channels.${channel}`)}
      </span>
      {enabled && <Check className="w-3 h-3 text-blue-500 ml-1" />}
    </button>
  );
}

interface NotificationSectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  channels: string[];
  onChannelToggle: (channel: string) => void;
  availableChannels: string[];
  children?: React.ReactNode;
}

function NotificationSection({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  channels,
  onChannelToggle,
  availableChannels,
  children
}: NotificationSectionProps) {
  return (
    <div className={cn(
      'p-6 rounded-xl border-2 transition-colors mb-4',
      enabled ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-60'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          <div className={cn(
            'p-3 rounded-xl',
            enabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'
          )}>
            <Icon className={cn(
              'w-6 h-6',
              enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">{t('notifications.deliveryChannels')}</p>
            <div className="flex flex-wrap gap-2">
              {availableChannels.map((channel) => (
                <ChannelToggle
                  key={channel}
                  channel={channel as any}
                  enabled={channels.includes(channel)}
                  onToggle={() => onChannelToggle(channel)}
                />
              ))}
            </div>
          </div>
          {children}
        </>
      )}
    </div>
  );
}

export default function NotificationSettingsPage() {
  const { t } = useTranslation();
  const { preferences, updatePreferences, requestPushPermission } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleUpdate = async (updates: any) => {
    setLocalPrefs((prev: any) => ({ ...prev, ...updates }));
    setSaving(true);
    await updatePreferences(updates);
    setSaving(false);
  };

  const toggleChannel = (category: string, channel: string) => {
    const key = `${category}_channels`;
    const current = localPrefs[key] || [];
    const updated = current.includes(channel)
      ? current.filter((c: string) => c !== channel)
      : [...current, channel];
    handleUpdate({ [key]: updated });
  };

  if (!localPrefs) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t('notifications.settingsTitle')}</h1>
        <p className="text-gray-500">{t('notifications.settingsDescription')}</p>
      </div>

      {/* Global Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold">{t('notifications.globalNotifications')}</h3>
              <p className="text-sm text-gray-500">{t('notifications.globalDescription')}</p>
            </div>
          </div>
          <Switch
            checked={localPrefs.notifications_enabled}
            onCheckedChange={(v) => handleUpdate({ notifications_enabled: v })}
          />
        </div>

        {localPrefs.notifications_enabled && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Moon className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">{t('notifications.doNotDisturb')}</p>
                  <p className="text-sm text-gray-500">{t('notifications.doNotDisturbDesc')}</p>
                </div>
              </div>
              <Switch
                checked={localPrefs.do_not_disturb}
                onCheckedChange={(v) => handleUpdate({ do_not_disturb: v })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Order Fills */}
      <NotificationSection
        icon={TrendingUp}
        title={t('notifications.orderFillsTitle')}
        description={t('notifications.orderFillsDescription')}
        enabled={localPrefs.order_fills_enabled}
        onToggle={() => handleUpdate({ order_fills_enabled: !localPrefs.order_fills_enabled })}
        channels={localPrefs.order_fills_channels || []}
        onChannelToggle={(c) => toggleChannel('order_fills', c)}
        availableChannels={['websocket', 'push', 'email', 'in_app']}
      >
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium mb-2">{t('notifications.minAmount')}</p>
          <div className="flex items-center gap-4">
            <Slider
              value={[localPrefs.order_fills_min_amount || 1000]}
              onValueChange={([v]) => handleUpdate({ order_fills_min_amount: v })}
              min={100}
              max={10000}
              step={100}
              className="flex-1"
            />
            <span className="text-sm font-medium w-20 text-right">
              ৳{(localPrefs.order_fills_min_amount || 1000).toLocaleString()}
            </span>
          </div>
        </div>
      </NotificationSection>

      {/* Market Resolution */}
      <NotificationSection
        icon={Activity}
        title={t('notifications.marketResolutionTitle')}
        description={t('notifications.marketResolutionDescription')}
        enabled={localPrefs.market_resolution_enabled}
        onToggle={() => handleUpdate({ market_resolution_enabled: !localPrefs.market_resolution_enabled })}
        channels={localPrefs.market_resolution_channels || []}
        onChannelToggle={(c) => toggleChannel('market_resolution', c)}
        availableChannels={['websocket', 'push', 'email', 'in_app']}
      />

      {/* Price Alerts */}
      <NotificationSection
        icon={TrendingUp}
        title={t('notifications.priceAlertsTitle')}
        description={t('notifications.priceAlertsDescription')}
        enabled={localPrefs.price_alerts_enabled}
        onToggle={() => handleUpdate({ price_alerts_enabled: !localPrefs.price_alerts_enabled })}
        channels={localPrefs.price_alerts_channels || []}
        onChannelToggle={(c) => toggleChannel('price_alerts', c)}
        availableChannels={['push', 'email', 'in_app']}
      >
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium mb-2">{t('notifications.thresholdLabel')}</p>
          <div className="flex items-center gap-4">
            <Slider
              value={[localPrefs.price_alerts_threshold || 5]}
              onValueChange={([v]) => handleUpdate({ price_alerts_threshold: v })}
              min={1}
              max={20}
              step={0.5}
              className="flex-1"
            />
            <span className="text-sm font-medium w-20 text-right">
              {localPrefs.price_alerts_threshold || 5}%
            </span>
          </div>
        </div>
      </NotificationSection>

      {/* Position Risk */}
      <NotificationSection
        icon={Shield}
        title={t('notifications.positionRiskTitle')}
        description={t('notifications.positionRiskDescription')}
        enabled={localPrefs.position_risk_enabled}
        onToggle={() => handleUpdate({ position_risk_enabled: !localPrefs.position_risk_enabled })}
        channels={localPrefs.position_risk_channels || []}
        onChannelToggle={(c) => toggleChannel('position_risk', c)}
        availableChannels={['websocket', 'push', 'in_app']}
      />

      {/* Social Notifications */}
      <NotificationSection
        icon={Users}
        title={t('notifications.socialTitle')}
        description={t('notifications.socialDescription')}
        enabled={localPrefs.social_notifications_enabled}
        onToggle={() => handleUpdate({ social_notifications_enabled: !localPrefs.social_notifications_enabled })}
        channels={localPrefs.social_channels || []}
        onChannelToggle={(c) => toggleChannel('social', c)}
        availableChannels={['push', 'email', 'in_app']}
      >
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium mb-2">{t('notifications.digestFrequency')}</p>
          <div className="flex gap-2">
            {['immediate', 'hourly', 'daily'].map((freq) => (
              <button
                key={freq}
                onClick={() => handleUpdate({ social_digest_frequency: freq })}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm transition-colors',
                  localPrefs.social_digest_frequency === freq
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                {t(`notifications.digest.${freq}`)}
              </button>
            ))}
          </div>
        </div>
      </NotificationSection>

      {/* System Maintenance */}
      <NotificationSection
        icon={AlertTriangle}
        title={t('notifications.systemTitle')}
        description={t('notifications.systemDescription')}
        enabled={localPrefs.system_maintenance_enabled}
        onToggle={() => handleUpdate({ system_maintenance_enabled: !localPrefs.system_maintenance_enabled })}
        channels={localPrefs.system_maintenance_channels || []}
        onChannelToggle={(c) => toggleChannel('system_maintenance', c)}
        availableChannels={['email', 'in_app']}
      />

      {/* Push Notifications CTA */}
      <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <Smartphone className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">{t('notifications.pushNotifications')}</h3>
              <p className="text-sm text-gray-500">{t('notifications.pushDescription')}</p>
            </div>
          </div>
          <Button
            onClick={requestPushPermission}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            {t('notifications.enablePush')}
          </Button>
        </div>
      </div>

      {saving && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {t('notifications.saved')}
        </motion.div>
      )}
    </div>
  );
}
