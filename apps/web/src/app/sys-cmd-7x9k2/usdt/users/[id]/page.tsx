import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/server';
import { ArrowUpCircle, ArrowDownCircle, History, User } from 'lucide-react';
import Link from 'next/link';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get user info
  const { data: user } = await supabase
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
        total_withdrawn,
        updated_at
      )
    `)
    .eq('id', id)
    .single();

  // Get exchange rate
  const { data: exchangeRate } = await supabase
    .from('exchange_rates_live')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  // Get transaction history
  const { data: deposits } = await supabase
    .from('deposit_requests')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: withdrawals } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const rate = exchangeRate?.usdt_to_bdt || 120;
  const wallet = user?.wallets as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sys-cmd-7x9k2/usdt/users">
          <Button variant="outline" size="sm">← ফিরে যান</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">ইউজার বিস্তারিত</h1>
          <p className="text-muted-foreground">USDT ব্যালেন্স ম্যানেজমেন্ট</p>
        </div>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold">{user?.full_name || 'N/A'}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">ফোন: {user?.phone || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">মোট ব্যালেন্স</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{wallet?.usdt_balance?.toFixed(2) || '0.00'} USDT</p>
            <p className="text-sm text-muted-foreground">
              ≈ {((wallet?.usdt_balance || 0) * rate).toFixed(2)} BDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ব্যবহারযোগ্য</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {((wallet?.usdt_balance || 0) - (wallet?.locked_usdt || 0)).toFixed(2)} USDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">লকড</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {wallet?.locked_usdt?.toFixed(2) || '0.00'} USDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">এক্সচেঞ্জ রেট</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rate.toFixed(2)} BDT</p>
            <p className="text-sm text-muted-foreground">per USDT</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit/Debit Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Credit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
              USDT ক্রেডিট (যোগ করুন)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/admin/usdt/credit" method="POST" className="space-y-4">
              <input type="hidden" name="user_id" value={user?.id} />
              
              <div className="space-y-2">
                <Label htmlFor="credit_amount">USDT পরিমাণ *</Label>
                <Input
                  id="credit_amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="যেমন: 100.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_reason">কারণ *</Label>
                <Textarea
                  id="credit_reason"
                  name="reason"
                  placeholder="কেন ক্রেডিট করছেন?"
                  required
                />
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ⚠️ ক্রেডিট করলে ইউজারের ব্যালেন্স বাড়বে। এটি পূর্বাবস্থায় ফেরানো যাবে না।
                </p>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-500">
                ক্রেডিট করুন
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Debit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
              USDT ডেবিট (কেটে নিন)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/admin/usdt/debit" method="POST" className="space-y-4">
              <input type="hidden" name="user_id" value={user?.id} />
              
              <div className="space-y-2">
                <Label htmlFor="debit_amount">USDT পরিমাণ *</Label>
                <Input
                  id="debit_amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={wallet?.usdt_balance || 0}
                  placeholder="যেমন: 50.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  সর্বোচ্চ: {wallet?.usdt_balance?.toFixed(2) || '0.00'} USDT
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="debit_reason">কারণ *</Label>
                <Textarea
                  id="debit_reason"
                  name="reason"
                  placeholder="কেন ডেবিট করছেন?"
                  required
                />
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  ⚠️ ডেবিট করলে ইউজারের ব্যালেন্স কমবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।
                </p>
              </div>

              <Button type="submit" variant="destructive" className="w-full">
                ডেবিট করুন
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            সাম্প্রতিক লেনদেন
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposits">
            <TabsList>
              <TabsTrigger value="deposits">ডিপোজিট ({deposits?.length || 0})</TabsTrigger>
              <TabsTrigger value="withdrawals">উইথড্রয়াল ({withdrawals?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="deposits" className="mt-4">
              <div className="space-y-2">
                {deposits?.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">+{d.amount_usdt?.toFixed(2)} USDT</span>
                        <Badge variant={d.status === 'approved' ? 'default' : 'secondary'}>
                          {d.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {d.amount_bdt} BDT via {d.mfs_provider} • {new Date(d.created_at).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">TXN: {d.txn_id}</p>
                    </div>
                  </div>
                ))}
                {(!deposits || deposits.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">কোনো ডিপোজিট নেই</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-4">
              <div className="space-y-2">
                {withdrawals?.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-600">-{w.amount_usdt?.toFixed(2)} USDT</span>
                        <Badge variant={w.status === 'approved' ? 'default' : 'secondary'}>
                          {w.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {w.amount_bdt} BDT to {w.recipient_number} • {new Date(w.created_at).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!withdrawals || withdrawals.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">কোনো উইথড্রয়াল নেই</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}