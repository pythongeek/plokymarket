'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Plus, Smartphone, CreditCard, User } from 'lucide-react';

interface AgentWallet {
    id: string;
    method: 'bkash' | 'nagad';
    wallet_type: 'send_money' | 'cashout' | 'payment';
    phone_number: string;
    account_name: string;
    is_active: boolean;
}

export default function AgentWalletManager() {
    const [wallets, setWallets] = useState<AgentWallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [newWallet, setNewWallet] = useState({
        method: 'bkash' as const,
        wallet_type: 'send_money' as const,
        phone_number: '',
        account_name: ''
    });

    const supabase = createClient();

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        const { data, error } = await supabase
            .from('agent_wallets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast({ title: 'Error', description: 'Failed to load wallets', variant: 'destructive' });
        } else {
            setWallets(data || []);
        }
        setLoading(false);
    };

    const handleAddWallet = async () => {
        if (!newWallet.phone_number || !newWallet.account_name) {
            toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('agent_wallets')
                .insert([newWallet])
                .select()
                .single();

            if (error) throw error;
            setWallets([data, ...wallets]);
            setNewWallet({ ...newWallet, phone_number: '', account_name: '' });
            toast({ title: 'Success', description: 'Wallet added' });
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to add wallet', variant: 'destructive' });
        }
    };

    const handleDeleteWallet = async (id: string) => {
        try {
            const { error } = await supabase.from('agent_wallets').delete().eq('id', id);
            if (error) throw error;
            setWallets(wallets.filter(w => w.id !== id));
            toast({ title: 'Success', description: 'Wallet deleted' });
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to delete wallet', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        নতুন এজেন্ট ওয়ালেট যুক্ত করুন
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2">
                        <Label className="text-slate-400">পরিশোধ পদ্ধতি</Label>
                        <Select
                            value={newWallet.method}
                            onValueChange={(v: any) => setNewWallet({ ...newWallet, method: v })}
                        >
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bkash">bKash</SelectItem>
                                <SelectItem value="nagad">Nagad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-400">ধরণ</Label>
                        <Select
                            value={newWallet.wallet_type}
                            onValueChange={(v: any) => setNewWallet({ ...newWallet, wallet_type: v })}
                        >
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="send_money">Send Money</SelectItem>
                                <SelectItem value="cashout">Cash Out</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-400">ফোন নম্বর</Label>
                        <Input
                            value={newWallet.phone_number}
                            onChange={(e) => setNewWallet({ ...newWallet, phone_number: e.target.value })}
                            placeholder="01XXXXXXXXX"
                            className="bg-slate-950 border-slate-800 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-400">অ্যাকাউন্ট নাম</Label>
                        <Input
                            value={newWallet.account_name}
                            onChange={(e) => setNewWallet({ ...newWallet, account_name: e.target.value })}
                            placeholder="Full Name"
                            className="bg-slate-950 border-slate-800 text-white"
                        />
                    </div>

                    <Button onClick={handleAddWallet} className="bg-primary hover:bg-primary/90 text-slate-950 font-bold">
                        Add Wallet
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wallets.map((wallet) => (
                    <Card key={wallet.id} className="bg-slate-900 border-slate-800 group relative">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <Badge className={wallet.method === 'bkash' ? 'bg-pink-500/10 text-pink-500' : 'bg-orange-500/10 text-orange-500'}>
                                    {wallet.method.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-800">
                                    {wallet.wallet_type.toUpperCase().replace('_', ' ')}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-white font-mono text-lg">
                                    <Smartphone className="w-4 h-4 text-slate-400" />
                                    {wallet.phone_number}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <User className="w-4 h-4" />
                                    {wallet.account_name}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteWallet(wallet.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-500"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
