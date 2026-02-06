'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Copy,
    Check,
    Search,
    RefreshCw,
    Zap,
    ShieldCheck,
    CreditCard,
    QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { ParticleEffect } from '../ui/ParticleEffect';

export function WalletDashboard() {
    const { wallet, activeWallet, generateDepositAddress, verifyDeposit } = useStore();
    const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
    const [network, setNetwork] = useState('TRC20');
    const [txid, setTxid] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showSuccessParticles, setShowSuccessParticles] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<any>(null);

    useEffect(() => {
        generateDepositAddress(network);
    }, [network]);

    const handleCopy = () => {
        if (activeWallet?.usdt_address) {
            navigator.clipboard.writeText(activeWallet.usdt_address);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleVerify = async () => {
        setIsVerifying(true);
        setVerificationStatus(null);
        const result = await verifyDeposit(txid, network);
        setVerificationStatus(result);
        setIsVerifying(false);

        if (result.status === 'SUCCESS') {
            setShowSuccessParticles(true);
            setTimeout(() => setShowSuccessParticles(false), 3000);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 3D Asset Card */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                className="lg:col-span-1"
            >
                <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-black border-slate-800 h-full group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard className="h-48 w-48 -mr-12 -mt-12 rotate-12" />
                    </div>

                    <CardContent className="p-8 space-y-8 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-indigo-400" />
                            </div>
                            <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10">
                                SECURED BY TATUM
                            </Badge>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em]">Total Balance</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">৳{wallet?.balance.toLocaleString()}</span>
                                <span className="text-slate-400 font-medium">BDT</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] text-slate-500 uppercase mb-1">Available</p>
                                <p className="text-lg font-bold">৳{wallet?.balance.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] text-slate-500 uppercase mb-1">Locked</p>
                                <p className="text-lg font-bold">৳{wallet?.locked_balance.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button
                                className={cn(
                                    "w-full h-12 rounded-xl text-md font-bold transition-all",
                                    activeTab === 'DEPOSIT' ? "bg-indigo-600 hover:bg-indigo-500" : "bg-slate-800 hover:bg-slate-700"
                                )}
                                onClick={() => setActiveTab('DEPOSIT')}
                            >
                                <ArrowDownLeft className="h-5 w-5 mr-2" /> Deposit USDT
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full text-slate-400 hover:text-white"
                                onClick={() => setActiveTab('WITHDRAW')}
                            >
                                Withdraw Funds <ArrowUpRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
                </Card>
            </motion.div>

            {/* Action panel (Deposit/Withdraw) */}
            <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'DEPOSIT' ? (
                        <motion.div
                            key="deposit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Deposit Assets</CardTitle>
                                            <CardDescription>Select network and scan QR code to add liquidity</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {['TRC20', 'ERC20', 'BEP20'].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setNetwork(n)}
                                                    className={cn(
                                                        "px-3 py-1 text-xs rounded-full font-bold transition-all",
                                                        network === n ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"
                                                    )}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="flex flex-col md:flex-row gap-8 items-center">
                                        {/* QR Code Section */}
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                            <div className="relative bg-white p-4 rounded-xl shadow-2xl">
                                                {activeWallet?.qr_code_url ? (
                                                    <img src={activeWallet.qr_code_url} alt="Deposit QR" className="h-40 w-40" />
                                                ) : (
                                                    <div className="h-40 w-40 flex items-center justify-center">
                                                        <RefreshCw className="h-8 w-8 text-slate-300 animate-spin" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-xl">
                                                    <QrCode className="h-10 w-10 text-indigo-600" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4 w-full">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Deposit Address</label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        readOnly
                                                        value={activeWallet?.usdt_address || 'Generating...'}
                                                        className="bg-black/40 border-slate-700 font-mono text-sm h-12"
                                                    />
                                                    <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 hover:bg-indigo-500/10" onClick={handleCopy}>
                                                        {isCopied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                                                <Zap className="h-5 w-5 text-amber-500 shrink-0" />
                                                <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                                                    Ensure you are sending only <strong>USDT</strong> via the <strong>{network}</strong> network.
                                                    Tokens sent via other networks will be permanently lost.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Section */}
                                    <div className="pt-8 border-t border-slate-800 space-y-4">
                                        <div>
                                            <h4 className="font-bold flex items-center gap-2">
                                                <Search className="h-4 w-4 text-indigo-400" />
                                                Verify Transaction
                                            </h4>
                                            <p className="text-xs text-slate-500">Enter your TXID after sending to speed up the confirmation process.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter Block Hash or TXID..."
                                                className="bg-black/40 border-slate-700 h-12"
                                                value={txid}
                                                onChange={(e) => setTxid(e.target.value)}
                                            />
                                            <Button
                                                className="h-12 px-8 bg-slate-100 text-black hover:bg-white font-black"
                                                onClick={handleVerify}
                                                disabled={isVerifying || !txid}
                                            >
                                                {isVerifying ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'VERIFY'}
                                            </Button>
                                        </div>

                                        {verificationStatus && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "p-4 rounded-xl border flex items-center justify-between",
                                                    verificationStatus.status === 'SUCCESS' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {verificationStatus.status === 'SUCCESS' ? <ShieldCheck className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                                                    <div>
                                                        <p className="text-sm font-bold uppercase">{verificationStatus.status.replace('_', ' ')}</p>
                                                        {verificationStatus.amount && <p className="text-xs opacity-70">Deposited ৳{verificationStatus.amount.toLocaleString()}</p>}
                                                    </div>
                                                </div>
                                                {verificationStatus.status === 'PENDING_CONFIRMATION' && <Badge variant="outline" className="animate-pulse">Waiting for 12 nodes</Badge>}
                                            </motion.div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="withdraw"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex items-center justify-center p-20 border-2 border-dashed border-slate-800 rounded-3xl"
                        >
                            <div className="text-center space-y-4">
                                <ArrowUpRight className="h-12 w-12 text-slate-700 mx-auto" />
                                <p className="text-slate-500 font-medium font-mono tracking-widest uppercase">Feature Locked</p>
                                <p className="text-xs text-slate-600 max-w-[300px]">Withdrawal portal is currently under maintenance. Estimated uptime: 4 hours.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <ParticleEffect active={showSuccessParticles} />
        </div>
    );
}
