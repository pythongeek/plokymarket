'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils/formatters';
import { toast } from 'sonner';

// Types
interface WalletData {
  usdt: number;
  bdt: number;
  exchangeRate: number;
  totalDeposited: number;
  totalWithdrawn: number;
  kycStatus: 'pending' | 'verified' | 'rejected';
  dailyWithdrawalLimit: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'bonus' | 'exchange' | 'refund';
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: string;
  formattedDate: string;
  bdtAmount: number;
}

interface DepositRequest {
  id: string;
  bdtAmount: number;
  usdtAmount: number;
  mfsProvider: 'bkash' | 'nagad' | 'rocket';
  txnId: string;
  status: string;
  createdAt: string;
}

// Constants
const EXCHANGE_RATE = 100; // Default rate
const MIN_DEPOSIT_BDT = 50;
const MAX_DEPOSIT_BDT = 50000;
const MIN_WITHDRAW_USDT = 1;

export default function WalletDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [txnId, setTxnId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [mfsProvider, setMfsProvider] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNumber, setWithdrawNumber] = useState('');
  const [withdrawProvider, setWithdrawProvider] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');

  // Queries
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async (): Promise<WalletData> => {
      if (!user) throw new Error('Not authenticated');
      
      const response = await fetch('/api/wallet/balance');
      if (!response.ok) throw new Error('Failed to fetch balance');
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.balance;
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  const { data: transactions, isLoading: txsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) return [];
      
      const response = await fetch('/api/wallet/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.transactions;
    },
    enabled: !!user,
  });

  const { data: pendingDeposits } = useQuery({
    queryKey: ['pendingDeposits'],
    queryFn: async (): Promise<DepositRequest[]> => {
      if (!user) return [];
      
      const response = await fetch('/api/deposits/request?status=pending');
      if (!response.ok) throw new Error('Failed to fetch deposits');
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.deposits;
    },
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Mutations
  const depositMutation = useMutation({
    mutationFn: async () => {
      const bdtAmount = parseFloat(depositAmount);
      
      // Validation
      if (isNaN(bdtAmount) || bdtAmount < MIN_DEPOSIT_BDT || bdtAmount > MAX_DEPOSIT_BDT) {
        throw new Error(`Deposit amount must be between ${MIN_DEPOSIT_BDT} and ${MAX_DEPOSIT_BDT} BDT`);
      }
      
      if (!txnId.trim() || txnId.length < 8) {
        throw new Error('Please provide a valid Transaction ID');
      }
      
      if (!senderNumber.trim() || !/^01[3-9]\d{8}$/.test(senderNumber)) {
        throw new Error('Please provide a valid Bangladeshi mobile number (01XXXXXXXXX)');
      }

      const response = await fetch('/api/deposits/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bdtAmount,
          mfsProvider,
          txnId: txnId.trim().toUpperCase(),
          senderNumber: senderNumber.trim()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deposit request');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // Reset form
      setDepositAmount('');
      setTxnId('');
      setSenderNumber('');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['pendingDeposits'] });
      
      // Switch tab
      setActiveTab('overview');
      
      toast.success('✅ Deposit request submitted successfully! Please wait for admin verification.');
    },
    onError: (error: Error) => {
      toast.error(`❌ Error: ${error.message}`);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const usdtAmount = parseFloat(withdrawAmount);
      
      // Validation
      if (isNaN(usdtAmount) || usdtAmount < MIN_WITHDRAW_USDT) {
        throw new Error(`Minimum withdrawal amount is ${MIN_WITHDRAW_USDT} USDT`);
      }
      
      if (!wallet || usdtAmount > wallet.usdt) {
        throw new Error('Insufficient balance');
      }
      
      if (!withdrawNumber.trim() || !/^01[3-9]\d{8}$/.test(withdrawNumber)) {
        throw new Error('Please provide a valid Bangladeshi mobile number');
      }

      const response = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: usdtAmount,
          mfsProvider: withdrawProvider,
          recipientNumber: withdrawNumber.trim()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create withdrawal request');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // Reset form
      setWithdrawAmount('');
      setWithdrawNumber('');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Switch tab
      setActiveTab('overview');
      
      toast.success('✅ Withdrawal request submitted successfully! Please wait for admin processing.');
    },
    onError: (error: Error) => {
      toast.error(`❌ Error: ${error.message}`);
    },
  });

  // Realtime subscription for balance updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`wallet:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.setQueryData(['wallet'], (old: WalletData | undefined) => ({
            ...old!,
            usdt: payload.new.balance,
            bdt: payload.new.balance * (old?.exchangeRate || EXCHANGE_RATE)
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, queryClient]);

  if (authLoading || walletLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
        <p className="text-gray-600">You need to be logged in to view your wallet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b">
        {(['overview', 'deposit', 'withdraw', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'overview' && 'ওভারভিউ'}
            {tab === 'deposit' && 'ডিপোজিট'}
            {tab === 'withdraw' && 'উইথড্র'}
            {tab === 'history' && 'ইতিহাস'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
            <h2 className="text-lg opacity-90 mb-2">মোট ব্যালেন্স</h2>
            <div className="flex items-end gap-4">
              <span className="text-4xl font-bold">{formatCurrency(wallet?.usdt || 0, 'USDT')}</span>
              <span className="text-sm opacity-75 mb-1">
                ≈ {formatCurrency(wallet?.bdt || 0, 'BDT')}
              </span>
            </div>
            <p className="text-sm opacity-75 mt-2">
              এক্সচেঞ্জ রেট: 1 USDT = {formatCurrency(wallet?.exchangeRate || EXCHANGE_RATE, 'BDT')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">মোট ডিপোজিট</p>
              <p className="text-xl font-semibold">{formatCurrency(wallet?.totalDeposited || 0, 'USDT')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">মোট উইথড্র</p>
              <p className="text-xl font-semibold">{formatCurrency(wallet?.totalWithdrawn || 0, 'USDT')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">KYC স্ট্যাটাস</p>
              <p className={`text-xl font-semibold ${
                wallet?.kycStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {wallet?.kycStatus === 'verified' ? '✓ ভেরিফাইড' : '⏳ পেন্ডিং'}
              </p>
            </div>
          </div>

          {/* Pending Deposits */}
          {pendingDeposits && pendingDeposits.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⏳ পেন্ডিং ডিপোজিট রিকোয়েস্ট</h3>
              {pendingDeposits.map((deposit) => (
                <div key={deposit.id} className="flex justify-between items-center py-2 border-b border-yellow-200 last:border-0">
                  <div>
                    <p className="font-medium">{formatCurrency(deposit.bdtAmount, 'BDT')} ({formatCurrency(deposit.usdtAmount, 'USDT')})</p>
                    <p className="text-sm text-gray-600">{deposit.mfsProvider} • {deposit.txnId}</p>
                  </div>
                  <span className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    অপেক্ষমান
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('deposit')}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              + ডিপোজিট করুন
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              - উইথড্র করুন
            </button>
          </div>
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <form onSubmit={(e) => { e.preventDefault(); depositMutation.mutate(); }} className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">ক্যাশ ডিপোজিট (bKash/Nagad/Rocket)</h3>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>ধাপ ১:</strong> নিচের নাম্বারে টাকা সেন্ড করুন< br />
              <strong>bKash:</strong> 017XXXXXXXX (Send Money)< br />
              <strong>Nagad:</strong> 017XXXXXXXX (Send Money)< br />
              <strong>Rocket:</strong> 017XXXXXXXX (Send Money)< br />
              <strong>ধাপ ২:</strong> Transaction ID (TxnID) নিচে লিখুন
            </p>
          </div>

          {/* MFS Provider */}
          <div>
            <label className="block text-sm font-medium mb-1">পেমেন্ট মেথড</label>
            <select
              value={mfsProvider}
              onChange={(e) => setMfsProvider(e.target.value as any)}
              className="w-full border rounded-lg p-2"
            >
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">টাকার পরিমাণ (BDT)</label>
            <input
              type="number"
              min={MIN_DEPOSIT_BDT}
              max={MAX_DEPOSIT_BDT}
              step="100"
              placeholder={`সর্বনিম্ন ৳${MIN_DEPOSIT_BDT}`}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              আপনি পাবেন: <strong>{formatCurrency((parseFloat(depositAmount || '0') / (wallet?.exchangeRate || EXCHANGE_RATE)).toFixed(2), 'USDT')}</strong>
            </p>
          </div>

          {/* Sender Number */}
          <div>
            <label className="block text-sm font-medium mb-1">সেন্ডার মোবাইল নাম্বার</label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium mb-1">Transaction ID (TxnID)</label>
            <input
              type="text"
              placeholder="যেমন: 8A7B6C5D4E"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value.toUpperCase())}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={depositMutation.isPending}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {depositMutation.isPending ? 'প্রসেসিং...' : 'ডিপোজিট রিকোয়েস্ট করুন'}
          </button>
        </form>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <form onSubmit={(e) => { e.preventDefault(); withdrawMutation.mutate(); }} className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">USDT উইথড্র (BDT-তে কনভার্ট)</h3>
          
          {/* Instructions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-purple-800">
              <strong>রেট:</strong> 1 USDT = {formatCurrency(wallet?.exchangeRate || EXCHANGE_RATE, 'BDT')} BDT< br />
              <strong>সর্বনিম্ন:</strong> {MIN_WITHDRAW_USDT} USDT< br />
              <strong>প্রসেসিং টাইম:</strong> ১-২৪ ঘণ্টা
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">USDT পরিমাণ</label>
            <input
              type="number"
              min={MIN_WITHDRAW_USDT}
              step="0.01"
              max={wallet?.usdt}
              placeholder={`সর্বনিম্ন ${MIN_WITHDRAW_USDT} USDT`}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              আপনি পাবেন: <strong>{formatCurrency((parseFloat(withdrawAmount || '0') * (wallet?.exchangeRate || EXCHANGE_RATE)).toFixed(2), 'BDT')}</strong>
            </p>
          </div>

          {/* MFS Provider */}
          <div>
            <label className="block text-sm font-medium mb-1">রিসিভ করবেন (bKash/Nagad/Rocket)</label>
            <select
              value={withdrawProvider}
              onChange={(e) => setWithdrawProvider(e.target.value as any)}
              className="w-full border rounded-lg p-2"
            >
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
            </select>
          </div>

          {/* Recipient Number */}
          <div>
            <label className="block text-sm font-medium mb-1">মোবাইল নাম্বার (যেখানে টাকা পাবেন)</label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={withdrawNumber}
              onChange={(e) => setWithdrawNumber(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={withdrawMutation.isPending || !wallet || parseFloat(withdrawAmount || '0') > wallet.usdt}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {withdrawMutation.isPending ? 'প্রসেসিং...' : 'উইথড্র রিকোয়েস্ট করুন'}
          </button>
        </form>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">লেনদেনের ইতিহাস</h3>
          
          {txsLoading ? (
            <p>লোড হচ্ছে...</p>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    tx.type === 'deposit' || tx.type === 'bonus' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div>
                    <p className="font-medium">
                      {tx.type === 'deposit' && '💰 ডিপোজিট'}
                      {tx.type === 'withdrawal' && '💸 উইথড্র'}
                      {tx.type === 'bonus' && '🎁 বোনাস'}
                      {tx.type === 'exchange' && '💱 এক্সচেঞ্জ'}
                      {tx.type === 'refund' && '↩️ রিফান্ড'}
                    </p>
                    <p className="text-sm text-gray-600">{tx.description}</p>
                    <p className="text-xs text-gray-400">{tx.formattedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.type === 'deposit' || tx.type === 'bonus' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'bonus' ? '+' : '-'}
                      {formatCurrency(tx.amount, 'USDT')}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tx.status === 'completed' ? '✓ সম্পন্ন' :
                       tx.status === 'pending' ? '⏳ অপেক্ষমান' : '❌ ব্যর্থ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">কোনো লেনদেন পাওয়া যায়নি</p>
          )}
        </div>
      )}
    </div>
  );
}
