'use client';

import { useState } from 'react';
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
  Cpu,
  SlidersHorizontal,
  AlertCircle,
  Check,
  Save,
  Loader2,
  ExternalLink,
  Edit,
  Trash2,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EventCreationPanel } from '@/components/admin/EventCreationPanel';

interface Event {
  id: string;
  name: string;
  question: string;
  category: string;
  status: string;
  created_at: string;
  trading_closes_at: string;
  resolution_delay_hours: number;
  initial_liquidity: number;
  is_featured: boolean;
  slug: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const supabase = createClient();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter for events (markets with event_id or created via events API)
      const eventMarkets = data || [];
      setEvents(eventMarkets);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = (eventId: string) => {
    setShowCreatePanel(false);
    fetchEvents();
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowCreatePanel(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
      case 'closed':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Closed</Badge>;
      case 'resolved':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Resolved</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-400" />
            ইভেন্ট ম্যানেজমেন্ট
          </h1>
          <p className="text-slate-400 mt-1">
            Manage prediction market events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/sys-cmd-7x9k2/markets')}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View Markets
          </Button>
          <Button
            onClick={() => setShowCreatePanel(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            নতুন ইভেন্ট তৈরি করুন
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Event Panel */}
        {showCreatePanel && (
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {selectedEvent ? 'ইভেন্ট এডিট করুন' : 'নতুন ইভেন্ট তৈরি করুন'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreatePanel(false);
                    setSelectedEvent(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <AlertCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EventCreationPanel onEventCreated={handleEventCreated} />
            </CardContent>
          </Card>
        )}

        {/* Events Grid */}
        <div className={cn(
          "space-y-4",
          showCreatePanel ? "lg:col-span-1" : "lg:col-span-2"
        )}>
          {events.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-400 mb-2">
                  কোনো ইভেন্ট খুঁজে পাওয়া যায়নি
                </h3>
                <p className="text-slate-500 mb-6">
                  শুরু করতে একটি নতুন ইভেন্ট তৈরি করুন
                </p>
                <Button
                  onClick={() => setShowCreatePanel(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  প্রথম ইভেন্ট তৈরি করুন
                </Button>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="bg-slate-900/50 border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{event.name || event.question}</h3>
                        {getStatusBadge(event.status)}
                        {event.is_featured && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 mb-4">{event.question}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FileText className="w-4 h-4" />
                          <span>{event.category}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>Close: {formatDateTime(event.trading_closes_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <DollarSign className="w-4 h-4" />
                          <span>Liquidity: ৳{event.initial_liquidity.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/market/${event.id}`)}
                        className="border-slate-700 text-slate-300 hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                        className="border-slate-700 text-slate-300 hover:text-white"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="border-red-700 text-red-400 hover:text-white hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
