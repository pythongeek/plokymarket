'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Search, Eye, Loader2, Plus, Minus } from 'lucide-react';

export function UsdtUsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rate, setRate] = useState(120);
  const supabase = createClient();

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'credit' | 'debit'>('credit');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      let usersQuery = supabase
        .from('profiles')
        .select(`
          id,
          email,
          phone,
          full_name,
          created_at,
          wallets (
            usdt_balance,
            locked_usdt,
            total_deposited,
            total_withdrawn
          )
        `);

      if (query) {
        usersQuery = usersQuery.or(`email.ilike.%${query}%,phone.ilike.%${query}%,full_name.ilike.%${query}%`);
      }

      const [usersRes, rateRes] = await Promise.all([
        usersQuery.order('created_at', { ascending: false }).limit(50),
        supabase.from('exchange_rates_live').select('usdt_to_bdt').order('fetched_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (rateRes.data?.usdt_to_bdt) setRate(rateRes.data.usdt_to_bdt);
    } catch (err) {
      console.error('Error loading USDT users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  const handleBulkAction = async () => {
    if (!bulkAmount || parseFloat(bulkAmount) <= 0 || selectedUsers.length === 0) return;

    setBulkSubmitting(true);
    try {
      const response = await fetch('/api/admin/usdt/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: bulkAction,
          userIds: selectedUsers,
          amount: parseFloat(bulkAmount),
          reason: bulkReason || `Bulk ${bulkAction} by admin`
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`সফলভাবে ${result.processed} ইউজারের ${bulkAction} করা হয়েছে।`);
        setBulkDialogOpen(false);
        setSelectedUsers([]);
        setBulkAmount('');
        setBulkReason('');
        loadData();
      } else {
        alert(`ত্রুটি: ${result.error}`);
      }
    } catch (error: any) {
      alert(`ত্রুটি: ${error.message}`);
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ইমেইল, ফোন বা নাম দিয়ে খুঁজুন..."
                className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
              />
            </div>
            <Button type="submit" className="bg-primary text-primary-foreground">খুঁজুন</Button>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={true}
              onCheckedChange={() => setSelectedUsers([])}
              className="border-slate-600"
            />
            <span className="text-white font-medium">
              {selectedUsers.length} ইউজার নির্বাচিত
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setBulkAction('credit'); setBulkDialogOpen(true); }}
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              বাল্ক ক্রেডিট
            </Button>
            <Button
              variant="outline"
              onClick={() => { setBulkAction('debit'); setBulkDialogOpen(true); }}
              className="border-red-600 text-red-400 hover:bg-red-600/20"
            >
              <Minus className="h-4 w-4 mr-2" />
              বাল্ক ডেবিট
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedUsers([])}
              className="text-slate-400 hover:text-white"
            >
              বাতিল
            </Button>
          </div>
        </div>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">
            ইউজার লিস্ট ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 font-medium text-xs text-slate-500 uppercase tracking-wider w-10">
                      <Checkbox
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(users.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="border-slate-600"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-xs text-slate-500 uppercase tracking-wider">ইউজার</th>
                    <th className="text-left px-4 py-3 font-medium text-xs text-slate-500 uppercase tracking-wider">যোগাযোগ</th>
                    <th className="text-right px-4 py-3 font-medium text-xs text-slate-500 uppercase tracking-wider">USDT ব্যালেন্স</th>
                    <th className="text-right px-4 py-3 font-medium text-xs text-slate-500 uppercase tracking-wider">BDT (≈)</th>
                    <th className="text-right px-4 py-3 font-medium text-xs text-slate-500 uppercase tracking-wider">লকড</th>
                    <th className="text-right px-4 py-3 font-medium text-xs text-slate-500 uppercase tracking-wider">মোট ডিপোজিট</th>
                    <th className="text-center px-4 py-3 font-medium text-xs text-slate-500 uppercase tracking-wider">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => {
                            setSelectedUsers(prev =>
                              prev.includes(user.id)
                                ? prev.filter(uid => uid !== user.id)
                                : [...prev, user.id]
                            );
                          }}
                          className="border-slate-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{user.full_name || 'N/A'}</p>
                          <p className="text-xs text-slate-500">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-slate-300">{user.email}</p>
                          <p className="text-xs text-slate-500">{user.phone || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-emerald-400">
                          {(user.wallets?.[0]?.usdt_balance ?? user.wallets?.usdt_balance ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {((user.wallets?.[0]?.usdt_balance ?? user.wallets?.usdt_balance ?? 0) * rate).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-orange-400">
                          {(user.wallets?.[0]?.locked_usdt ?? user.wallets?.locked_usdt ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {(user.wallets?.[0]?.total_deposited ?? user.wallets?.total_deposited ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 p-3 text-center">
                        <Link href={`/sys-cmd-7x9k2/usdt/users/${user.id}`}>
                          <Button size="sm" variant="outline" className="border-slate-800 text-slate-300 hover:text-white">
                            <Eye className="h-4 w-4 mr-1" />
                            বিস্তারিত
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        কোনো ইউজার পাওয়া যায়নি
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Credit/Debit Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'credit' ? 'বাল্ক USDT ক্রেডিট' : 'বাল্ক USDT ডেবিট'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedUsers.length} ইউজারের USDT ওয়ালেটে {bulkAction === 'credit' ? 'ক্রেডিট' : 'ডেবিট'} করবেন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">পরিমাণ (USDT) *</label>
              <Input
                type="number"
                value={bulkAmount}
                onChange={(e) => setBulkAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">কারণ (ঐচ্ছিক)</label>
              <Input
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="e.g., বোনাস, রিফান্ড"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className={bulkAction === 'credit' ? 'bg-emerald-500/20 p-3 rounded-lg' : 'bg-red-500/20 p-3 rounded-lg'}>
              <p className={bulkAction === 'credit' ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
                ⚠️ এই অ্যাকশন {selectedUsers.length} ইউজারকে প্রভাবিত করবে।
                {bulkAction === 'credit' ? ' USDT যোগ করা হবে।' : ' USDT কাটা হবে।'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              বাতিল
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={!bulkAmount || parseFloat(bulkAmount) <= 0 || bulkSubmitting}
              className={bulkAction === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {bulkSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  প্রসেসিং...
                </>
              ) : (
                <>
                  {bulkAction === 'credit' ? 'ক্রেডিট করুন' : 'ডেবিট করুন'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
