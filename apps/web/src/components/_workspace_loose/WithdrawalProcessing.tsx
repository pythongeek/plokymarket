'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, CheckSquare, Square, Smartphone, Diamond, Landmark, Copy, CheckCircle } from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  usdt_amount: number;
  bdt_amount: number;
  withdrawal_method: 'mfs' | 'crypto' | 'bank';
  crypto_network?: string;
  wallet_address?: string;
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  mfs_provider?: string;
  recipient_number?: string;
  recipient_name?: string | null;
  withdrawal_fee_usdt?: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  user_email?: string;
  user_full_name?: string;
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'completed' | 'rejected';

export default function WithdrawalProcessing() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [transferProofUrl, setTransferProofUrl] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [modalMode, setModalMode] = useState<'process' | 'complete' | 'reject' | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['adminWithdrawals', filterStatus],
    queryFn: async (): Promise<WithdrawalRequest[]> => {
      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(`/api/admin/withdrawals${statusParam}`);
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      const result = await response.json();
      return (result.data || []).map((item: any) => ({
        ...item,
        user_email: item.email,
        user_full_name: item.full_name
      })) as WithdrawalRequest[];
    },
    refetchInterval: 10000,
  });

  const processMutation = useMutation({
    mutationFn: async ({ withdrawalId, notes }: { withdrawalId: string; notes: string }) => {
      const response = await fetch('/api/admin/withdrawals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, notes }),
      });
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed'); }
      return response.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] }); closeModal(); toast.success('প্রসেসিং শুরু হয়েছে!'); },
    onError: (e: Error) => toast.error(`ত্রুটি: ${e.message}`),
  });

  const completeMutation = useMutation({
    mutationFn: async ({ withdrawalId, notes, proofUrl }: { withdrawalId: string; notes: string; proofUrl: string }) => {
      const response = await fetch('/api/admin/withdrawals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, notes, proofUrl }),
      });
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed'); }
      return response.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] }); closeModal(); toast.success('উইথড্রয়াল সম্পন্ন!'); },
    onError: (e: Error) => toast.error(`ত্রুটি: ${e.message}`),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ withdrawalId, reason }: { withdrawalId: string; reason: string }) => {
      const response = await fetch('/api/admin/withdrawals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, reason }),
      });
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed'); }
      return response.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] }); closeModal(); toast.success('বাতিল করা হয়েছে'); },
    onError: (e: Error) => toast.error(`ত্রুটি: ${e.message}`),
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/admin/withdrawals/bulk-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, reason: 'Bulk rejection by admin' }),
      });
      if (!response.ok) throw new Error('Bulk reject failed');
      return response.json();
    },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] }); setSelectedIds(new Set()); toast.success(`${data.count || 0} টি বাতিল করা হয়েছে`); },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeModal = () => {
    setSelectedWithdrawal(null); setModalMode(null); setAdminNotes(''); setTransferProofUrl(''); setRejectionReason('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('কপি হয়েছে');
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (!withdrawals) return;
    const visibleIds = withdrawals.filter(w => w.status === 'pending').map(w => w.id);
    if (selectedIds.size === visibleIds.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(visibleIds));
  };

  const exportCSV = () => {
    if (!withdrawals?.length) return;
    const headers = ['ID','User','Method','Network','Amount USDT','Amount BDT','Fee','Status','Details','Created'];
    const rows = withdrawals.map(w => {
      let details = '';
      if (w.withdrawal_method === 'mfs') details = `${w.mfs_provider} | ${w.recipient_number}`;
      else if (w.withdrawal_method === 'crypto') details = `${w.crypto_network} | ${w.wallet_address}`;
      else if (w.withdrawal_method === 'bank') details = `${w.bank_name} | ${w.account_number} | ${w.account_holder_name}`;
      return [w.id, w.user_email || '', w.withdrawal_method, w.crypto_network || '', w.usdt_amount, w.bdt_amount, w.withdrawal_fee_usdt || 0, w.status, details, w.created_at];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdrawals_${filterStatus}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV ডাুনলোড সাফল');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: 'অপেক্ষমাণ',
      processing: 'প্রসেসিং',
      completed: 'সম্পন্ন',
      rejected: 'বাতিল',
      cancelled: 'কান্সেল',
    };
    return <span className={`px-2 py-1 rounded text-sm font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  const getMethodIcon = (w: WithdrawalRequest) => {
    if (w.withdrawal_method === 'mfs') return <Smartphone className="h-4 w-4 text-pink-400" />;
    if (w.withdrawal_method === 'crypto') return <Diamond className="h-4 w-4 text-emerald-400" />;
    return <Landmark className="h-4 w-4 text-blue-400" />;
  };

  const getMethodLabel = (w: WithdrawalRequest) => {
    if (w.withdrawal_method === 'mfs') return w.mfs_provider?.toUpperCase() || 'MFS';
    if (w.withdrawal_method === 'crypto') return w.crypto_network?.toUpperCase() || 'CRYPTO';
    return 'ব্যাঙ্ক';
  };

  const renderDetails = (w: WithdrawalRequest) => {
    if (w.withdrawal_method === 'mfs') {
      return (
        <div className="space-y-1">
          <p className="text-sm">প্রোভাইডার: <span className="font-medium">{w.mfs_provider?.toUpperCase()}</span></p>
          <p className="text-sm">নম্বর: <span className="font-mono">{w.recipient_number}</span></p>
          {w.recipient_name && <p className="text-sm">নাম: {w.recipient_name}</p>}
        </div>
      );
    }
    if (w.withdrawal_method === 'crypto') {
      return (
        <div className="space-y-1">
          <p className="text-sm">নেটওয়ার্ক: <span className="font-medium">{w.crypto_network?.toUpperCase()}</span></p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono truncate max-w-[200px]">{w.wallet_address}</p>
            <button onClick={() => copyToClipboard(w.wallet_address || '', w.id)} className="p-1 hover:bg-slate-100 rounded">
              {copiedId === w.id ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-slate-400" />}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <p className="text-sm">ব্যাংক: <span className="font-medium">{w.bank_name}</span></p>
        <p className="text-sm">অ্যাকাউন্ট: <span className="font-mono">{w.account_number}</span></p>
        <p className="text-sm">ধারক: {w.account_holder_name}</p>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  const pendingCount = withdrawals?.filter(w => w.status === 'pending').length || 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">উইথড্রয়াল ম্যানেজমেন্ট</h2>
          <p className="text-sm text-slate-500">অপেক্ষমাণ: {pendingCount} টি</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'processing', 'completed', 'rejected'] as FilterStatus[]).map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {status === 'all' && 'সব'}
              {status === 'pending' && 'অপেক্ষমাণ'}
              {status === 'processing' && 'প্রসেসিং'}
              {status === 'completed' && 'সম্পন্ন'}
              {status === 'rejected' && 'বাতিল'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {filterStatus === 'pending' && selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-amber-800">{selectedIds.size} টি সিলেক্ট করা হয়েছে</span>
          <div className="flex gap-2">
            <button onClick={() => { /* bulk process would need API */ toast.info('Bulk process coming soon'); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              বাল্ক প্রসেস
            </button>
            <button onClick={() => bulkRejectMutation.mutate(Array.from(selectedIds))} disabled={bulkRejectMutation.isPending}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50">
              {bulkRejectMutation.isPending ? '...' : 'বাল্ক বাতিল'}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm">
          <Download className="h-4 w-4" /> CSV ডাুনলোড
        </button>
      </div>

      {withdrawals && withdrawals.length === 0 && (
        <div className="text-center py-12 text-gray-500">📭 কোনো উইথড্রয়াল রিকোয়েস্ট নেই</div>
      )}

      <div className="grid gap-4">
        {withdrawals?.map((w) => (
          <div key={w.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {filterStatus === 'pending' && (
                    <button onClick={() => toggleSelect(w.id)} className="text-slate-400 hover:text-blue-600">
                      {selectedIds.has(w.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                    {getMethodIcon(w)}
                    {getMethodLabel(w)}
                  </div>
                  <p className="text-lg font-semibold">{w.usdt_amount} USDT → ৳{w.bdt_amount?.toLocaleString('bn-BD')}</p>
                  {w.withdrawal_fee_usdt && w.withdrawal_fee_usdt > 0 && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">ফি: {w.withdrawal_fee_usdt} USDT</span>
                  )}
                  {getStatusBadge(w.status)}
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  {w.user_full_name || w.user_email}
                </p>

                <div className="bg-slate-50 rounded p-2 mb-2">
                  {renderDetails(w)}
                </div>

                {w.admin_notes && <p className="text-sm text-gray-500 mt-1">📝 {w.admin_notes}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(w.created_at).toLocaleString('bn-BD')}
                  {w.processed_at && <span className="ml-2">(প্রসেস: {new Date(w.processed_at).toLocaleString('bn-BD')})</span>}
                </p>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {w.status === 'pending' && (
                  <>
                    <button onClick={() => { setSelectedWithdrawal(w); setModalMode('process'); }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">প্রসেস শুরু করুন</button>
                    <button onClick={() => { setSelectedWithdrawal(w); setModalMode('reject'); }}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm">বাতিল করুন</button>
                  </>
                )}
                {w.status === 'processing' && (
                  <>
                    <button onClick={() => { setSelectedWithdrawal(w); setModalMode('complete'); }}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">সম্পন্ন করুন</button>
                    <button onClick={() => { setSelectedWithdrawal(w); setModalMode('reject'); }}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm">বাতিল করুন</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Process Modal */}
      {selectedWithdrawal && modalMode === 'process' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">প্রসেসিং শুরু করুন</h3>
            <div className="bg-gray-50 rounded p-3 mb-4 text-sm space-y-1">
              <p><strong>দুকান:</strong> {getMethodLabel(selectedWithdrawal)}</p>
              <p><strong>পরিমাণ:</strong> {selectedWithdrawal.usdt_amount} USDT → ৳{selectedWithdrawal.bdt_amount}</p>
              {selectedWithdrawal.withdrawal_method === 'mfs' && <p><strong>নম্বর:</strong> {selectedWithdrawal.recipient_number}</p>}
              {selectedWithdrawal.withdrawal_method === 'crypto' && (
                <div className="flex items-center gap-2">
                  <strong>ঠিকানা:</strong>
                  <span className="font-mono truncate max-w-[180px]">{selectedWithdrawal.wallet_address}</span>
                  <button onClick={() => copyToClipboard(selectedWithdrawal.wallet_address || '', 'modal')} className="p-1 hover:bg-gray-200 rounded">
                    {copiedId === 'modal' ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
              {selectedWithdrawal.withdrawal_method === 'bank' && (
                <>
                  <p><strong>ব্যাংক:</strong> {selectedWithdrawal.bank_name}</p>
                  <p><strong>অ্যাকাউন্ট:</strong> {selectedWithdrawal.account_number}</p>
                </>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">এডমিন নোট</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="যেমন: bKash টাকা পাঠানো হবে" className="w-full border rounded p-2" rows={3} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => processMutation.mutate({ withdrawalId: selectedWithdrawal.id, notes: adminNotes })}
                disabled={processMutation.isPending} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                {processMutation.isPending ? '...' : 'কনফার্ম'}
              </button>
              <button onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {selectedWithdrawal && modalMode === 'complete' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-green-700">সম্পন্ন করুন</h3>
            <div className="bg-green-50 rounded p-3 mb-4 text-sm space-y-1">
              <p><strong>দুকান:</strong> {getMethodLabel(selectedWithdrawal)}</p>
              <p><strong>পরিমাণ:</strong> {selectedWithdrawal.usdt_amount} USDT</p>
              {selectedWithdrawal.withdrawal_method === 'mfs' && <p><strong>নম্বর:</strong> {selectedWithdrawal.recipient_number}</p>}
              {selectedWithdrawal.withdrawal_method === 'crypto' && <p><strong>ঠিকানা:</strong> {selectedWithdrawal.wallet_address}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">এডমিন নোট</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="ট্রানজাকশ঩ হেশ ID" className="w-full border rounded p-2" rows={2} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">প্রূফ URL (অপশন)</label>
              <input type="text" value={transferProofUrl} onChange={(e) => setTransferProofUrl(e.target.value)} placeholder="https://..." className="w-full border rounded p-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => completeMutation.mutate({ withdrawalId: selectedWithdrawal.id, notes: adminNotes, proofUrl: transferProofUrl })}
                disabled={completeMutation.isPending} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
                {completeMutation.isPending ? '...' : 'সম্পন্ন'}
              </button>
              <button onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedWithdrawal && modalMode === 'reject' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">বাতিল করুন</h3>
            <div className="bg-red-50 rounded p-3 mb-4 text-sm">
              <p><strong>দুকান:</strong> {getMethodLabel(selectedWithdrawal)} | {selectedWithdrawal.usdt_amount} USDT</p>
              <p className="text-red-600 mt-1">⚠️ ইউজারের ব্যালেনসে {selectedWithdrawal.usdt_amount} USDT ফেরত দেয়া হবে</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">বাতিলের কারণ *</label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="যেমন: ভুল নাম্বার" className="w-full border rounded p-2" rows={3} required />
            </div>
            <div className="flex gap-2">
              <button onClick={() => rejectMutation.mutate({ withdrawalId: selectedWithdrawal.id, reason: rejectionReason })}
                disabled={rejectMutation.isPending || !rejectionReason.trim()} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50">
                {rejectMutation.isPending ? '...' : 'বাতিল করুন'}
              </button>
              <button onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">বাতিল</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
