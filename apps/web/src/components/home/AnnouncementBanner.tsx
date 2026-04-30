'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'maintenance';
    is_active: boolean;
    action_text?: string;
    action_url?: string;
    starts_at: string;
    ends_at?: string;
}

interface AnnouncementBannerProps {
    className?: string;
}

export default function AnnouncementBanner({ className = '' }: AnnouncementBannerProps) {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // Check if dismissed recently
        const dismissed = sessionStorage.getItem('announcement_dismissed');
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        async function fetchAnnouncement() {
            try {
                const res = await fetch('/api/admin/announcements?active=true');
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        setAnnouncement(data[0]); // Get the most recent active announcement
                    }
                }
            } catch (error) {
                console.error('[AnnouncementBanner] Failed to fetch:', error);
            }
        }

        fetchAnnouncement();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('announcements-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'site_announcements'
                },
                () => {
                    fetchAnnouncement();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('announcement_dismissed', announcement?.id || 'dismissed');
    };

    if (isDismissed || !announcement) return null;

    const getIcon = () => {
        switch (announcement.type) {
            case 'warning':
                return <AlertTriangle className="w-5 h-5" />;
            case 'success':
                return <CheckCircle className="w-5 h-5" />;
            case 'error':
                return <AlertCircle className="w-5 h-5" />;
            case 'maintenance':
                return <Wrench className="w-5 h-5" />;
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    const getStyles = () => {
        switch (announcement.type) {
            case 'warning':
                return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-800 dark:text-yellow-200';
            case 'success':
                return 'bg-green-500/10 border-green-500/50 text-green-800 dark:text-green-200';
            case 'error':
                return 'bg-red-500/10 border-red-500/50 text-red-800 dark:text-red-200';
            case 'maintenance':
                return 'bg-blue-500/10 border-blue-500/50 text-blue-800 dark:text-blue-200';
            default:
                return 'bg-slate-500/10 border-slate-500/50 text-slate-800 dark:text-slate-200';
        }
    };

    return (
        <div className={`${getStyles()} border-b ${className}`}>
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 ${announcement.type === 'warning' ? 'text-yellow-500' : announcement.type === 'success' ? 'text-green-500' : announcement.type === 'error' ? 'text-red-500' : announcement.type === 'maintenance' ? 'text-blue-500' : 'text-slate-500'}`}>
                            {getIcon()}
                        </div>
                        <div className="min-w-0 flex-1">
                            {announcement.title && (
                                <p className="font-semibold text-sm">{announcement.title}</p>
                            )}
                            <p className="text-sm opacity-90">{announcement.message}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {announcement.action_text && announcement.action_url && (
                            <a
                                href={announcement.action_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            >
                                {announcement.action_text}
                            </a>
                        )}
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
