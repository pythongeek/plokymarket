'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    Save,
    Plus,
    MoreHorizontal,
    Trash2,
    PenLine,
    ExternalLink,
    Loader2,
    Search,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { marketCreationService, type MarketDraft } from '@/lib/market-creation/service';
import { MarketCreationWizard } from '@/components/admin/MarketCreationWizard';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function EventDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const eventId = params.id as string;

    const [event, setEvent] = useState<any>(null);
    const [markets, setMarkets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showMarketWizard, setShowMarketWizard] = useState(false);

    // Edit Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        slug: '',
        category: '',
        is_active: false,
        image_url: ''
    });

    useEffect(() => {
        if (eventId) fetchEventDetails();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const data = await marketCreationService.getEvent(eventId);
            setEvent(data);
            setFormData({
                title: data.question || data.title || '',
                description: data.description || '',
                slug: data.slug,
                category: data.category,
                is_active: data.status === 'active',
                image_url: data.image_url || ''
            });
            // If markets are returned nested
            if (data.markets) setMarkets(data.markets);
        } catch (error) {
            console.error('Error fetching event details:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load event details",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await marketCreationService.updateEvent(eventId, formData);
            toast({
                title: "Success",
                description: "Event updated successfully",
            });
            fetchEventDetails(); // Refresh
        } catch (error) {
            console.error('Error updating event:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update event",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event? Warning: This might affect associated markets.')) return;

        try {
            const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({
                    title: "Deleted",
                    description: "Event deleted successfully",
                });
                router.push('/sys-cmd-7x9k2/events');
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to delete event",
                });
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Error deleting event",
            });
        }
    };

    const handleMarketWizardComplete = () => {
        setShowMarketWizard(false);
        toast({
            title: "Success",
            description: "Market created successfully in this event",
        });
        fetchEventDetails(); // Reload to see new market
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-20 text-slate-500">
                <p>Event not found</p>
                <Button variant="link" onClick={() => router.push('/sys-cmd-7x9k2/events')}>
                    Return to List
                </Button>
            </div>
        );
    }

    // If Showing Wizard
    if (showMarketWizard) {
        return (
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMarketWizard(false)}
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Event: {event.title}
                </Button>
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4">Add Market to: <span className="text-primary">{event.title}</span></h2>
                    <MarketCreationWizard
                        eventId={eventId}
                        onCancel={() => setShowMarketWizard(false)}
                        onComplete={handleMarketWizardComplete}
                    // We will add logic in the Wizard to handle this 'eventId' context
                    // The Wizard component needs to accept eventId as a prop, as planned
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/sys-cmd-7x9k2/events')}>
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white">{event.question || event.title || 'Untitled'}</h1>
                            <Badge variant="outline" className="text-slate-400 border-slate-700 font-mono text-xs">
                                {event.slug}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">{event.category}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <Calendar className="w-3.5 h-3.5" /> {new Date(event.trading_closes_at || event.start_date || event.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/markets/${eventId}`, '_blank')}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-950/30 hover:text-blue-300"
                    >
                        <Globe className="w-4 h-4 mr-2" />
                        View on Frontend
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} className="bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-950/50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <Button onClick={() => setShowMarketWizard(true)} className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Add Market
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (Markets List) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white">Associated Markets</CardTitle>
                            <CardDescription>Markets belonging to this event</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {markets.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                                    <p>No markets created for this event yet.</p>
                                    <Button variant="link" onClick={() => setShowMarketWizard(true)}>
                                        Create one now
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {markets.map((market) => (
                                        <div key={market.id} className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 flex justify-between items-center group transition-all">
                                            <div>
                                                <h4 className="font-medium text-white group-hover:text-primary transition-colors">{market.question}</h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <span>ID: {market.id.slice(0, 8)}...</span>
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-700 text-slate-400">
                                                        {market.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar (Event Settings) */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">Event Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-slate-300">Event Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desc" className="text-slate-300">Description</Label>
                                <Textarea
                                    id="desc"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-slate-950 border-slate-800 min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-slate-300">Category</Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-slate-300">Slug (URL)</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="bg-slate-950 border-slate-800 font-mono text-sm text-slate-400"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Label htmlFor="active" className="text-slate-300">Active Status</Label>
                                <Switch
                                    id="active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                            </div>

                            <Button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
