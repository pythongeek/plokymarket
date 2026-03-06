"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { isAbortError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Link as LinkIcon,
    Plus,
    Calendar,
    Tag,
    AlertCircle,
    RefreshCw,
    Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Event {
    id: string;
    title: string;
    question: string;
    category: string;
    trading_closes_at: string;
    status: string;
}

interface EventLinkingPanelProps {
    onSelectEvent: (event: Event) => void;
}

export function EventLinkingPanel({ onSelectEvent }: EventLinkingPanelProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const supabase = createClient();

    const fetchUnlinkedEvents = async () => {
        setLoading(true);
        try {
            // Use a simpler approach - fetch all active events and filter out ones with markets
            // This avoids the FK relationship ambiguity issue
            const { data: fallbackData, error: fetchError } = await supabase
                .from("events")
                .select("id, title, question, category, trading_closes_at, status")
                .eq("status", "active")
                .order("trading_closes_at", { ascending: true });

            if (fetchError) {
                console.error("[EventLinkingPanel] Error fetching events:", fetchError.message);
                setEvents([]);
                return;
            }

            // Get all markets with event_id to find unlinked events
            const { data: marketsData } = await supabase
                .from("markets")
                .select("event_id");

            const linkedEventIds = new Set(
                (marketsData || [])
                    .map((m: any) => m.event_id)
                    .filter(Boolean)
            );

            // Filter to only unlinked events
            const unlinked = (fallbackData || []).filter((e: any) => !linkedEventIds.has(e.id));
            setEvents(unlinked);
        } catch (error: any) {
            // Handle AbortError gracefully - request was cancelled during navigation
            if (isAbortError(error)) {
                return;
            }
            console.error("[EventLinkingPanel] Error fetching unlinked events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnlinkedEvents();
    }, []);

    const filteredEvents = events.filter(e =>
        (e.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (e.question?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (e.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-slate-100">ইভেন্ট-মার্কেট লিঙ্কিং</h3>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {events.length}টি ইভেন্ট বাকি
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchUnlinkedEvents}
                    disabled={loading}
                    className="text-slate-400 hover:text-slate-200"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="p-3 border-b border-slate-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="ইভেন্ট খুঁজুন..."
                        className="pl-9 bg-slate-950/50 border-slate-800 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="h-[200px]">
                <div className="p-2 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                            <p className="text-xs">ইভেন্ট লোড হচ্ছে...</p>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                            <AlertCircle className="w-6 h-6 opacity-20" />
                            <p className="text-xs">কোনো লিঙ্কিংযোগ্য ইভেন্ট পাওয়া যায়নি</p>
                        </div>
                    ) : (
                        filteredEvents.map((event) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/30 border border-slate-800/50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                            >
                                <div className="flex-1 min-w-0 pr-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10">
                                            {event.category || 'Uncategorized'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {event.id ? event.id.split('-')[0] : 'N/A'}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-medium text-slate-200 truncate">
                                        {event.title || 'Untitled Event'}
                                    </h4>
                                    <p className="text-xs text-slate-400 truncate">{event.question || ''}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            {event.trading_closes_at ? new Date(event.trading_closes_at).toLocaleDateString('bn-BD') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 shrink-0"
                                    onClick={() => onSelectEvent(event)}
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    মার্কেট তৈরি করুন
                                </Button>
                            </motion.div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}
