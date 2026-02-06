'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    X,
    CheckCircle2,
    AlertCircle,
    Trophy,
    Zap,
    TrendingUp,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata?: any;
}

const TYPE_CONFIG: Record<string, any> = {
    ORDER_FILLED: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    ORDER_CANCELLED: { icon: X, color: 'text-red-500', bg: 'bg-red-500/10' },
    MARKET_RESOLVED: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    PRICE_ALERT: { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ACHIEVEMENT_UNLOCKED: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    NEW_COMMENT: { icon: MessageSquare, color: 'text-slate-400', bg: 'bg-slate-400/10' },
};

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Demo notifications
    useEffect(() => {
        setNotifications([
            {
                id: '1',
                type: 'ORDER_FILLED',
                title: 'Order Filled!',
                message: 'Your buy order for "Will BTC hit $100k?" was fully filled at ৳45.00',
                isRead: false,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                type: 'ACHIEVEMENT_UNLOCKED',
                title: 'Achievement Unlocked: Sniper!',
                message: 'You achieved a 80%+ win rate over 10 trades. Rarity: RARE',
                isRead: false,
                createdAt: new Date(Date.now() - 3600000).toISOString()
            }
        ]);
    }, []);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-slate-800 rounded-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5 text-slate-400" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-slate-900 border-none">
                        {unreadCount}
                    </span>
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <div
                            className="fixed inset-0 z-40 lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-2 w-[380px] z-50 overflow-hidden"
                        >
                            <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl border-none">
                                <CardContent className="p-0">
                                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                                        <h3 className="font-bold">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <Bell className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                                                <p className="text-sm text-slate-500">No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => {
                                                const config = TYPE_CONFIG[n.type] || { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-400/10' };
                                                const Icon = config.icon;

                                                return (
                                                    <div
                                                        key={n.id}
                                                        className={cn(
                                                            "p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer relative",
                                                            !n.isRead && "bg-blue-500/[0.03]"
                                                        )}
                                                    >
                                                        {!n.isRead && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                                        )}
                                                        <div className="flex gap-4">
                                                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                                                                <Icon className={cn("h-5 w-5", config.color)} />
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-semibold text-slate-100">{n.title}</p>
                                                                    <span className="text-[10px] text-slate-500">
                                                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                                    {n.message}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="p-3 text-center border-t border-slate-800 bg-slate-900/50">
                                        <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400 hover:text-white">
                                            View All Activity
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
