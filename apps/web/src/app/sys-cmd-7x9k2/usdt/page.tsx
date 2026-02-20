import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminP2PRateDisplay } from '@/components/admin/P2PRateDisplay';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ArrowUpRight, Users, Settings, FileText } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function USDTDashboardPage() {
  const supabase = await createClient();

  // Get stats
  const { data: walletStats } = await supabase
    .from('wallets')
    .select('usdt_balance, locked_usdt, total_deposited, total_withdrawn');

  const { data: pendingDeposits } = await supabase
    .from('deposit_requests')
    .select('id')
    .eq('status', 'pending');

  const { data: pendingWithdrawals } = await supabase
    .from('withdrawal_requests')
    .select('id')
    .eq('status', 'pending');

  const totalBalance = walletStats?.reduce((sum, w) => sum + (w.usdt_balance || 0), 0) || 0;
  const totalLocked = walletStats?.reduce((sum, w) => sum + (w.locked_usdt || 0), 0) || 0;
  const totalDeposited = walletStats?.reduce((sum, w) => sum + (w.total_deposited || 0), 0) || 0;
  const totalWithdrawn = walletStats?.reduce((sum, w) => sum + (w.total_withdrawn || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">USDT ম্যানেজমেন্ট ড্যাশবোর্ড</h1>
          <p className="text-muted-foreground">ভার্চুয়াল USDT সিস্টেম ব্যবস্থাপনা</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sys-cmd-7x9k2/usdt/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              সেটিংস
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time P2P Exchange Rate */}
      <AdminP2PRateDisplay />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">মোট USDT ব্যালেন্স</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalance.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">
              ≈ ৳{(totalBalance * 120).toFixed(2)} BDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">লকড USDT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalLocked.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">চলমান অর্ডারে</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">মোট ডিপোজিট</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalDeposited.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">সর্বমোট জমা</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">মোট উইথড্রয়াল</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalWithdrawn.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">সর্বমোট তোলা</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                  <ArrowDownLeft className="h-6 w-6 text-yellow-700" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-800">অপেক্ষমাণ ডিপোজিট</p>
                  <p className="text-2xl font-bold text-yellow-900">{pendingDeposits?.length || 0}</p>
                </div>
              </div>
              <Link href="/sys-cmd-7x9k2/deposit-settings">
                <Button>ভেরিফাই করুন</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800">অপেক্ষমাণ উইথড্রয়াল</p>
                  <p className="text-2xl font-bold text-blue-900">{pendingWithdrawals?.length || 0}</p>
                </div>
              </div>
              <Link href="/sys-cmd-7x9k2/withdrawals">
                <Button>প্রসেস করুন</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/sys-cmd-7x9k2/usdt/users">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">ইউজার ম্যানেজমেন্ট</p>
                  <p className="text-sm text-muted-foreground">ব্যালেন্স দেখুন ও ক্রেডিট করুন</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sys-cmd-7x9k2/usdt/transactions">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">ট্রানজেকশন লগ</p>
                  <p className="text-sm text-muted-foreground">সকল লেনদেন দেখুন</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sys-cmd-7x9k2/usdt/settings">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">সেটিংস</p>
                  <p className="text-sm text-muted-foreground">এক্সচেঞ্জ রেট কনফিগার</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}