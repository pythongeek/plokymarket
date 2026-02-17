'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Clock, Phone, FileText, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import confetti from 'canvas-confetti';

interface AgentWallet {
    id: string;
    wallet_type: string;
    phone_number: string;
    account_name: string;
    qr_code_url: string;
}

export default function ManualAgentDeposit({
    method,
    amount
}: {
    method: 'bkash' | 'nagad';
    amount: number
}) {
    const [wallets, setWallets] = useState<AgentWallet[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<AgentWallet | null>(null);
    const [formData, setFormData] = useState({
        userPhone: '',
        transactionId: '',
        screenshot: null as File | null
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
    const [depositId, setDepositId] = useState<string | null>(null);
    const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'rejected'>('pending');

    const supabase = createClient();

    useEffect(() => {
        fetchWallets();
        fetchProcessingTime();
    }, [method]);

    useEffect(() => {
        if (submitted && timeLeft > 0 && status !== 'completed') {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [submitted, timeLeft, status]);

    useEffect(() => {
        if (!depositId) return;

        const channel = supabase
            .channel(`deposit-${depositId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'manual_deposits',
                    filter: `id=eq.${depositId}`
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    setStatus(newStatus);
                    if (newStatus === 'completed') {
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#22c55e', '#3b82f6', '#eab308']
                        });
                        toast({ title: 'Success', description: 'আপনার ডিপোজিট সফলভাবে সম্পন্ন হয়েছে!' });
                        // Trigger balance refresh (can be done via global state or event)
                        window.dispatchEvent(new Event('balance-refresh'));
                    } else if (newStatus === 'rejected') {
                        toast({ title: 'Rejected', description: 'আপনার ডিপোজিট রিকোয়েস্টটি বাতিল করা হয়েছে।', variant: 'destructive' });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [depositId]);

    const fetchWallets = async () => {
        const { data } = await supabase
            .from('agent_wallets')
            .select('*')
            .eq('method', method)
            .eq('is_active', true);
        if (data) setWallets(data);
    };

    const fetchProcessingTime = async () => {
        const { data } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'deposit_modes')
            .single();
        if (data?.value?.agent_processing_time_minutes) {
            setTimeLeft(data.value.agent_processing_time_minutes * 60);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (!formData.userPhone || !formData.transactionId) {
            toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
            return;
        }

        setSubmitting(true);

        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 2. Upload screenshot if exists
            let screenshotUrl = '';
            if (formData.screenshot) {
                const fileExt = formData.screenshot.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('deposit-screenshots')
                    .upload(fileName, formData.screenshot);

                if (uploadError) throw uploadError;
                if (uploadData) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('deposit-screenshots')
                        .getPublicUrl(uploadData.path);
                    screenshotUrl = publicUrl;
                }
            }

            // 3. Create deposit request
            const { data: deposit, error: depositError } = await supabase
                .from('manual_deposits')
                .insert({
                    user_id: user.id,
                    method,
                    amount_bdt: amount,
                    agent_wallet_id: selectedWallet?.id,
                    user_phone_number: formData.userPhone,
                    transaction_id: formData.transactionId,
                    screenshot_url: screenshotUrl,
                    status: 'pending'
                })
                .select()
                .single();

            if (depositError) throw depositError;

            if (deposit) {
                // 4. Trigger n8n notification (Admin)
                await fetch('/api/notify-agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deposit_id: deposit.id,
                        amount,
                        method,
                        user_phone: formData.userPhone,
                        user_id: user.id
                    })
                });

                setDepositId(deposit.id);
                setSubmitted(true);
                toast({ title: 'Success', description: 'আপনার অনুরোধ গৃহীত হয়েছে' });
            }
        } catch (err: any) {
            console.error('Submit error:', err);
            toast({
                title: 'Error',
                description: err.message || 'ডেটা সাবমিট করতে সমস্যা হয়েছে',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-green-500/10 border-2 border-green-500/20 rounded-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <CheckCircle className="text-white w-10 h-10" />
                </motion.div>

                <h3 className="text-2xl font-bold text-white mb-2">
                    {status === 'completed' ? 'ডিপোজিট সফল!' : status === 'rejected' ? 'রিকোয়েস্ট বাতিল' : 'অনুরোধ গৃহীত!'}
                </h3>
                <p className="text-slate-400 mb-6 font-bangla">
                    {status === 'completed'
                        ? 'আপনার ওয়ালেটে ব্যালেন্স যোগ করা হয়েছে।'
                        : status === 'rejected'
                            ? 'বিস্তারিত জানতে সাপোর্টে কথা বলুন।'
                            : 'আমাদের এজেন্ট আপনার পেমেন্ট যাচাই করছে'}
                </p>

                {status === 'pending' && (
                    <div className="bg-slate-950/50 rounded-xl p-6 max-w-sm mx-auto border border-green-500/20">
                        <div className="flex items-center justify-center gap-2 text-orange-500 mb-2">
                            <Clock size={24} />
                            <span className="text-3xl font-bold font-mono">{formatTime(timeLeft)}</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            {timeLeft > 0 ? 'এই সময়ের মধ্যে USDT পাঠানো হবে' : 'প্রসেসিং সময় শেষ, দয়া করে সাপোর্টে যোগাযোগ করুন'}
                        </p>
                    </div>
                )}

                <div className="mt-6 text-sm text-slate-500 space-y-1">
                    <p>ট্রানজাকশন ID: <span className="text-slate-300">{formData.transactionId}</span></p>
                    <p>আপডেটের জন্য নোটিফিকেশন চেক করুন</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Current Rate Display */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-lg font-semibold mb-2 opacity-90">বর্তমান USDT রেট</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">৳{122.50}</span>
                    <span className="text-blue-200">প্রতি USDT</span>
                </div>
                <div className="mt-4 p-3 bg-white/10 rounded-lg flex justify-between items-center text-sm">
                    <span>আপনি পাবেন:</span>
                    <span className="font-bold text-lg">{(amount / 122.5).toFixed(2)} USDT</span>
                </div>
            </div>

            {!selectedWallet ? (
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-white">কোন নম্বরে পেমেন্ট করবেন?</h3>
                    <div className="grid gap-3">
                        {wallets.length > 0 ? wallets.map((wallet) => (
                            <button
                                key={wallet.id}
                                onClick={() => setSelectedWallet(wallet)}
                                className="group flex items-center justify-between p-4 border border-slate-800 rounded-xl hover:border-blue-500 transition bg-slate-900 shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${method === 'bkash' ? 'bg-pink-500/20 text-pink-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                        {method === 'bkash' ? 'bK' : 'N'}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-lg text-white font-mono">{wallet.phone_number}</p>
                                        <p className="text-sm text-slate-400">{wallet.account_name}</p>
                                        <span className="inline-block mt-1 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                            {wallet.wallet_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <Copy className="text-slate-600 group-hover:text-blue-500 transition" size={20} />
                            </button>
                        )) : (
                            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                                <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
                                <p>কোন একটিভ এজেন্ট নম্বর পাওয়া যায়নি</p>
                                <p className="text-xs">অনগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-2xl">
                        <p className="font-bold text-blue-400 mb-2">নির্বাচিত নম্বর:</p>
                        <div className="flex items-center justify-between bg-slate-950 rounded-xl p-4 border border-slate-800">
                            <span className="text-2xl font-bold text-white font-mono tracking-wider">{selectedWallet.phone_number}</span>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedWallet.phone_number);
                                    toast({ title: 'Copied', description: 'Phone number copied to clipboard' });
                                }}
                                className="text-blue-500 hover:text-blue-400 font-bold"
                            >
                                কপি
                            </Button>
                        </div>
                        <div className="mt-4 flex items-start gap-2 text-sm text-slate-400">
                            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                            <p>
                                {selectedWallet.wallet_type === 'send_money' ? 'বিকাশ নম্বর থেকে এই নম্বরে "Send Money" করুন।' : 'বিকাশ নম্বর থেকে এই নম্বরে "Cash Out" করুন।'}
                                অবশ্যই সঠিক TrxID এবং ফোন নম্বর দিন।
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5 bg-slate-900 p-6 rounded-2xl border border-slate-800">
                        <div className="space-y-2">
                            <Label className="text-slate-400">আপনার {method === 'bkash' ? 'বিকাশ' : 'নগদ'} নম্বর</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-slate-600" size={20} />
                                <Input
                                    type="tel"
                                    placeholder="01XXXXXXXXX"
                                    className="pl-10 h-12 bg-slate-950 border-slate-800 text-white focus:ring-blue-500"
                                    value={formData.userPhone}
                                    onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-400">Transaction ID (TrxID)</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-slate-600" size={20} />
                                <Input
                                    type="text"
                                    placeholder="8A9B2C3D"
                                    className="pl-10 h-12 bg-slate-950 border-slate-800 text-white font-mono uppercase focus:ring-blue-500"
                                    value={formData.transactionId}
                                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">SMS এ যে TrxID পেয়েছেন তা লিখুন</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-400">পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)</Label>
                            <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center hover:border-blue-500/50 transition cursor-pointer bg-slate-950/50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, screenshot: e.target.files?.[0] || null })}
                                    className="hidden"
                                    id="screenshot"
                                />
                                <label htmlFor="screenshot" className="cursor-pointer space-y-2">
                                    {formData.screenshot ? (
                                        <div className="text-green-500 font-bold flex flex-col items-center">
                                            <CheckCircle size={32} className="mb-2" />
                                            <span className="text-sm">{formData.screenshot.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">
                                            <Upload className="mx-auto mb-2 opacity-50" size={40} />
                                            <p className="font-bold">ক্লিক করে স্ক্রিনশট আপলোড করুন</p>
                                            <p className="text-xs opacity-60">(বিকাশ/নগদ কনফার্মেশন স্ক্রিন)</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={!formData.userPhone || !formData.transactionId || submitting}
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-slate-950 font-black text-xl shadow-lg disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Clock className="mr-2 animate-spin" />
                                    প্রসেসিং...
                                </>
                            ) : 'কনফার্ম করুন'}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => setSelectedWallet(null)}
                            className="w-full text-slate-500 hover:text-white"
                        >
                            ← অন্য নম্বরে পেমেন্ট করতে চাই
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
