'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Search,
    TrendingUp,
    Clock,
    Flame,
    Star,
    Calendar,
    Users,
    Volume2,
    ChevronRight,
    Filter,
    Grid3X3,
    List,
    Sparkles,
    Zap,
    Trophy,
    ArrowRight,
    Tag,
    BarChart3,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { UnifiedEvent } from '@/types/unified';
import { toUnifiedEvents } from '@/types/unified';

interface FeaturedEvent {
    id: string;
    title: string;
    question: string;
    category: string;
    volume: number;
    ends_at: string;
    image_url?: string;
    trending: boolean;
}

interface CategoryStats {
    id: string;
    name: string;
    nameBn: string;
    icon: string;
    count: number;
    volume: number;
    color: string;
}

export default function EventMarketplacePage() {
    const { t, i18n } = useTranslation();
    const supabase = createClient();

    const [events, setEvents] = useState<UnifiedEvent[]>([]);
    const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([]);
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Fetch events data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch events from Supabase
                const { data: eventsData, error: eventsError } = await supabase
                    .from('events')
                    .select('*')
                    .order('total_volume', { ascending: false })
                    .limit(50);

                if (eventsError) throw eventsError;

                if (eventsData) {
                    const unifiedEvents = toUnifiedEvents(eventsData);
                    setEvents(unifiedEvents);

                    // Set featured events (top 3 by volume)
                    const featured = eventsData
                        .slice(0, 3)
                        .map(e => ({
                            id: e.id,
                            title: e.title || e.question,
                            question: e.question,
                            category: e.category || 'general',
                            volume: e.total_volume || 0,
                            ends_at: e.ends_at || e.resolves_at || new Date().toISOString(),
                            image_url: e.image_url || undefined,
                            trending: (e.total_volume || 0) > 5000,
                        }));
                    setFeaturedEvents(featured);
                }

                // Compute category stats
                if (eventsData) {
                    const catMap: Record<string, { count: number; volume: number }> = {};
                    eventsData.forEach(e => {
                        const cat = e.category || 'general';
                        if (!catMap[cat]) catMap[cat] = { count: 0, volume: 0 };
                        catMap[cat].count++;
                        catMap[cat].volume += e.total_volume || 0;
                    });

                    const categoryList: CategoryStats[] = [
                        { id: 'sports', name: 'Sports', nameBn: 'ক্রীড়া', icon: '🏆', count: 0, volume: 0, color: 'bg-green-500' },
                        { id: 'politics', name: 'Politics', nameBn: 'রাজনীতি', icon: '🏛️', count: 0, volume: 0, color: 'bg-blue-500' },
                        { id: 'crypto', name: 'Crypto', nameBn: 'ক্রিপ্টো', icon: '💰', count: 0, volume: 0, color: 'bg-orange-500' },
                        { id: 'economics', name: 'Economics', nameBn: 'অর্থনীতি', icon: '📊', count: 0, volume: 0, color: 'bg-purple-500' },
                        { id: 'technology', name: 'Technology', nameBn: 'প্রযুক্তি', icon: '💻', count: 0, volume: 0, color: 'bg-indigo-500' },
                        { id: 'entertainment', name: 'Entertainment', nameBn: 'বিনোদন', icon: '🎬', count: 0, volume: 0, color: 'bg-pink-500' },
                        { id: 'world', name: 'World Events', nameBn: 'বিশ্ব ঘটনা', icon: '🌍', count: 0, volume: 0, color: 'bg-red-500' },
                        { id: 'general', name: 'General', nameBn: 'সাধারণ', icon: '📌', count: 0, volume: 0, color: 'bg-gray-500' },
                    ];

                    categoryList.forEach(cat => {
                        if (catMap[cat.id]) {
                            cat.count = catMap[cat.id].count;
                            cat.volume = catMap[cat.id].volume;
                        }
                    });

                    setCategories(categoryList.filter(c => c.count > 0));
                }
            } catch (error) {
                console.error('Error fetching events:', error);
                // Use mock data for demo
                setEvents([]);
                setCategories([]);
                setFeaturedEvents([
                    {
                        id: '1',
                        title: 'Bitcoin Price Prediction',
                        question: 'Will Bitcoin reach $100,000 by end of 2024?',
                        category: 'crypto',
                        volume: 125000,
                        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        trending: true,
                    },
                    {
                        id: '2',
                        title: 'Bangladesh Cricket',
                        question: 'Will Bangladesh win the upcoming test series?',
                        category: 'sports',
                        volume: 85000,
                        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        trending: true,
                    },
                    {
                        id: '3',
                        title: 'Election Results',
                        question: 'Will the incumbent party win the next election?',
                        category: 'politics',
                        volume: 150000,
                        ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                        trending: false,
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter events based on search and category
    const filteredEvents = useMemo(() => {
        let result = [...events];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                e =>
                    e.title?.toLowerCase().includes(query) ||
                    e.question?.toLowerCase().includes(query) ||
                    e.category?.toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            result = result.filter(e => e.category === selectedCategory);
        }

        return result;
    }, [events, searchQuery, selectedCategory]);

    // Trending events (top 5 by volume)
    const trendingEvents = useMemo(() => {
        return [...events]
            .filter(e => e.status === 'active')
            .sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
            .slice(0, 5);
    }, [events]);

    // New events (most recently created)
    const newEvents = useMemo(() => {
        return [...events]
            .filter(e => e.status === 'active')
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 5);
    }, [events]);

    const formatVolume = (vol: number) => {
        if (vol >= 10000000) return `৳${(vol / 10000000).toFixed(1)}Cr`;
        if (vol >= 100000) return `৳${(vol / 100000).toFixed(1)}L`;
        if (vol >= 1000) return `৳${(vol / 1000).toFixed(1)}K`;
        return `৳${vol}`;
    };

    const getTimeRemaining = (date: string) => {
        const now = new Date();
        const target = new Date(date);
        const diff = target.getTime() - now.getTime();

        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            sports: '🏆',
            politics: '🏛️',
            crypto: '💰',
            economics: '📊',
            technology: '💻',
            entertainment: '🎬',
            world: '🌍',
            general: '📌',
        };
        return icons[category] || '📌';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Event Marketplace
                    </h1>
                    <p className="text-muted-foreground">Discover and trade on prediction markets</p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/events/create">
                        <Zap className="w-4 h-4" />
                        Create Event
                    </Link>
                </Button>
            </div>

            {/* Featured Events Banner */}
            {featuredEvents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featuredEvents.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link href={`/markets/${event.id}`}>
                                <Card className={`relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${index === 0 ? 'md:row-span-2' : ''}`}>
                                    {index === 0 && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <Badge className="bg-amber-500 gap-1">
                                                <Star className="w-3 h-3" />
                                                Featured
                                            </Badge>
                                        </div>
                                    )}
                                    {event.trending && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <Badge variant="outline" className="bg-red-500/90 text-white border-red-500 gap-1">
                                                <Flame className="w-3 h-3" />
                                                Trending
                                            </Badge>
                                        </div>
                                    )}
                                    <div className={`bg-gradient-to-br ${index === 0 ? 'h-48' : 'h-32'} from-primary/20 to-primary/5 flex items-center justify-center`}>
                                        <span className="text-6xl">{getCategoryIcon(event.category)}</span>
                                    </div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{event.question}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Volume2 className="w-4 h-4" />
                                                {formatVolume(event.volume)}
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="w-4 h-4" />
                                                {getTimeRemaining(event.ends_at)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Grid3X3 className="w-4 h-4" />
                            <span className="text-sm">Total Events</span>
                        </div>
                        <div className="text-2xl font-bold mt-1">{events.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Flame className="w-4 h-4" />
                            <span className="text-sm">Trending</span>
                        </div>
                        <div className="text-2xl font-bold mt-1">{trendingEvents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">Ending Soon</span>
                        </div>
                        <div className="text-2xl font-bold mt-1">
                            {events.filter(e => {
                                if (!e.ends_at) return false;
                                const diff = new Date(e.ends_at).getTime() - Date.now();
                                return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
                            }).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">Categories</span>
                        </div>
                        <div className="text-2xl font-bold mt-1">{categories.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Categories & Filters */}
                <div className="space-y-4">
                    {/* Categories */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                    }`}
                            >
                                <span>All Categories</span>
                                <Badge variant="secondary">{events.length}</Badge>
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{cat.icon}</span>
                                        <span>{i18n.language === 'bn' ? cat.nameBn : cat.name}</span>
                                    </div>
                                    <Badge variant="secondary">{cat.count}</Badge>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Trending Events */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-orange-500" />
                                Trending Now
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {trendingEvents.slice(0, 5).map((event, index) => (
                                <Link
                                    key={event.id}
                                    href={`/markets/${event.id}`}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-500 text-white' :
                                            index === 1 ? 'bg-gray-400 text-white' :
                                                index === 2 ? 'bg-amber-700 text-white' :
                                                    'bg-muted'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{event.title || event.question}</p>
                                        <p className="text-xs text-muted-foreground">{formatVolume(event.total_volume || 0)} volume</p>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/markets?status=active">
                                        <Grid3X3 className="w-4 h-4 mr-2" />
                                        Active Markets
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/markets?status=closing">
                                        <Clock className="w-4 h-4 mr-2" />
                                        Closing Soon
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/tournaments">
                                        <Trophy className="w-4 h-4 mr-2" />
                                        Tournaments
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href="/copy-trading">
                                        <Users className="w-4 h-4 mr-2" />
                                        Copy Trading
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Grid */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Search & View Toggle */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="all">
                        <TabsList>
                            <TabsTrigger value="all">All Events</TabsTrigger>
                            <TabsTrigger value="new">New</TabsTrigger>
                            <TabsTrigger value="popular">Popular</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-4">
                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">No events found</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredEvents.map(event => (
                                        <EventCard key={event.id} event={event} formatVolume={formatVolume} getTimeRemaining={getTimeRemaining} />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredEvents.map(event => (
                                        <EventListItem key={event.id} event={event} formatVolume={formatVolume} getTimeRemaining={getTimeRemaining} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="new" className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {newEvents.map(event => (
                                    <EventCard key={event.id} event={event} formatVolume={formatVolume} getTimeRemaining={getTimeRemaining} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="popular" className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {trendingEvents.map(event => (
                                    <EventCard key={event.id} event={event} formatVolume={formatVolume} getTimeRemaining={getTimeRemaining} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

// Event Card Component
function EventCard({
    event,
    formatVolume,
    getTimeRemaining,
}: {
    event: UnifiedEvent;
    formatVolume: (vol: number) => string;
    getTimeRemaining: (date: string) => string;
}) {
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            sports: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            politics: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            crypto: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            economics: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            technology: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
            entertainment: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
            world: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            general: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return colors[category] || colors.general;
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            sports: '🏆',
            politics: '🏛️',
            crypto: '💰',
            economics: '📊',
            technology: '💻',
            entertainment: '🎬',
            world: '🌍',
            general: '📌',
        };
        return icons[category] || '📌';
    };

    return (
        <Link href={`/markets/${event.id}`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <Badge className={getCategoryColor(event.category || 'general')}>
                            {getCategoryIcon(event.category || 'general')} {event.category || 'general'}
                        </Badge>
                        {(event.total_volume || 0) > 5000 && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                                <Flame className="w-3 h-3 mr-1" />
                                Trending
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title || event.question}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{event.question}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="text-xs text-muted-foreground">Volume</div>
                                <div className="font-semibold flex items-center gap-1">
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                    {formatVolume(event.total_volume || 0)}
                                </div>
                            </div>
                            {event.ends_at && (
                                <div>
                                    <div className="text-xs text-muted-foreground">Ends in</div>
                                    <div className="font-semibold flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        {getTimeRemaining(event.ends_at)}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                            View <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

// Event List Item Component
function EventListItem({
    event,
    formatVolume,
    getTimeRemaining,
}: {
    event: UnifiedEvent;
    formatVolume: (vol: number) => string;
    getTimeRemaining: (date: string) => string;
}) {
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            sports: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            politics: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            crypto: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            economics: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            technology: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
            entertainment: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
            world: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            general: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return colors[category] || colors.general;
    };

    return (
        <Link href={`/markets/${event.id}`}>
            <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge className={getCategoryColor(event.category || 'general')} variant="secondary">
                                    {event.category || 'general'}
                                </Badge>
                                {event.status === 'active' && (
                                    <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>
                                )}
                            </div>
                            <h4 className="font-medium truncate">{event.title || event.question}</h4>
                            <p className="text-sm text-muted-foreground truncate">{event.question}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground">Volume</div>
                                <div className="font-semibold">{formatVolume(event.total_volume || 0)}</div>
                            </div>
                            {event.ends_at && (
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Ends</div>
                                    <div className="font-semibold">{getTimeRemaining(event.ends_at)}</div>
                                </div>
                            )}
                            <Button variant="ghost" size="sm">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
