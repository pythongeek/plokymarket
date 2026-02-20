'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'trade' | 'bonus';
    amount_usdt: number;
    amount_bdt?: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    created_at: string;
    reference?: string;
}

export function TransactionHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchTransactions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get deposits
            const { data: deposits } = await supabase
                .from('deposit_requests')
                .select('id, amount_usdt, amount_bdt, status, created_at, txn_id as reference')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            // Get withdrawals
            const { data: withdrawals } = await supabase
                .from('withdrawal_requests')
                .select('id, amount_usdt, amount_bdt, status, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            // Combine and format
            const allTransactions = [
                ...(deposits?.map(d => ({
                    ...d,
                    type: 'deposit' as const,
                    reference: `TXN: ${d.reference}`
                })) || []),
                ...(withdrawals?.map(w => ({
                    ...w,
                    type: 'withdrawal' as const,
                    reference: 'Withdrawal'
                })) || [])
            ].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setTransactions(allTransactions);
        } catch (error) {
            console.error('ট্রানজেকশন লোডে সমস্যা:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'deposit':
                return 'ডিপোজিট';
            case 'withdrawal':
                return 'উইথড্রয়াল';
            default:
                return type;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-bold">লেনদেন ইতিহাস</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">সব</TabsTrigger>
                        <TabsTrigger value="deposit">ডিপোজিট</TabsTrigger>
                        <TabsTrigger value="withdrawal">উইথড্রয়াল</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4">
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{getTypeLabel(tx.type)}</span>
                                            <Badge className={getStatusColor(tx.status)}>
                                                {tx.status === 'pending' ? 'অপেক্ষমাণ' :
                                                    tx.status === 'approved' ? 'অনুমোদিত' :
                                                        tx.status === 'rejected' ? 'বাতিল' : 'সম্পন্ন'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(tx.created_at), 'PPpp', { locale: bn })}
                                        </p>
                                        {tx.reference && (
                                            <p className="text-xs text-muted-foreground">
                                                রেফারেন্স: {tx.reference}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{tx.amount_usdt.toFixed(2)} USDT</p>
                                        {tx.amount_bdt && (
                                            <p className="text-xs text-muted-foreground">
                                                ≈ {tx.amount_bdt.toFixed(2)} BDT
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">
                                    কোনো লেনদেন পাওয়া যায়নি
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="deposit" className="mt-4">
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {transactions.filter(tx => tx.type === 'deposit').map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">ডিপোজিট</span>
                                            <Badge className={getStatusColor(tx.status)}>
                                                {tx.status === 'pending' ? 'অপেক্ষমাণ' : 'অনুমোদিত'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(tx.created_at), 'PPpp', { locale: bn })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">+{tx.amount_usdt.toFixed(2)} USDT</p>
                                    </div>
                                </div>
                            ))}
                            {transactions.filter(tx => tx.type === 'deposit').length === 0 && (
                                <p className="text-center text-muted-foreground py-8">
                                    কোনো ডিপোজিট পাওয়া যায়নি
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="withdrawal" className="mt-4">
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {transactions.filter(tx => tx.type === 'withdrawal').map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">উইথড্রয়াল</span>
                                            <Badge className={getStatusColor(tx.status)}>
                                                {tx.status === 'pending' ? 'অপেক্ষমাণ' :
                                                    tx.status === 'approved' ? 'প্রসেসিং' : 'সম্পন্ন'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(tx.created_at), 'PPpp', { locale: bn })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">-{tx.amount_usdt.toFixed(2)} USDT</p>
                                    </div>
                                </div>
                            ))}
                            {transactions.filter(tx => tx.type === 'withdrawal').length === 0 && (
                                <p className="text-center text-muted-foreground py-8">
                                    কোনো উইথড্রয়াল পাওয়া যায়নি
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}