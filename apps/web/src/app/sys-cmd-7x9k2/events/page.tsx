'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Loader2,
    ChevronRight,
    MapPin,
    Tag,
    Sparkles,
    Wand2,
    CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { marketCreationService } from '@/lib/market-creation/service';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function EventsListPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // AI Suggestion State
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<any>(null);

    // New Event Form State
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        category: '',
        slug: '',
        start_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await marketCreationService.getEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to fetch events', error);
            toast({
                variant: "destructive",
                title: "ত্রুটি (Error)",
                description: "ইভেন্ট লোড করতে ব্যর্থ হয়েছে",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.category) {
            toast({
                variant: "destructive",
                title: "বৈধতা ত্রুটি (Validation Error)",
                description: "শিরোনাম এবং ক্যাটাগরি আবশ্যক",
            });
            return;
        }

        try {
            setIsCreating(true);
            const eventId = await marketCreationService.createEvent(newEvent);
            toast({
                title: "সফল (Success)",
                description: "ইভেন্ট সফলভাবে তৈরি হয়েছে",
            });
            setIsCreateDialogOpen(false);
            setNewEvent({
                title: '',
                description: '',
                category: '',
                slug: '',
                start_date: new Date().toISOString().split('T')[0]
            });
            fetchEvents();
        } catch (error) {
            console.error('Create event error:', error);
            toast({
                variant: "destructive",
                title: "ত্রুটি (Error)",
                description: "ইভেন্ট তৈরি করতে ব্যর্থ হয়েছে",
            });
        } finally {
            setIsCreating(false);
        }
    };

    // AI Suggestion handler
    const handleAiSuggest = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        setAiSuggestion(null);
        try {
            const res = await fetch('/api/admin/events/ai-suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setAiSuggestion(json.data);
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'AI ত্রুটি (AI Error)', description: err.message });
        } finally {
            setAiLoading(false);
        }
    };

    const handleApplyAiSuggestion = async () => {
        if (!aiSuggestion) return;
        setIsCreating(true);
        try {
            const eventId = await marketCreationService.createEvent({
                title: aiSuggestion.title,
                description: aiSuggestion.description,
                category: aiSuggestion.category,
                slug: aiSuggestion.slug,
                start_date: aiSuggestion.startDate,
                end_date: aiSuggestion.endDate,
            });
            toast({ title: 'ইভেন্ট তৈরি হয়েছে (Event Created)', description: `"${aiSuggestion.title}" AI সাজেশন দিয়ে তৈরি হয়েছে` });
            setIsAiDialogOpen(false);
            setAiSuggestion(null);
            setAiPrompt('');
            fetchEvents();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি (Error)', description: err.message });
        } finally {
            setIsCreating(false);
        }
    };

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">ইভেন্ট তালিকা (Events)</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        উচ্চ-পর্যায়ের ইভেন্ট এবং তাদের মার্কেটগুলো পরিচালনা করুন
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 border-violet-600 text-violet-400 hover:bg-violet-500/10"
                        onClick={() => setIsAiDialogOpen(true)}
                    >
                        <Sparkles className="w-4 h-4" />
                        AI সাজেস্ট
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-primary hover:bg-primary/90">
                                <Plus className="w-4 h-4" />
                                ইভেন্ট তৈরি করুন
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>নতুন ইভেন্ট তৈরি করুন</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    মার্কেটগুলোর জন্য একটি নতুন ইভেন্ট কন্টেইনার যোগ করুন।
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">শিরোনাম (Title)</Label>
                                    <Input
                                        id="title"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        placeholder="যেমন: বাংলাদেশ নির্বাচন ২০২৬"
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category">ক্যাটাগরি (Category)</Label>
                                    <Select
                                        onValueChange={(val) => setNewEvent({ ...newEvent, category: val })}
                                    >
                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                            <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Politics">রাজনীতি (Politics)</SelectItem>
                                            <SelectItem value="Sports">খেলাধুলা (Sports)</SelectItem>
                                            <SelectItem value="Crypto">ক্রিপ্টো (Crypto)</SelectItem>
                                            <SelectItem value="Entertainment">বিনোদন (Entertainment)</SelectItem>
                                            <SelectItem value="Economy">অর্থনীতি (Economy)</SelectItem>
                                            <SelectItem value="Technology">প্রযুক্তি (Technology)</SelectItem>
                                            <SelectItem value="Weather">আবহাওয়া (Weather)</SelectItem>
                                            <SelectItem value="Science">বিজ্ঞান (Science)</SelectItem>
                                            <SelectItem value="Other">অন্যান্য (Other)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">বিবরণ (Description)</Label>
                                    <Textarea
                                        id="description"
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        placeholder="ইভেন্টের সংক্ষিপ্ত বিবরণ..."
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">শুরুর তারিখ (Start Date)</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={newEvent.start_date}
                                        onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
                                    বাতিল করুন
                                </Button>
                                <Button onClick={handleCreateEvent} disabled={isCreating} className="bg-primary text-white">
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ইভেন্ট তৈরি করুন'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* AI Suggestion Dialog */}
            <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-violet-400" />
                            AI ইভেন্ট জেনারেটর
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            একটি বিষয় বর্ণনা করুন বা একটি শিরোনাম পেস্ট করুন। Gemini AI একটি সম্পূর্ণ ইভেন্ট এবং ট্রেডযোগ্য মার্কেট সাজেস্ট করবে।
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="flex gap-2">
                            <Input
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="যেমন: বাংলাদেশ বনাম ভারত ক্রিকেট বিশ্বকাপ ২০২৫, BTC মূল্য পূর্বাভাস..."
                                className="bg-slate-950 border-slate-800 flex-1"
                                onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
                            />
                            <Button
                                onClick={handleAiSuggest}
                                disabled={aiLoading || !aiPrompt.trim()}
                                className="bg-violet-600 hover:bg-violet-700 gap-2"
                            >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                জেনারেট
                            </Button>
                        </div>

                        {aiLoading && (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-400 mb-3" />
                                <p className="text-sm text-slate-400">Gemini AI চিন্তা করছে...</p>
                            </div>
                        )}

                        {aiSuggestion && !aiLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {/* Event Preview */}
                                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                                            {aiSuggestion.category}
                                        </Badge>
                                        <span className="text-xs text-slate-500">{aiSuggestion.slug}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{aiSuggestion.title}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{aiSuggestion.description}</p>
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {aiSuggestion.tags?.map((tag: string) => (
                                            <Badge key={tag} variant="outline" className="text-xs bg-slate-900 border-slate-700">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Markets Preview */}
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-1">
                                        <Tag className="w-3.5 h-3.5" /> প্রস্তাবিত মার্কেট ({aiSuggestion.markets?.length || 0})
                                    </h4>
                                    <div className="space-y-2">
                                        {aiSuggestion.markets?.map((market: any, i: number) => (
                                            <div key={i} className="p-3 rounded-md bg-slate-800/30 border border-slate-800">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                    <p className="text-sm font-medium text-white">{market.question}</p>
                                                </div>
                                                <div className="ml-5 space-y-1">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {market.outcomes?.map((o: any) => (
                                                            <Badge key={o.id} variant="outline" className="text-xs">{o.label}</Badge>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-slate-500">উৎস (Source): {market.resolutionSource}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {aiSuggestion && !aiLoading && (
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setAiSuggestion(null); }} className="border-slate-700">
                                পুনরায় জেনারেট করুন
                            </Button>
                            <Button
                                onClick={handleApplyAiSuggestion}
                                disabled={isCreating}
                                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                এই ইভেন্ট তৈরি করুন
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="ইভেন্ট অনুসন্ধান করুন... (Search events)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-900 border-slate-800 text-white"
                    />
                </div>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white gap-2">
                    <Filter className="w-4 h-4" />
                    ফিল্টার
                </Button>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">কোনো ইভেন্ট পাওয়া যায়নি</p>
                    <p className="text-sm">শুরু করতে আপনার প্রথম ইভেন্ট তৈরি করুন</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group"
                        >
                            <Card className="bg-slate-900 border-slate-800 hover:border-primary/50 transition-all cursor-pointer h-full" onClick={() => router.push(`/sys-cmd-7x9k2/events/${event.id}`)}>
                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge variant="outline" className="bg-slate-950 border-slate-700 text-slate-400">
                                            {event.category}
                                        </Badge>
                                        <Badge className={cn(
                                            event.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-700 text-slate-400"
                                        )}>
                                            {event.is_active ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                                        </Badge>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                        {event.title}
                                    </h3>

                                    <p className="text-sm text-slate-400 mb-4 line-clamp-3 flex-1">
                                        {event.description || 'কোনো বিবরণ দেওয়া হয়নি।'}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(event.start_date).toLocaleDateString('bn-BD')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 text-primary">
                                                পরিচালনা <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
