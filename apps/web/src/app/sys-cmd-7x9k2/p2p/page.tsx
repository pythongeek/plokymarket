'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
    RefreshCw,
    ExternalLink,
    Trash2,
    Clock,
    Database,
    Smartphone,
    CreditCard,
    Terminal,
    Copy
} from 'lucide-react';
import { format } from 'date-fns';

interface CacheEntry {
    id: string;
    method: 'bkash' | 'nagad';
    sellers_data: any[];
    scraped_at: string;
    expires_at: string;
    affiliate_link: string;
}

export default function P2PManagementPage() {
    const [cache, setCache] = useState<CacheEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState<string | null>(null);
    const supabase = createClient();

    const fetchCache = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('p2p_seller_cache')
            .select('*')
            .order('scraped_at', { ascending: false });

        if (error) {
            toast({ title: 'Error', description: 'Failed to fetch P2P cache', variant: 'destructive' });
        } else {
            setCache(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCache();
    }, []);

    const triggerScrape = async (method: 'bkash' | 'nagad') => {
        setTriggering(method);
        try {
            const res = await fetch(`/api/p2p-sellers?method=${method}&amount=1000`);
            const data = await res.json();

            toast({
                title: 'Scraper Triggered',
                description: data.message || 'Scraping workflow started in n8n'
            });

            // Refresh after a delay to see the updated cache
            setTimeout(fetchCache, 15000);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to trigger scraper', variant: 'destructive' });
        } finally {
            setTriggering(null);
        }
    };

    const clearCache = async (id: string) => {
        const { error } = await supabase.from('p2p_seller_cache').delete().eq('id', id);
        if (error) {
            toast({ title: 'Error', description: 'Failed to delete cache entry', variant: 'destructive' });
        } else {
            setCache(cache.filter(c => c.id !== id));
            toast({ title: 'Success', description: 'Cache entry deleted' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">P2P Management</h1>
                    <p className="text-slate-400">Monitor and manage Binance P2P seller cache</p>
                </div>
                <Button onClick={fetchCache} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-primary/20 md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Docker Setup & Run Commands</CardTitle>
                        <Terminal className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">1. Initial Setup (Install Chromium)</p>
                            <div className="p-3 bg-black/40 rounded border border-slate-800 font-mono text-[10px] text-slate-300 relative group overflow-x-auto whitespace-nowrap">
                                <code>sudo apt-get update && sudo apt-get install -y chromium-browser</code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        navigator.clipboard.writeText('sudo apt-get update && sudo apt-get install -y chromium-browser');
                                        toast({ title: 'Copied', description: 'Setup command copied' });
                                    }}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">2. Run P2P Isolated Scraper</p>
                            <div className="p-3 bg-black/40 rounded border border-slate-800 font-mono text-[10px] text-slate-300 relative group overflow-x-auto whitespace-nowrap">
                                <code>docker compose -f docker-compose.p2p.yml up -d</code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        navigator.clipboard.writeText('docker compose -f docker-compose.p2p.yml up -d');
                                        toast({ title: 'Copied', description: 'Run command copied' });
                                    }}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">bKash Scraper</CardTitle>
                        <Smartphone className="w-4 h-4 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full bg-pink-600 hover:bg-pink-700"
                            onClick={() => triggerScrape('bkash')}
                            disabled={triggering === 'bkash'}
                        >
                            {triggering === 'bkash' ? <RefreshCw className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                            Run Now
                        </Button>
                        <p className="text-[10px] text-center text-slate-500 mt-2">Auto-refreshes every 3 min (via n8n-p2p)</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300">Nagad Scraper</CardTitle>
                        <CreditCard className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={() => triggerScrape('nagad')}
                            disabled={triggering === 'nagad'}
                        >
                            {triggering === 'nagad' ? <RefreshCw className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                            Run Now
                        </Button>
                        <p className="text-[10px] text-center text-slate-500 mt-2">Auto-refreshes every 3 min (via n8n-p2p)</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        Active Cache Entries
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {cache.length === 0 && !loading ? (
                            <div className="text-center py-8 text-slate-500">No cache entries found</div>
                        ) : (
                            cache.map((entry) => (
                                <div key={entry.id} className="p-4 rounded-lg bg-black/20 border border-slate-800 flex justify-between items-center group">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={entry.method === 'bkash' ? 'bg-pink-500/10 text-pink-500' : 'bg-orange-500/10 text-orange-500'}>
                                                {entry.method.toUpperCase()}
                                            </Badge>
                                            <span className="text-sm text-slate-300">
                                                {entry.sellers_data.length} sellers found
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Scraped: {format(new Date(entry.scraped_at), 'HH:mm:ss')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Expires: {format(new Date(entry.expires_at), 'HH:mm:ss')}
                                            </span>
                                            <span className="flex items-center gap-1 text-blue-400">
                                                <ExternalLink className="w-3 h-3" />
                                                Affiliate: {entry.affiliate_link.split('ref=')[1]}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => clearCache(entry.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
