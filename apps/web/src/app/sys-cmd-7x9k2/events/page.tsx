'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Calendar,
  FileText,
  Tag,
  DollarSign,
  Users,
  Eye,
  AlertCircle,
  Loader2,
  Shield,
  ExternalLink,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  Globe,
  Search,
  Filter,
  RefreshCw,
  Pause,
  Play,
  BarChart3,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  name?: string;
  question: string;
  description?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  image_url?: string;
  status: string;
  is_featured: boolean;
  is_trending: boolean;
  answer_type: string;
  answer1: string;
  answer2: string;
  starts_at: string;
  trading_closes_at: string;
  resolution_method: string;
  resolution_delay: number;
  resolver_reference?: string;
  initial_liquidity: number;
  total_volume: number;
  total_trades: number;
  unique_traders: number;
  current_yes_price: number;
  current_no_price: number;
  created_at: string;
  updated_at: string;
  slug: string;
}

const STATUS_CONFIG: Record<string, { label: string; labelBn: string; color: string; icon: any; bgClass: string }> = {
  draft: { label: 'Draft', labelBn: 'খসড়া', color: 'text-slate-400', icon: FileText, bgClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  pending: { label: 'Pending', labelBn: 'অপেক্ষমাণ', color: 'text-amber-400', icon: Clock, bgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  active: { label: 'Active', labelBn: 'সক্রিয়', color: 'text-emerald-400', icon: Activity, bgClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  paused: { label: 'Paused', labelBn: 'বিরতি', color: 'text-orange-400', icon: Pause, bgClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  closed: { label: 'Closed', labelBn: 'বন্ধ', color: 'text-blue-400', icon: XCircle, bgClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  resolved: { label: 'Resolved', labelBn: 'সমাধান', color: 'text-purple-400', icon: CheckCircle2, bgClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  cancelled: { label: 'Cancelled', labelBn: 'বাতিল', color: 'text-red-400', icon: XCircle, bgClass: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

const CATEGORIES = [
  { id: 'all', label: 'সব', icon: '📊' },
  { id: 'sports', label: 'খেলাধুলা', icon: '🏏' },
  { id: 'politics', label: 'রাজনীতি', icon: '🏛️' },
  { id: 'economy', label: 'অর্থনীতি', icon: '💰' },
  { id: 'entertainment', label: 'বিনোদন', icon: '🎬' },
  { id: 'technology', label: 'প্রযুক্তি', icon: '💻' },
  { id: 'international', label: 'আন্তর্জাতিক', icon: '🌍' },
  { id: 'weather', label: 'আবহাওয়া', icon: '🌦️' },
];

export default function EventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  const fetchEvents = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,question.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Stats
  const stats = {
    total: events.length,
    active: events.filter(e => e.status === 'active').length,
    pending: events.filter(e => e.status === 'pending' || e.status === 'draft').length,
    resolved: events.filter(e => e.status === 'resolved').length,
    totalVolume: events.reduce((sum, e) => sum + (e.total_volume || 0), 0),
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setDeleteConfirm(null);
      fetchEvents(true);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleToggleFeatured = async (eventId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_featured: !currentValue })
        .eq('id', eventId);

      if (error) throw error;
      fetchEvents(true);
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === 'paused') {
        updateData.paused_at = new Date().toISOString();
      }
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        // Note: For full resolution (outcome selection), use the Resolution Dashboard
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "স্ট্যাটাস পরিবর্তিত",
        description: `ইভেন্টটি এখন ${STATUS_CONFIG[newStatus]?.labelBn || newStatus}`,
      });

      fetchEvents(true);
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: error.message || "স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeLeft = (dateString: string) => {
    if (!dateString) return '—';
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff <= 0) return 'সময় শেষ';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}দিন ${hours}ঘণ্টা`;
    return `${hours}ঘণ্টা বাকি`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Calendar className="w-7 h-7 text-blue-400" />
            </div>
            ইভেন্ট ম্যানেজমেন্ট
          </h1>
          <p className="text-slate-400 mt-1">
            সকল প্রিডিকশন মার্কেট ইভেন্ট পরিচালনা করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-500"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
            রিফ্রেশ
          </Button>
          <Button
            onClick={() => router.push('/sys-cmd-7x9k2/events/create')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            নতুন ইভেন্ট
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'মোট ইভেন্ট', value: stats.total, icon: BarChart3, color: 'from-blue-500/10 to-blue-600/10', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
          { label: 'সক্রিয়', value: stats.active, icon: Activity, color: 'from-emerald-500/10 to-emerald-600/10', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
          { label: 'অপেক্ষমাণ', value: stats.pending, icon: Clock, color: 'from-amber-500/10 to-amber-600/10', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
          { label: 'সমাধান', value: stats.resolved, icon: CheckCircle2, color: 'from-purple-500/10 to-purple-600/10', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
          { label: 'মোট ভলিউম', value: `৳${stats.totalVolume.toLocaleString()}`, icon: DollarSign, color: 'from-cyan-500/10 to-cyan-600/10', border: 'border-cyan-500/20', iconColor: 'text-cyan-400' },
        ].map((stat) => (
          <Card key={stat.label} className={cn("bg-gradient-to-br border", stat.color, stat.border)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="ইভেন্ট খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <Button
              key={key}
              variant={statusFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              className={cn(
                "whitespace-nowrap",
                statusFilter === key
                  ? "bg-blue-600 text-white border-blue-500"
                  : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
              )}
            >
              <config.icon className="w-3.5 h-3.5 mr-1" />
              {config.labelBn}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={categoryFilter === cat.id || (cat.id === 'all' && !categoryFilter) ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCategoryFilter(cat.id === 'all' ? null : cat.id)}
            className={cn(
              "whitespace-nowrap",
              (categoryFilter === cat.id || (cat.id === 'all' && !categoryFilter))
                ? "bg-slate-700/50 text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="py-16 text-center">
                  <div className="p-4 rounded-full bg-slate-800/50 w-fit mx-auto mb-4">
                    <Calendar className="w-12 h-12 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">
                    কোনো ইভেন্ট খুঁজে পাওয়া যায়নি
                  </h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    {searchQuery || statusFilter || categoryFilter
                      ? 'আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন'
                      : 'শুরু করতে একটি নতুন ইভেন্ট তৈরি করুন'}
                  </p>
                  {!searchQuery && !statusFilter && !categoryFilter && (
                    <Button
                      onClick={() => router.push('/sys-cmd-7x9k2/events/create')}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      প্রথম ইভেন্ট তৈরি করুন
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            events.map((event, index) => {
              const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="bg-slate-900/60 border-slate-700/40 hover:border-slate-600/60 transition-all duration-200 group">
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          {/* Top Row: Title + Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate max-w-lg">
                              {event.title || event.question}
                            </h3>
                            <Badge className={cn("text-xs", statusConfig.bgClass)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.labelBn}
                            </Badge>
                            {event.is_featured && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                ফিচার্ড
                              </Badge>
                            )}
                            {event.is_trending && (
                              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                ট্রেন্ডিং
                              </Badge>
                            )}
                          </div>

                          {/* Question */}
                          {event.question && event.question !== event.title && (
                            <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                              {event.question}
                            </p>
                          )}

                          {/* Info Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Tag className="w-3.5 h-3.5 text-slate-500" />
                              <span>{event.category}</span>
                            </div>
                            {event.resolver_reference && (
                              <div className="flex items-center gap-1.5 text-blue-400/80">
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="text-xs truncate max-w-[100px]">{event.resolver_reference}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{formatTimeLeft(event.trading_closes_at)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                              <span>৳{(event.initial_liquidity || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Shield className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate max-w-[100px]">{event.resolution_method || 'অজানা'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              <span>{event.unique_traders || 0} traders</span>
                            </div>
                          </div>

                          {/* Tags */}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {event.tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="px-2 py-0.5 text-xs bg-slate-800/80 text-slate-400 rounded-full border border-slate-700/50">
                                  {tag}
                                </span>
                              ))}
                              {event.tags.length > 4 && (
                                <span className="px-2 py-0.5 text-xs text-slate-500">
                                  +{event.tags.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Date Footer */}
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <span>তৈরি: {formatDateTime(event.created_at)}</span>
                            {event.trading_closes_at && (
                              <span>শেষ: {formatDateTime(event.trading_closes_at)}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/markets/${event.id}`, '_blank')}
                            className="border-blue-700/50 text-blue-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500"
                          >
                            <Globe className="w-3.5 h-3.5 mr-1" />
                            দেখুন
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/sys-cmd-7x9k2/events/${event.id}`)}
                            className="border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-500"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            ডিটেইল
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleFeatured(event.id, event.is_featured)}
                            className={cn(
                              "border-slate-700/50",
                              event.is_featured
                                ? "text-yellow-400 hover:text-yellow-300 border-yellow-600/30"
                                : "text-slate-400 hover:text-white hover:border-slate-500"
                            )}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            {event.is_featured ? 'আনফিচার' : 'ফিচার'}
                          </Button>
                          {event.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(event.id, 'paused')}
                              className="border-orange-700/50 text-orange-400 hover:text-white hover:bg-orange-600/20"
                            >
                              <Pause className="w-3.5 h-3.5 mr-1" />
                              পজ
                            </Button>
                          )}
                          {event.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(event.id, 'active')}
                              className="border-emerald-700/50 text-emerald-400 hover:text-white hover:bg-emerald-600/20"
                            >
                              <Play className="w-3.5 h-3.5 mr-1" />
                              চালু
                            </Button>
                          )}
                          {deleteConfirm === event.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-xs"
                              >
                                নিশ্চিত
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                                className="border-slate-700 text-slate-400 text-xs"
                              >
                                বাতিল
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm(event.id)}
                              className="border-red-700/50 text-red-400 hover:text-white hover:bg-red-600/20"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              ডিলিট
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
