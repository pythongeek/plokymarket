'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  usdt_amount: number;
  bdt_amount: number;
  mfs_provider: string;
  recipient_number: string;
  recipient_name: string | null;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  user_email?: string;
  user_full_name?: string;
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'completed' | 'rejected';

export default function WithdrawalProcessing() {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [transferProofUrl, setTransferProofUrl] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [modalMode, setModalMode] = useState<'process' | 'complete' | 'reject' | null>(null);
  
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Get withdrawals
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['adminWithdrawals', filterStatus],
    queryFn: async (): Promise<WithdrawalRequest[]> => {
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user_email:profiles!inner(email, full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      return (data as any[]).map(item => ({
        ...item,
        user_email: item.user_email?.email,
        user_full_name: item.user_email?.full_name
      })) as WithdrawalRequest[];
    },
    refetchInterval: 10000,
  });

  // Process withdrawal mutation (pending -> processing)
  const processMutation = useMutation({
    mutationFn: async ({ withdrawalId, notes }: { withdrawalId: string; notes: string }) => {
      const response = await fetch('/api/admin/withdrawals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          adminNotes: notes
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process withdrawal');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      setSelectedWithdrawal(null);
      setAdminNotes('');
      setModalMode(null);
      toast.success('✅ উইথড্র প্রসেসিং শুরু হয়েছে!');
    },
    onError: (error: Error) => {
      toast.error(`❌ ত্রুটি: ${error.message}`);
    },
  });

  // Complete withdrawal mutation (processing -> completed)
  const completeMutation = useMutation({
    mutationFn: async ({ withdrawalId, notes, proofUrl }: { withdrawalId: string; notes: string; proofUrl: string }) => {
      const response = await fetch('/api/admin/withdrawals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          adminNotes: notes,
          transferProofUrl: proofUrl
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete withdrawal');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      setSelectedWithdrawal(null);
      setAdminNotes('');
      setTransferProofUrl('');
      setModalMode(null);
      toast.success('✅ উইথড্র সম্পন্ন হয়েছে!');
    },
    onError: (error: Error) => {
      toast.error(`❌ ত্রুটি: ${error.message}`);
    },
  });

  // Reject withdrawal mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ withdrawalId, reason }: { withdrawalId: string; reason: string }) => {
      const response = await fetch('/api/admin/withdrawals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          rejectionReason: reason
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject withdrawal');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      setSelectedWithdrawal(null);
      setRejectionReason('');
      setModalMode(null);
      toast.success('❌ উইথড্র বাতিল করা হয়েছে এবং টাকা ফেরত দেওয়া হয়েছে');
    },
    onError: (error: Error) => {
      toast.error(`❌ ত্রুটি: ${error.message}`);
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      pending: '⏳ অপেক্ষমাণ',
      processing: '🔧 প্রসেসিং',
      completed: '✅ সম্পন্ন',
      rejected: '❌ বাতিল',
      cancelled: '🚫 ক্যান্সেল',
    };
    return (
      <span className={`px-2 py-1 rounded text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const openModal = (withdrawal: WithdrawalRequest, mode: 'process' | 'complete' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setModalMode(mode);
    setAdminNotes(withdrawal.admin_notes || '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">উইথড্র ম্যানেজমেন্ট</h2>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'pending', 'processing', 'completed', 'rejected'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && 'সব'}
              {status === 'pending' && 'অপেক্ষমাণ'}
              {status === 'processing' && 'প্রসেসিং'}
              {status === 'completed' && 'সম্পন্ন'}
              {status === 'rejected' && 'বাতিল'}
            </button>
          ))}
        </div>
      </div>
      
      {withdrawals && withdrawals.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          📭 কোনো উইথড্র রিকোয়েস্ট পাওয়া যায়নি
        </div>
      )}

      <div className="grid gap-4">
        {withdrawals?.map((withdrawal: WithdrawalRequest) => (
          <div
            key={withdrawal.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-lg font-semibold">
                    {withdrawal.usdt_amount} USDT → ৳{withdrawal.bdt_amount.toLocaleString('bn-BD')}
                  </p>
                  {getStatusBadge(withdrawal.status)}
                </div>
                
                <p className="text-sm text-gray-600">
                  {withdrawal.user_full_name || withdrawal.user_email} • {withdrawal.mfs_provider}
                </p>
                
                <p className="text-sm">
                  প্রাপক: <span className="font-medium">{withdrawal.recipient_number}</span>
                  {withdrawal.recipient_name && ` (${withdrawal.recipient_name})`}
                </p>
                
                {withdrawal.admin_notes && (
                  <p className="text-sm text-gray-500 mt-1">
                    📝 {withdrawal.admin_notes}
                  </p>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(withdrawal.created_at).toLocaleString('bn-BD')}
                  {withdrawal.processed_at && (
                    <span className="ml-2">
                      (প্রসেস করা হয়েছে: {new Date(withdrawal.processed_at).toLocaleString('bn-BD')})
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                {withdrawal.status === 'pending' && (
                  <>
                    <button
                      onClick={() => openModal(withdrawal, 'process')}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      🔧 প্রসেসিং শুরু করুন
                    </button>
                    <button
                      onClick={() => openModal(withdrawal, 'reject')}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                    >
                      ❌ বাতিল করুন
                    </button>
                  </>
                )}
                
                {withdrawal.status === 'processing' && (
                  <>
                    <button
                      onClick={() => openModal(withdrawal, 'complete')}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                    >
                      ✅ সম্পন্ন করুন
                    </button>
                    <button
                      onClick={() => openModal(withdrawal, 'reject')}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                    >
                      ❌ বাতিল করুন
                    </button>
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
            <h3 className="text-xl font-bold mb-4">উইথড্র প্রসেসিং শুরু করুন</h3>
            
            <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
              <p><strong>ইউজার:</strong> {selectedWithdrawal.user_full_name || selectedWithdrawal.user_email}</p>
              <p><strong>পরিমাণ:</strong> {selectedWithdrawal.usdt_amount} USDT → ৳{selectedWithdrawal.bdt_amount}</p>
              <p><strong>MFS:</strong> {selectedWithdrawal.mfs_provider}</p>
              <p><strong>প্রাপক:</strong> {selectedWithdrawal.recipient_number}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">অ্যাডমিন নোটস (ঐচ্ছিক)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="যেমন: bKash-এ টাকা পাঠানো হবে"
                className="w-full border rounded p-2"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => processMutation.mutate({
                  withdrawalId: selectedWithdrawal.id,
                  notes: adminNotes
                })}
                disabled={processMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {processMutation.isPending ? 'প্রসেসিং...' : '✓ কনফার্ম'}
              </button>
              <button
                onClick={() => { setSelectedWithdrawal(null); setModalMode(null); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {selectedWithdrawal && modalMode === 'complete' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-green-700">উইথড্র সম্পন্ন করুন</h3>
            
            <div className="bg-green-50 rounded p-3 mb-4 text-sm">
              <p><strong>ইউজার:</strong> {selectedWithdrawal.user_full_name || selectedWithdrawal.user_email}</p>
              <p><strong>পরিমাণ:</strong> {selectedWithdrawal.usdt_amount} USDT → ৳{selectedWithdrawal.bdt_amount}</p>
              <p><strong>প্রাপক:</strong> {selectedWithdrawal.recipient_number}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">অ্যাডমিন নোটস (ঐচ্ছিক)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="যেমন: bKash-এ টাকা পাঠানো হয়েছে"
                className="w-full border rounded p-2"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">ট্রান্সফার প্রুফ URL (ঐচ্ছিক)</label>
              <input
                type="text"
                value={transferProofUrl}
                onChange={(e) => setTransferProofUrl(e.target.value)}
                placeholder="https://... (স্ক্রিনশট লিংক)"
                className="w-full border rounded p-2"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => completeMutation.mutate({
                  withdrawalId: selectedWithdrawal.id,
                  notes: adminNotes,
                  proofUrl: transferProofUrl
                })}
                disabled={completeMutation.isPending}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {completeMutation.isPending ? 'প্রসেসিং...' : '✓ সম্পন্ন করুন'}
              </button>
              <button
                onClick={() => { setSelectedWithdrawal(null); setModalMode(null); setTransferProofUrl(''); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedWithdrawal && modalMode === 'reject' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">উইথড্র বাতিল করুন</h3>
            
            <div className="bg-red-50 rounded p-3 mb-4 text-sm">
              <p><strong>ইউজার:</strong> {selectedWithdrawal.user_full_name || selectedWithdrawal.user_email}</p>
              <p><strong>পরিমাণ:</strong> {selectedWithdrawal.usdt_amount} USDT</p>
              <p className="text-red-600 mt-1">
                ⚠️ এই অপারেশন ইউজারের ব্যালেন্সে {selectedWithdrawal.usdt_amount} USDT ফেরত দেবে
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">বাতিলের কারণ *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="যেমন: ভুল নাম্বার, অপর্যাপ্ত তহবিল"
                className="w-full border rounded p-2"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => rejectMutation.mutate({
                  withdrawalId: selectedWithdrawal.id,
                  reason: rejectionReason
                })}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'প্রসেসিং...' : '✓ বাতিল করুন'}
              </button>
              <button
                onClick={() => { setSelectedWithdrawal(null); setModalMode(null); setRejectionReason(''); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
