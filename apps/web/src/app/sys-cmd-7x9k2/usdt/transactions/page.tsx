import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/server';
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default async function TransactionsPage() {
  const supabase = await createClient();

  // Get pending deposits
  const { data: pendingDeposits } = await supabase
    .from('deposit_requests')
    .select(`
      *,
      profiles:user_id (email, full_name, phone)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Get pending withdrawals
  const { data: pendingWithdrawals } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      profiles:user_id (email, full_name, phone)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Get recent transactions
  const { data: recentDeposits } = await supabase
    .from('deposit_requests')
    .select(`
      *,
      profiles:user_id (email, full_name, phone)
    `)
    .in('status', ['approved', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: recentWithdrawals } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      profiles:user_id (email, full_name, phone)
    `)
    .in('status', ['approved', 'rejected', 'completed'])
    .order('created_at', { ascending: false })
    .limit(50);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">অপেক্ষমাণ</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">অনুমোদিত</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">বাতিল</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">সম্পন্ন</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ট্রানজেকশন লগ</h1>
        <p className="text-muted-foreground">সকল USDT লেনদেন দেখুন এবং পরিচালনা করুন</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="font-semibold text-yellow-800">অপেক্ষমাণ ডিপোজিট</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingDeposits?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-blue-800">অপেক্ষমাণ উইথড্রয়াল</p>
                <p className="text-2xl font-bold text-blue-900">{pendingWithdrawals?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            অপেক্ষমাণ ({(pendingDeposits?.length || 0) + (pendingWithdrawals?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="deposits">ডিপোজিট ({recentDeposits?.length || 0})</TabsTrigger>
          <TabsTrigger value="withdrawals">উইথড্রয়াল ({recentWithdrawals?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <div className="space-y-4">
            {/* Pending Deposits */}
            {pendingDeposits && pendingDeposits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">অপেক্ষমাণ ডিপোজিট</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingDeposits.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                        <div className="flex items-center gap-4">
                          <ArrowDownLeft className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium">{d.profiles?.email || d.profiles?.phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {d.amount_bdt} BDT → {d.amount_usdt?.toFixed(2)} USDT
                            </p>
                            <p className="text-xs text-muted-foreground">
                              TXN: {d.txn_id} | {d.mfs_provider} | {d.sender_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(d.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(d.created_at).toLocaleString('bn-BD')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Withdrawals */}
            {pendingWithdrawals && pendingWithdrawals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">অপেক্ষমাণ উইথড্রয়াল</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingWithdrawals.map((w: any) => (
                      <div key={w.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                        <div className="flex items-center gap-4">
                          <ArrowUpRight className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{w.profiles?.email || w.profiles?.phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {w.amount_usdt?.toFixed(2)} USDT → {w.amount_bdt?.toFixed(2)} BDT
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {w.mfs_provider} | {w.recipient_number} | {w.account_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(w.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(w.created_at).toLocaleString('bn-BD')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(!pendingDeposits?.length && !pendingWithdrawals?.length) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">কোনো অপেক্ষমাণ ট্রানজেকশন নেই</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>সাম্প্রতিক ডিপোজিট</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">ইউজার</th>
                      <th className="text-right p-3">BDT</th>
                      <th className="text-right p-3">USDT</th>
                      <th className="text-left p-3">MFS</th>
                      <th className="text-left p-3">TXN ID</th>
                      <th className="text-center p-3">স্ট্যাটাস</th>
                      <th className="text-left p-3">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDeposits?.map((d: any) => (
                      <tr key={d.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <p className="font-medium">{d.profiles?.email}</p>
                          <p className="text-xs text-muted-foreground">{d.profiles?.phone}</p>
                        </td>
                        <td className="p-3 text-right">{d.amount_bdt}</td>
                        <td className="p-3 text-right font-mono text-green-600">
                          +{d.amount_usdt?.toFixed(2)}
                        </td>
                        <td className="p-3">{d.mfs_provider}</td>
                        <td className="p-3 font-mono text-xs">{d.txn_id}</td>
                        <td className="p-3 text-center">{getStatusBadge(d.status)}</td>
                        <td className="p-3 text-sm">
                          {new Date(d.created_at).toLocaleDateString('bn-BD')}
                        </td>
                      </tr>
                    ))}
                    {(!recentDeposits || recentDeposits.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          কোনো ডিপোজিট নেই
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>সাম্প্রতিক উইথড্রয়াল</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">ইউজার</th>
                      <th className="text-right p-3">USDT</th>
                      <th className="text-right p-3">BDT</th>
                      <th className="text-left p-3">প্রাপক</th>
                      <th className="text-left p-3">MFS</th>
                      <th className="text-center p-3">স্ট্যাটাস</th>
                      <th className="text-left p-3">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentWithdrawals?.map((w: any) => (
                      <tr key={w.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <p className="font-medium">{w.profiles?.email}</p>
                          <p className="text-xs text-muted-foreground">{w.profiles?.phone}</p>
                        </td>
                        <td className="p-3 text-right font-mono text-red-600">
                          -{w.amount_usdt?.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">{w.amount_bdt?.toFixed(2)}</td>
                        <td className="p-3">
                          <p>{w.recipient_number}</p>
                          <p className="text-xs text-muted-foreground">{w.account_name}</p>
                        </td>
                        <td className="p-3">{w.mfs_provider}</td>
                        <td className="p-3 text-center">{getStatusBadge(w.status)}</td>
                        <td className="p-3 text-sm">
                          {new Date(w.created_at).toLocaleDateString('bn-BD')}
                        </td>
                      </tr>
                    ))}
                    {(!recentWithdrawals || recentWithdrawals.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          কোনো উইথড্রয়াল নেই
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}