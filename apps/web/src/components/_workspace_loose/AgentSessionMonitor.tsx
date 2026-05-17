'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye,
  Timer, Phone, UserCheck, Search, Filter, Image, ArrowRight
} from 'lucide-react';

interface Session {
  id: string;
  session_code: string;
  amount_bdt: number;
  amount_usdt: number;
  payment_method: string;
  agent_name: string;
  agent_phone: string;
  status: 'pending' | 'awaiting_payment' | 'payment_sent' | 'confirming' | 'completed' | 'expired' | 'cancelled' | 'rejected';
  created_at: string;
  expires_at: string;
  payment_sent_at: string | null;
  confirmed_at: string | null;
  transaction_id: string | null;
  screenshot_url: string | null;
  sender_phone: string | null;
  notes: string | null;
  confirmation_notes: string | null;
  rejection_reason: string | null;
  agent: { agent_name: string; trust_score: number; is_online: boolean; current_sessions: number } | null;
  user: { email: string; full_name: string } | null;
  minutes_elapsed: number;
}

type FilterStatus = 'all' | 'pending' | 'awaiting_payment' | 'payment_sent' | 'confirming' | 'completed' | 'expired' | 'cancelled';

const STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  awaiting_payment: 'পেমেন্টের অপেক্ষা',
  payment_sent: 'পেমেন্ট পাঠানো হয়েছে',
  confirming: 'নিশ্চিত হচ্ছে',
  completed: 'সম্পন্ন',
  expired: 'মেয়াদ শেষ',
  cancelled: 'বাতিল',
  rejected: 'বাতিল',
};

export default function AgentSessionMonitor() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [modalMode, setModalMode] = useState<'confirm' | 'reject' | 'view' | null>(null);
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['agentSessions', filterStatus],
    queryFn: async (): Promise<Session[]> => {
      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/admin/agent-sessions${statusParam}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      return result.data || [];
    },
    refetchInterval: 10000,
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/deposit/session`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_code: selectedSession?.session_code, status: 'completed', confirmation_notes: notes }),
      });
      if (!res.ok) throw new Error('Confirm failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agentSessions'] }); closeModal(); toast.success('নিশ্চিত করা হয়েছে'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeModal = () => { setSelectedSession(null); setModalMode(null); setConfirmNotes(''); setRejectReason(''); };

  const filtered = (sessions || []).filter(s =>
    searchQuery === '' ||
    s.session_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColor = (minutes: number, status: string) => {
    if (['completed', 'cancelled', 'expired', 'rejected'].includes(status)) return 'text-slate-400';
    if (minutes < 5) return 'text-emerald-400';
    if (minutes < 15) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBgColor = (minutes: number, status: string) => {
    if (['completed', 'cancelled', 'expired', 'rejected'].includes(status)) return 'bg-slate-800 border-slate-700';
    if (minutes < 5) return 'bg-emerald-500/5 border-emerald-500/20';
    if (minutes < 15) return 'bg-amber-500/5 border-amber-500/20';
    return 'bg-red-500/5 border-red-500/20';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const activeCount = (sessions || []).filter(s => ['pending', 'awaiting_payment', 'payment_sent', 'confirming'].includes(s.status)).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'সক্রিয় সেশন', value: activeCount, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'নিশ্চিত হচ্ছে', value: filtered.filter(s => s.status === 'confirming').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'অপেক্ষমাণ', value: filtered.filter(s => s.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'মেয়াদ শেষ/বাতিল', value: filtered.filter(s => ['expired', 'cancelled', 'rejected'].includes(s.status)).length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className={`text-sm font-medium ${stat.color}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'awaiting_payment', 'payment_sent', 'confirming', 'completed', 'expired'] as FilterStatus[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {STATUS_LABELS[s] || 'সব'}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="সার্চ করুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none text-sm" />
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-3">
        <AnimatePresence>
          {filtered.map(session => (
            <motion.div key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-4 rounded-xl border transition-all ${getBgColor(session.minutes_elapsed, session.status)}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm">#{session.session_code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      session.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      session.status === 'confirming' ? 'bg-blue-100 text-blue-700' :
                      session.status === 'payment_sent' ? 'bg-purple-100 text-purple-700' :
                      session.status === 'expired' || session.status === 'cancelled' || session.status === 'rejected' ? 'bg-gray-100 text-gray-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {STATUS_LABELS[session.status]}
                    </span>
                    {session.agent?.trust_score && (
                      <span className="text-xs text-slate-500">ট্রাস্ট {session.agent.trust_score}%</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="font-semibold">৳{session.amount_bdt} → {session.amount_usdt?.toFixed(2)} USDT</span>
                    <span className="text-slate-500">{session.payment_method?.toUpperCase()}</span>
                    <span className={`flex items-center gap-1 text-xs font-medium ${getColor(session.minutes_elapsed, session.status)}`}>
                      <Timer className="h-3 w-3" />
                      {session.minutes_elapsed}মিন
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> {session.agent_name || session.agent?.agent_name || 'অজাণা'}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {session.agent_phone}</span>
                    {session.user && <span>{session.user.email}</span>}
                  </div>

                  {session.transaction_id && (
                    <div className="mt-1 text-xs font-mono text-slate-400">TrxID: {session.transaction_id}</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setSelectedSession(session); setModalMode('view'); }}
                    className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-xs flex items-center gap-1">
                    <Eye className="h-3 w-3" /> দেখুন
                  </button>
                  {session.status === 'confirming' && (
                    <>
                      <button onClick={() => { setSelectedSession(session); setModalMode('confirm'); }}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> নিশ্চিত
                      </button>
                      <button onClick={() => { setSelectedSession(session); setModalMode('reject'); }}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> বাতিল
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">📭 কোনো সেশন পাওয়া যায়নি</div>
      )}

      {/* View Modal */}
      {selectedSession && modalMode === 'view' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">সেশন ডিটেলস</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2"><span className="text-slate-500">সেশন কোড</span><span className="font-mono font-bold">{selectedSession.session_code}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-slate-500">পরিমাণ</span><span>৳{selectedSession.amount_bdt} → {selectedSession.amount_usdt} USDT</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-slate-500">স্থিতি</span><span>{STATUS_LABELS[selectedSession.status]}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-slate-500">এজেন্ট</span><span>{selectedSession.agent_name} ({selectedSession.agent_phone})</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-slate-500">ইউজার</span><span>{selectedSession.user?.email || '-'}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-slate-500">TrxID</span><span className="font-mono">{selectedSession.transaction_id || '-'}</span></div>
              <div className="grid grid-cols-2 gap-2"><span className="text-slate-500">পাঠানকারী</span><span>{selectedSession.sender_phone || '-'}</span></div>
              {selectedSession.screenshot_url && (
                <div>
                  <span className="text-slate-500">স্ক্রিনশট:</span>
                  <a href={selectedSession.screenshot_url} target="_blank" rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline flex items-center gap-1 mt-1">
                    <Image className="h-3 w-3" /> দেখুন
                  </a>
                </div>
              )}
              {selectedSession.notes && <div className="p-2 bg-slate-50 rounded"><span className="text-slate-500">নোট:</span> {selectedSession.notes}</div>}
              {selectedSession.confirmation_notes && <div className="p-2 bg-emerald-50 rounded"><span className="text-slate-500">নিশ্চিত নোট:</span> {selectedSession.confirmation_notes}</div>}
              {selectedSession.rejection_reason && <div className="p-2 bg-red-50 rounded"><span className="text-slate-500">বাতিলের কারণ:</span> {selectedSession.rejection_reason}</div>}
            </div>
            <button onClick={closeModal} className="mt-4 w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">বন্ধ করুন</button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {selectedSession && modalMode === 'confirm' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-emerald-700">নিশ্চিত করুন</h3>
            <div className="bg-emerald-50 rounded p-3 mb-4 text-sm space-y-1">
              <p><strong>সেশন:</strong> {selectedSession.session_code}</p>
              <p><strong>পরিমাণ:</strong> {selectedSession.amount_usdt} USDT</p>
              <p><strong>ইউজার:</strong> {selectedSession.user?.email}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">নিশ্চিত নোট (অপশন)</label>
              <textarea value={confirmNotes} onChange={e => setConfirmNotes(e.target.value)} placeholder="নিশ্চিতের সময় কিছু লিখুন"
                className="w-full border rounded p-2" rows={3} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => confirmMutation.mutate({ id: selectedSession.id, notes: confirmNotes })}
                disabled={confirmMutation.isPending} className="flex-1 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 disabled:opacity-50">
                {confirmMutation.isPending ? '...' : 'কনফার্ম করুন'}
              </button>
              <button onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedSession && modalMode === 'reject' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">বাতিল করুন</h3>
            <div className="bg-red-50 rounded p-3 mb-4 text-sm">
              <p><strong>সেশন:</strong> {selectedSession.session_code}</p>
              <p className="text-red-600 mt-1">⚠️ ইউজারের ব্যালেনসে ৳{selectedSession.amount_bdt} ফেরত দেয়া হবে</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">বাতিলের কার্ণ *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="কারণ লিখুন" className="w-full border rounded p-2" rows={3} required />
            </div>
            <div className="flex gap-2">
              <button onClick={() => {/* reject API would go here */ toast.info('বাতিল ৷ এপিএাই নির্মাণ দরকার'); closeModal(); }}
                disabled={!rejectReason.trim()} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50">বাতিল করুন</button>
              <button onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">বাতিল</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
