'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Search, Eye, Loader2 } from 'lucide-react';

export function UsdtUsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rate, setRate] = useState(120);
  const supabase = createClient();

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
                      <td colSpan={7} className="p-8 text-center text-slate-500">
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
    </div>
  );
}
