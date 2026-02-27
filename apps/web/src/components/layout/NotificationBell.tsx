'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function NotificationBell() {
    const [unread, setUnread] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchNotifications = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setNotifications(data);
            setUnread(data.length);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Set up real-time subscription for new notifications
        const supabase = createClient();
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload: any) => {
                        fetchNotifications();
                        toast.info('নতুন নোটিফিকেশন!', {
                            description: payload.new.title,
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupSubscription();
    }, []);

    const markAllRead = async () => {
        try {
            const res = await fetch('/api/notifications/mark-read', { method: 'POST' });
            if (res.ok) {
                setUnread(0);
                setNotifications([]);
                toast.success('সব নোটিফিকেশন পড়া হয়েছে');
            }
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <Bell className="w-5 h-5 text-slate-400" />
                    {unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold
              w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 w-80 p-0 shadow-2xl z-[100]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-white font-bold text-sm">নোটিফিকেশন</h3>
                    {unread > 0 && (
                        <button
                            className="text-blue-400 text-xs hover:text-blue-300 font-medium"
                            onClick={markAllRead}
                        >
                            সব পড়ুুন
                        </button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-2">
                            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                                <Bell className="w-5 h-5 text-slate-600" />
                            </div>
                            <p className="text-slate-500 text-sm">কোনো নতুন নোটিফিকেশন নেই</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className="p-4 hover:bg-slate-800 transition-colors group cursor-default">
                                <p className="text-white text-sm font-medium group-hover:text-primary transition-colors">{n.title}</p>
                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{n.body}</p>
                                <p className="text-[10px] text-slate-600 mt-2">
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
