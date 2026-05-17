'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Plus, Trash2, Edit2, Wallet, ExternalLink, RefreshCw } from 'lucide-react';

interface CryptoWallet {
  id: string;
  network: string;
  address: string;
  memo_pattern: string | null;
  fee_usdt: number;
  confirmation_blocks: number;
  is_active: boolean;
  instructions: string | null;
  total_received_usdt: number;
  created_at: string;
}

const NETWORK_LABELS: Record<string, { label: string; color: string }> = {
  bep20: { label: 'BEP-20 (BSC)', color: 'bg-yellow-500' },
  trc20: { label: 'TRC-20 (Tron)', color: 'bg-red-500' },
  ton: { label: 'TON', color: 'bg-blue-500' },
  erc20: { label: 'ERC-20 (Ethereum)', color: 'bg-indigo-500' },
};

export default function CryptoWalletManager() {
  const [editing, setEditing] = useState<CryptoWallet | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    network: 'bep20',
    address: '',
    memo_pattern: '',
    fee_usdt: '0.50',
    confirmation_blocks: '12',
    instructions: '',
  });
  const queryClient = useQueryClient();

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['cryptoWallets'],
    queryFn: async (): Promise<CryptoWallet[]> => {
      const res = await fetch('/api/admin/crypto-wallets');
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      return result.data || [];
    },
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/crypto-wallets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Create failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cryptoWallets'] }); resetForm(); toast.success('ওয়ালেট যোগ করা হয়েছে'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/crypto-wallets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cryptoWallets'] }); setEditing(null); toast.success('অাপডেট হয়েছে'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/crypto-wallets?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cryptoWallets'] }); toast.success('মুছে ফেলা হয়েছে'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyAddress = (addr: string, id: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('কপি হয়েছে');
  };

  const resetForm = () => {
    setForm({ network: 'bep20', address: '', memo_pattern: '', fee_usdt: '0.50', confirmation_blocks: '12', instructions: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      network: form.network,
      address: form.address,
      memo_pattern: form.memo_pattern || null,
      fee_usdt: parseFloat(form.fee_usdt) || 0,
      confirmation_blocks: parseInt(form.confirmation_blocks) || 1,
      instructions: form.instructions || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {editing ? 'ওয়ালেট এডিট করুন' : 'নতুন ক্রিপ্টো ওয়ালেট যোগ করুন'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">নেটওয়ার্ক</label>
            <select value={form.network} onChange={e => setForm({ ...form, network: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm" disabled={!!editing}>
              <option value="bep20">BEP-20 (BSC)</option>
              <option value="trc20">TRC-20 (Tron)</option>
              <option value="ton">TON</option>
              <option value="erc20">ERC-20 (Ethereum)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ওয়ালেট ঠিকানা</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="0x... বা TRC20 ঠিকানা" className="w-full border rounded-lg p-2 text-sm font-mono" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Memo Pattern (অপশন)</label>
            <input type="text" value={form.memo_pattern} onChange={e => setForm({ ...form, memo_pattern: e.target.value })}
              placeholder="USER_{id}" className="w-full border rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ফি (USDT)</label>
            <input type="number" step="0.01" value={form.fee_usdt} onChange={e => setForm({ ...form, fee_usdt: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">কনফারমেশন ব্লক</label>
            <input type="number" value={form.confirmation_blocks} onChange={e => setForm({ ...form, confirmation_blocks: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">নির্দেশনাবলী (ইউজারের জন্য)</label>
            <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })}
              placeholder="ইউজারের জন্য নির্দেশনা লিখুন" className="w-full border rounded-lg p-2 text-sm" rows={2} />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
              {editing ? 'অাপডেট করুন' : 'যোগ করুন'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); resetForm(); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">বাতিল</button>
            )}
          </div>
        </form>
      </div>

      {/* Wallets List */}
      <div className="grid gap-4">
        {wallets?.map(wallet => {
          const net = NETWORK_LABELS[wallet.network] || { label: wallet.network.toUpperCase(), color: 'bg-gray-500' };
          return (
            <motion.div key={wallet.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-4 rounded-xl border ${wallet.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${net.color} text-white text-xs px-2 py-0.5 rounded font-bold`}>{net.label}</span>
                    {wallet.is_active ? <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">সক্রিয়</span> : <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">নিষ্ক্রিয়</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm truncate">{wallet.address}</p>
                    <button onClick={() => copyAddress(wallet.address, wallet.id)} className="p-1 hover:bg-gray-100 rounded shrink-0">
                      {copiedId === wallet.id ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                    </button>
                    <a href={`https://${wallet.network === 'bep20' ? 'bscscan.com' : wallet.network === 'trc20' ? 'tronscan.org' : wallet.network === 'ton' ? 'tonscan.org' : 'etherscan.io'}/address/${wallet.address}`}
                      target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded shrink-0">
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </a>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>ফি: {wallet.fee_usdt} USDT</span>
                    <span>কনফারম: {wallet.confirmation_blocks} ব্লক</span>
                    {wallet.memo_pattern && <span>Memo: {wallet.memo_pattern}</span>}
                    <span>মোট রিসিভ: {wallet.total_received_usdt?.toFixed(2)} USDT</span>
                  </div>
                  {wallet.instructions && <p className="text-xs text-gray-500 mt-1">{wallet.instructions}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => {
                    setEditing(wallet);
                    setForm({
                      network: wallet.network,
                      address: wallet.address,
                      memo_pattern: wallet.memo_pattern || '',
                      fee_usdt: String(wallet.fee_usdt),
                      confirmation_blocks: String(wallet.confirmation_blocks),
                      instructions: wallet.instructions || '',
                    });
                  }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => updateMutation.mutate({ id: wallet.id, is_active: !wallet.is_active })}
                    className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100">
                    <Wallet className="h-4 w-4" />
                  </button>
                  <button onClick={() => {
                    if (confirm('নিশ্চিত করে মুছে ফেলতে চান?')) deleteMutation.mutate(wallet.id);
                  }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {wallets?.length === 0 && <div className="text-center py-12 text-gray-500">📦 কোনো ক্রিপ্টো ওয়ালেট যোগ করা হয়নি</div>}
    </div>
  );
}
