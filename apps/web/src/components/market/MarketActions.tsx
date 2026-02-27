'use client';

import { useState, useEffect } from 'react';
import { Share2, Bookmark, BookmarkCheck, Bell, BellOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MarketActionsProps {
    marketId: string;
    marketTitle: string;
    initialFollowerCount?: number;
}

export function MarketActions({ marketId, marketTitle, initialFollowerCount = 0 }: MarketActionsProps) {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [count, setCount] = useState(initialFollowerCount);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;

            const checkStatus = async () => {
                const [bRes, fRes] = await Promise.all([
                    supabase.from('user_bookmarks').select('id').eq('user_id', user.id).eq('market_id', marketId).maybeSingle(),
                    supabase.from('market_followers').select('id').eq('user_id', user.id).eq('market_id', marketId).maybeSingle(),
                ]);

                setIsBookmarked(!!bRes.data);
                setIsFollowing(!!fRes.data);
            };

            checkStatus();
        });
    }, [marketId]);

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: marketTitle, url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('লিংক কপি হয়েছে!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const toggleBookmark = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const res = await fetch(`/api/markets/${marketId}/bookmark`, { method: 'POST' });
            if (res.ok) {
                const { bookmarked } = await res.json();
                setIsBookmarked(bookmarked);
                toast.success(bookmarked ? '✅ বুকমার্ক হয়েছে' : 'বুকমার্ক সরানো হয়েছে');
            } else {
                toast.error('বুকমার্ক করতে সমস্যা হয়েছে');
            }
        } catch (err) {
            toast.error('সার্ভার ত্রুটি');
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleFollow = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const res = await fetch(`/api/markets/${marketId}/follow`, { method: 'POST' });
            if (res.ok) {
                const { following } = await res.json();
                setIsFollowing(following);
                setCount(c => following ? c + 1 : c - 1);
                toast.success(following ? '🔔 ফলো করা হচ্ছে' : 'আনফলো করা হয়েছে');
            } else {
                toast.error('ফলো করতে সমস্যা হয়েছে');
            }
        } catch (err) {
            toast.error('সার্ভার ত্রুটি');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-slate-400 hover:text-white h-9"
            >
                <Share2 className="w-4 h-4 mr-1.5" /> শেয়ার
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={toggleBookmark}
                className={isBookmarked ? 'text-yellow-400 h-9' : 'text-slate-400 h-9'}
                disabled={isProcessing}
            >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4 mr-1.5" /> : <Bookmark className="w-4 h-4 mr-1.5" />}
                {isBookmarked ? 'সেভড' : 'সেভ করুন'}
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={toggleFollow}
                className={isFollowing ? 'text-blue-400 border border-blue-400/30 h-9 bg-blue-400/5' : 'text-slate-400 h-9'}
                disabled={isProcessing}
            >
                {isFollowing ? <BellOff className="w-4 h-4 mr-1.5" /> : <Bell className="w-4 h-4 mr-1.5" />}
                <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" /> {count} ফলোয়ার
                </span>
            </Button>
        </div>
    );
}
