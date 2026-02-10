'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, X, Settings, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  onSettingsClick?: () => void;
}

export function NotificationBell({ onSettingsClick }: NotificationBellProps) {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    dismiss,
    loadMore
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || n.category === filter
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trade': return '💰';
      case 'market': return '📊';
      case 'risk': return '⚠️';
      case 'social': return '👥';
      case 'system': return '⚙️';
      default: return '📌';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trade': return 'text-emerald-500';
      case 'market': return 'text-blue-500';
      case 'risk': return 'text-red-500';
      case 'social': return 'text-purple-500';
      case 'system': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now.getTime() - notifDate.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return t('common.justNow');
    if (minutes < 60) return t('common.minutesAgo', { count: minutes });
    if (hours < 24) return t('common.hoursAgo', { count: hours });
    return t('common.daysAgo', { count: days });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{t('notifications.title')}</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAsRead()}
                    className="p-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
                <button
                  onClick={onSettingsClick}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
              {['all', 'trade', 'market', 'risk', 'social', 'system'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors',
                    filter === cat
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  {t(`notifications.categories.${cat}`)}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 && !loading ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{t('notifications.noNotifications')}</p>
                </div>
              ) : (
                <>
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        'group p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                        !notification.is_read && 'bg-blue-50/50 dark:bg-blue-900/10'
                      )}
                    >
                      <div className="flex gap-3">
                        <span className="text-xl">
                          {getCategoryIcon(notification.category)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              'text-sm',
                              !notification.is_read && 'font-medium'
                            )}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead([notification.id])}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                title={t('notifications.markRead')}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => dismiss([notification.id])}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              title={t('notifications.dismiss')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Unread dot */}
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full py-3 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {loading ? t('common.loading') : t('notifications.loadMore')}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
