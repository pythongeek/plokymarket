'use client';

// components/market/MarketActions.tsx
// Share · Bookmark · Follow strip — wired to Supabase social tables

import { useState, useEffect, useCallback } from 'react';
import {
  Share2, Bookmark, BookmarkCheck, Bell, BellOff,
  Users, Link2, Twitter, Check,
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Badge }    from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { toast }    from 'sonner';

interface MarketActionsProps {
  market: {
    id: string;
    question: string;
    yes_price?: number;
    image_url?: string;
  };
}

export function MarketActions({ market }: MarketActionsProps) {
  const [isBookmarked,   setIsBookmarked]   = useState(false);
  const [isFollowing,    setIsFollowing]    = useState(false);
  const [followerCount,  setFollowerCount]  = useState(0);
  const [copied,         setCopied]         = useState(false);
  const [userId,         setUserId]         = useState<string | null>(null);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // ── Load state ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    // Bookmark status
    supabase
      .from('user_bookmarks')
      .select('market_id')
      .eq('user_id', userId)
      .eq('market_id', market.id)
      .maybeSingle()
      .then(({ data }) => setIsBookmarked(!!data));

    // Follow status
    supabase
      .from('market_followers')
      .select('market_id')
      .eq('user_id', userId)
      .eq('market_id', market.id)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data));

    // Follower count
    supabase
      .from('market_followers')
      .select('market_id', { count: 'exact', head: true })
      .eq('market_id', market.id)
      .then(({ count }) => setFollowerCount(count ?? 0));
  }, [userId, market.id]);

  // ── Bookmark toggle ────────────────────────────────────────────────────────
  const toggleBookmark = useCallback(async () => {
    if (!userId) { toast.error('বুকমার্ক করতে লগইন করুন'); return; }

    try {
      // Use the server-side API route (respects RLS via server client)
      const res = await fetch(`/api/markets/${market.id}/bookmark`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setIsBookmarked(json.bookmarked);
      toast.success(json.bookmarked ? '🔖 বুকমার্ক করা হয়েছে' : 'বুকমার্ক সরানো হয়েছে');
    } catch {
      // Fallback: direct Supabase call
      if (isBookmarked) {
        await supabase.from('user_bookmarks').delete()
          .eq('user_id', userId).eq('market_id', market.id);
        setIsBookmarked(false);
        toast.success('বুকমার্ক সরানো হয়েছে');
      } else {
        await supabase.from('user_bookmarks').insert({ user_id: userId, market_id: market.id });
        setIsBookmarked(true);
        toast.success('🔖 বুকমার্ক করা হয়েছে');
      }
    }
  }, [userId, market.id, isBookmarked]);

  // ── Follow toggle ──────────────────────────────────────────────────────────
  const toggleFollow = useCallback(async () => {
    if (!userId) { toast.error('ফলো করতে লগইন করুন'); return; }

    if (isFollowing) {
      await supabase.from('market_followers').delete()
        .eq('user_id', userId).eq('market_id', market.id);
      setIsFollowing(false);
      setFollowerCount(c => Math.max(0, c - 1));
      toast.success('আনফলো করা হয়েছে');
    } else {
      await supabase.from('market_followers').insert({
        user_id: userId, market_id: market.id,
        notify_on_resolve: true, notify_on_trade: false,
      });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
      toast.success('🔔 ফলো করা হয়েছে — রেজোলিউশনে নোটিফাই পাবেন');
    }
  }, [userId, market.id, isFollowing]);

  // ── Share helpers ──────────────────────────────────────────────────────────
  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('🔗 লিঙ্ক কপি হয়েছে');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const shareToTwitter = useCallback(() => {
    const price = market.yes_price ? `${Math.round(market.yes_price * 100)}% YES` : '';
    const text  = encodeURIComponent(
      `${market.question}${price ? ` — ${price}` : ''} | Plokymarket`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }, [market]);

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: market.question, url: window.location.href }); }
      catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  }, [market.question, copyLink]);

  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">

      {/* ── Share dropdown ─────────────────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-primary/20">
            <Share2 className="h-3.5 w-3.5" />
            শেয়ার
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={copyLink} className="gap-2 text-sm cursor-pointer">
            {copied
              ? <Check className="h-4 w-4 text-emerald-500" />
              : <Link2 className="h-4 w-4" />}
            {copied ? 'কপি হয়েছে ✓' : 'লিঙ্ক কপি করুন'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToTwitter} className="gap-2 text-sm cursor-pointer">
            <Twitter className="h-4 w-4 text-[#1DA1F2]" />
            Twitter/X তে শেয়ার
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={nativeShare} className="gap-2 text-sm cursor-pointer">
            <Share2 className="h-4 w-4" />
            অন্যান্য অ্যাপে শেয়ার
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Bookmark ──────────────────────────────────────────────────────── */}
      <Button
        variant={isBookmarked ? 'default' : 'outline'}
        size="sm"
        className={`h-8 gap-1.5 text-xs ${
          isBookmarked
            ? 'bg-amber-500 hover:bg-amber-600 border-transparent text-white'
            : 'border-primary/20'
        }`}
        onClick={toggleBookmark}
      >
        {isBookmarked
          ? <BookmarkCheck className="h-3.5 w-3.5" />
          : <Bookmark      className="h-3.5 w-3.5" />}
        {isBookmarked ? 'সেভ হয়েছে' : 'সেভ করুন'}
      </Button>

      {/* ── Follow ────────────────────────────────────────────────────────── */}
      <Button
        variant={isFollowing ? 'default' : 'outline'}
        size="sm"
        className={`h-8 gap-1.5 text-xs ${
          isFollowing
            ? 'bg-primary hover:bg-primary/90 border-transparent text-white'
            : 'border-primary/20'
        }`}
        onClick={toggleFollow}
      >
        {isFollowing
          ? <BellOff className="h-3.5 w-3.5" />
          : <Bell    className="h-3.5 w-3.5" />}
        {isFollowing ? 'আনফলো' : 'ফলো করুন'}
        {followerCount > 0 && (
          <Badge variant="secondary" className="ml-0.5 text-[10px] h-4 px-1 py-0">
            {followerCount}
          </Badge>
        )}
      </Button>

    </div>
  );
}
