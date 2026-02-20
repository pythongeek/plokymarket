'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/i18n/client';

interface WalletBalance {
    usdt_balance: number;
    locked_usdt: number;
    total_deposited: number;
    total_withdrawn: number;
}

export function BalanceCard() {
    const [balance, setBalance] = useState<WalletBalance | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const { t } = useTranslation();

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!error && data) {
                setBalance(data);
            }
        } catch (error) {
            console.error('ব্যালেন্স লোডে সমস্যা:', error);
        } finally {
            setLoading(false);
        }
    };

    // Real-time subscription
    useEffect(() => {
        fetchBalance();

        const channel = supabase.channel('wallet_balance')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'wallets'
            }, (payload) => {
                setBalance(payload.new as WalletBalance);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const availableBalance = (balance?.usdt_balance || 0) - (balance?.locked_usdt || 0);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">মোট ব্যালেন্স</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchBalance}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{balance?.usdt_balance?.toFixed(2) || '0.00'} USDT</div>
                    <p className="text-xs text-muted-foreground">
                        ≈ {(balance?.usdt_balance || 0 * 120).toFixed(2)} BDT
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ব্যবহারযোগ্য</CardTitle>
                    <ArrowUpCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {availableBalance.toFixed(2)} USDT
                    </div>
                    <p className="text-xs text-muted-foreground">
                        ট্রেডিং এবং উইথড্রয়ের জন্য
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">লকড</CardTitle>
                    <ArrowDownCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                        {(balance?.locked_usdt || 0).toFixed(2)} USDT
                    </div>
                    <p className="text-xs text-muted-foreground">
                        চলমান অর্ডারে
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">মোট ডিপোজিট</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {(balance?.total_deposited || 0).toFixed(2)} USDT
                    </div>
                    <p className="text-xs text-muted-foreground">
                        সর্বমোট জমা
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}