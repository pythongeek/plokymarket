'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PendingDeposit {
  id: string;
  user_id: string;
  bdt_amount: number;
  usdt_amount: number;
  mfs_provider: string;
  txn_id: string;
  sender_number: string;
  sender_name: string | null;
  status: string;
  created_at: string;
  user_email?: string;
}

export default function DepositVerification() {
  const [selectedDeposit, setSelectedDeposit] = useState<PendingDeposit | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Get pending deposits
  const { data: pendingDeposits, isLoading } = useQuery({
    queryKey: ['adminPendingDeposits'],
    queryFn: async (): Promise<PendingDeposit[]> => {
      const { data, error } = await supabase
        .from('deposit_requests')
        .select(`
          *,
          user_email:auth.users!inner(email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as PendingDeposit[];
    },
    refetchInterval: 10000, // Auto-refresh every 10s
  });

  // Verify deposit mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ depositId, notes }: { depositId: string; notes: string }) => {
      const response = await fetch('/api/admin/deposits/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId,
          adminNotes: notes
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify deposit');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPendingDeposits'] });
      setSelectedDeposit(null);
      setAdminNotes('');
      toast.success('✅ Deposit verified and credited successfully!');
    },
    onError: (error: Error) => {
      toast.error(`❌ Error: ${error.message}`);
    },
  });

  // Reject deposit mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ depositId, reason }: { depositId: string; reason: string }) => {
      const response = await fetch('/api/admin/deposits/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId,
          reason
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject deposit');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPendingDeposits'] });
      setSelectedDeposit(null);
      setRejectionReason('');
      toast.success('❌ Deposit rejected successfully');
    },
    onError: (error: Error) => {
      toast.error(`❌ Error: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">পেন্ডিং ডিপোজিট ভেরিফিকেশন</h2>
      
      {pendingDeposits && pendingDeposits.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          ✅ কোনো পেন্ডিং ডিপোজিট নেই
        </div>
      )}

      <div className="grid gap-4">
        {pendingDeposits?.map((deposit: PendingDeposit) => (
          <div
            key={deposit.id}
            className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
              selectedDeposit?.id === deposit.id ? 'border-blue-500 ring-2 ring-blue-200' : ''
            }`}
            onClick={() => setSelectedDeposit(deposit)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-semibold">
                  ৳{deposit.bdt_amount.toLocaleString('bn-BD')} → {deposit.usdt_amount} USDT
                </p>
                <p className="text-sm text-gray-600">
                  {deposit.user_email} • {deposit.mfs_provider}
                </p>
                <p className="text-sm">
                  TxnID: <code className="bg-gray-100 px-1 rounded">{deposit.txn_id}</code>
                </p>
                <p className="text-sm text-gray-500">
                  সেন্ডার: {deposit.sender_number} {deposit.sender_name && `(${deposit.sender_name})`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(deposit.created_at).toLocaleString('bn-BD')}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDeposit(deposit);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  ভেরিফাই
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDeposit({ ...deposit, status: 'rejecting' } as any);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  রিজেক্ট
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Verify Modal */}
      {selectedDeposit && selectedDeposit.status !== 'rejecting' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">ডিপোজিট ভেরিফাই করুন</h3>
            
            <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
              <p><strong>ইউজার:</strong> {selectedDeposit.user_email}</p>
              <p><strong>পরিমাণ:</strong> ৳{selectedDeposit.bdt_amount.toLocaleString('bn-BD')} → {selectedDeposit.usdt_amount} USDT</p>
              <p><strong>MFS:</strong> {selectedDeposit.mfs_provider}</p>
              <p><strong>TxnID:</strong> {selectedDeposit.txn_id}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">অ্যাডমিন নোটস (ঐচ্ছিক)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="যেমন: bKash app-এ ভেরিফাইড"
                className="w-full border rounded p-2"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => verifyMutation.mutate({
                  depositId: selectedDeposit.id,
                  notes: adminNotes
                })}
                disabled={verifyMutation.isPending}
                className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {verifyMutation.isPending ? 'প্রসেসিং...' : '✓ কনফার্ম ভেরিফাই'}
              </button>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedDeposit && selectedDeposit.status === 'rejecting' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">ডিপোজিট রিজেক্ট করুন</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">রিজেকশন কারণ *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="যেমন: ভুল TxnID, টাকা পাওয়া যায়নি"
                className="w-full border rounded p-2"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => rejectMutation.mutate({
                  depositId: selectedDeposit.id,
                  reason: rejectionReason
                })}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'প্রসেসিং...' : '✓ কনফার্ম রিজেক্ট'}
              </button>
              <button
                onClick={() => setSelectedDeposit(null)}
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