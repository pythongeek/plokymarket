import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Search, ArrowUpDown, Eye } from 'lucide-react';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const query = params.q || '';

  // Get users with wallet info
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

  const { data: users } = await usersQuery.order('created_at', { ascending: false }).limit(50);

  // Get current exchange rate
  const { data: exchangeRate } = await supabase
    .from('exchange_rates_live')
    .select('usdt_to_bdt')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  const rate = exchangeRate?.usdt_to_bdt || 120;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ইউজার ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground">USDT ব্যালেন্স দেখুন এবং ক্রেডিট/ডেবিট করুন</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="ইমেইল, ফোন বা নাম দিয়ে খুঁজুন..."
                defaultValue={query}
                className="pl-10"
              />
            </div>
            <Button type="submit">খুঁজুন</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>ইউজার লিস্ট ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">ইউজার</th>
                  <th className="text-left p-3">যোগাযোগ</th>
                  <th className="text-right p-3">USDT ব্যালেন্স</th>
                  <th className="text-right p-3">BDT (≈)</th>
                  <th className="text-right p-3">লকড</th>
                  <th className="text-right p-3">মোট ডিপোজিট</th>
                  <th className="text-center p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{user.full_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-green-600">
                        {user.wallets?.usdt_balance?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {((user.wallets?.usdt_balance || 0) * rate).toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-orange-600">
                        {user.wallets?.locked_usdt?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {user.wallets?.total_deposited?.toFixed(2) || '0.00'}
                    </td>
                    <td className="p-3 text-center">
                      <Link href={`/sys-cmd-7x9k2/usdt/users/${user.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          বিস্তারিত
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!users || users.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      কোনো ইউজার পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}