// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
    UserCheck, Clock, Phone, Copy, CheckCircle, AlertCircle,
    Timer, Upload, X, ChevronRight, ShieldCheck,
    RefreshCw, Wallet, ArrowRight, Zap, TrendingUp,
    Star, Trophy, Activity
} from "lucide-react";

interface Agent {
    id: string;
    agent_name: string;
    phone_number: string;
    method: string;
    trust_score: number;
    avg_response_min: number;
    success_rate: number;
    is_online: boolean;
    current_sessions: number;
    max_session_bdt: number;
    daily_remaining: number;
    missed_sessions: number;
    dispute_losses: number;
    total_processed_usdt: number;
    streak_fast_confirmations: number;
    composite_score: number;
    rank_position: number;
}

interface DepositSession {
    id: string;
    session_code: string;
    agent_id: string;
    amount_bdt: number;
    amount_usdt: number;
    exchange_rate: number;
    payment_method: string;
    agent_phone: string;
    agent_name: string;
    status: string;
    created_at: string;
    expires_at: string;
    transaction_id: string | null;
    screenshot_url: string | null;
}

type Step = "amount" | "matching" | "awaiting_payment" | "payment_sent" | "confirming" | "completed" | "expired" | "cancelled";

const MFS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    bkash: { label: "bKash", color: "bg-pink-500", icon: "📱" },
    nagad: { label: "Nagad", color: "bg-orange-500", icon: "💳" },
    rocket: { label: "Rocket", color: "bg-purple-500", icon: "🚀" }
};

export default function SmartAgentMatch() {
    const [step, setStep] = useState<Step>("amount");
    const [amountBdt, setAmountBdt] = useState("");
    const [exchangeRate, setExchangeRate] = useState(119.5);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [session, setSession] = useState<DepositSession | null>(null);
    const [timeLeft, setTimeLeft] = useState(1800);
    const [loading, setLoading] = useState(false);
    const [trxId, setTrxId] = useState("");
    const [senderPhone, setSenderPhone] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotUrl, setScreenshotUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const supabase = createClient();

    const usdtAmount = amountBdt ? (parseFloat(amountBdt) / exchangeRate).toFixed(2) : "0.00";

    useEffect(() => {
        if (!session || session.status === "completed" || session.status === "cancelled" || session.status === "expired") return;
        const expires = new Date(session.expires_at).getTime();
        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((expires - now) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) setStep("expired");
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [session]);

    useEffect(() => {
        if (!session) return;
        const channel = supabase
            .channel("deposit-session-" + session.id)
            .on("postgres_changes", {
                event: "UPDATE", schema: "public", table: "deposit_sessions",
                filter: "id=eq." + session.id
            }, (payload: any) => {
                const newStatus = payload.new.status;
                setSession(prev => prev ? { ...prev, ...payload.new } : null);
                if (newStatus === "completed") {
                    setStep("completed");
                    toast({ title: "সাফল্য", description: "ডিপোজিট নিশ্চিত! আপনার ওযালেটে USDT জমা হয়েছে।" });
                    window.dispatchEvent(new Event("balance-refresh"));
                } else if (newStatus === "rejected") {
                    toast({ title: "বাতিল", description: "ডিপোজিট বাতিল হয়েছে।", variant: "destructive" });
                } else if (newStatus === "confirming") {
                    setStep("confirming");
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [session?.id]);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/agents/match?amount=" + amountBdt);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAgents(data.agents || []);
            setExchangeRate(data.exchangeRate);
            setStep("matching");
        } catch (e: any) {
            toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
        } finally { setLoading(false); }
    };

    const selectAgent = async (agent: Agent) => {
        setLoading(true);
        setSelectedAgent(agent);
        try {
            const res = await fetch("/api/deposit/session", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agent_id: agent.id, amount_bdt: parseFloat(amountBdt),
                    amount_usdt: parseFloat(usdtAmount), exchange_rate: exchangeRate,
                    payment_method: agent.method
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSession(data.session);
            setStep("awaiting_payment");
        } catch (e: any) {
            toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
        } finally { setLoading(false); }
    };

    const submitPayment = async () => {
        if (!trxId.trim()) {
            toast({ title: "TrxID প্রযোজন", description: "দয়া করে আপনার ট্রানজাকশন ID লিখুন", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            let uploadedUrl = screenshotUrl;
            if (screenshot && session) {
                const fileExt = screenshot.name.split(".").pop();
                const filePath = "deposit-screenshots/" + session.session_code + "." + fileExt;
                const { error: uploadError } = await supabase.storage.from("public").upload(filePath, screenshot, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from("public").getPublicUrl(filePath);
                uploadedUrl = urlData.publicUrl;
                setScreenshotUrl(uploadedUrl);
            }
            const res = await fetch("/api/deposit/session", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_code: session?.session_code, transaction_id: trxId,
                    screenshot_url: uploadedUrl, sender_phone: senderPhone, status: "payment_sent"
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSession(data.session);
            setStep("confirming");
            toast({ title: "জমা হয়েছে", description: "এজেন্ট কে জানিয়ে দেয়া হয়েছে। নির্দেশিক সময়ে কনফার্ম করা হবে।" });
        } catch (e: any) {
            toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
        } finally { setLoading(false); }
    };

    const cancelSession = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const res = await fetch("/api/deposit/session", {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_code: session.session_code, status: "cancelled" })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSession(data.session);
            setStep("cancelled");
            toast({ title: "বাতিল", description: "আপনার ডিপোজিট সেশন বাতিল করা হয়েছে।" });
        } catch (e: any) {
            toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
        } finally { setLoading(false); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "কপি হয়ে গেছে", description: text });
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    };

    const getTrustBadge = (score: number) => {
        if (score >= 95) return { label: "ডায়মন্ড", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: Trophy };
        if (score >= 85) return { label: "গোল্ড", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: Star };
        if (score >= 70) return { label: "সিল্ভার", color: "text-sky-400 bg-sky-500/10 border-sky-500/30", icon: ShieldCheck };
        return { label: "ব্রোঞ্জ", color: "text-red-400 bg-red-500/10 border-red-500/30", icon: AlertCircle };
    };

    const getMethodStyle = (method: string) => MFS_LABELS[method] || { label: method?.toUpperCase(), color: "bg-slate-500", icon: "💵" };

    // ========== STEP: amount ==========
    if (step === "amount") {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
                <div className="text-center space-y-2 mb-8">
                    <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto">
                        <UserCheck className="h-8 w-8 text-pink-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">সমায় এজেন্ট ম্যাচ</h2>
                    <p className="text-slate-400 text-sm">
                        AI অ্যালগোরিদম সবচেয়ে ভালো এজেন্ট বাছাই করবে — bKash/Nagad
                    </p>
                </div>
                <div className="space-y-6">
                    <div>
                        <Label className="text-slate-300 mb-2 block">ডিপোজিট পরিমাণ (টাকায়)</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">৳</span>
                            <Input type="number" placeholder="5000" value={amountBdt} onChange={(e) => setAmountBdt(e.target.value)}
                                className="pl-10 bg-slate-950 border-slate-700 text-white text-lg h-14" min={100} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">নিন্নতম ডিপোজিট: ৳100</p>
                    </div>
                    {parseFloat(amountBdt) > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">আপনি পাবেন</span>
                                <span className="text-white font-bold">{usdtAmount} USDT</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-slate-500 text-xs">রেট</span>
                                <span className="text-slate-400 text-xs">৳{exchangeRate.toFixed(2)}/USDT</span>
                            </div>
                        </motion.div>
                    )}
                    <Button onClick={fetchAgents} disabled={!amountBdt || parseFloat(amountBdt) < 100 || loading}
                        className="w-full h-14 bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg">
                        {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><Zap className="h-5 w-5 mr-2" /> এজেন্ট খুঁজুন <ArrowRight className="h-5 w-5 ml-2" /></>}
                    </Button>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <p className="text-slate-400 text-xs leading-relaxed">
                            <strong className="text-slate-300">কিভাবে এজেন্ট বাছাই করা হয়?</strong><br/>
                            1. তাকায় লিখুন → 2. AI অ্যালগোরিদম সবচেয়ে ভালো এজেন্ট খুঁজে দিবে → 3. এজেন্ট সিলেক্ট করুন → 4. bKash/Nagad-এ পাথান → 5. TrxID সাবমিট করুন
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ========== STEP: matching ==========
    if (step === "matching") {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
                <div className="text-center space-y-2 mb-6">
                    <h2 className="text-xl font-bold text-white">সবচেয়ে ভালো ম্যাচিং এজেন্ট</h2>
                    <p className="text-slate-400 text-sm">ট্রাস্ট স্কোর, রিসিভ টাইম, ও লোড ব্যালানস বিবেচনা করে সবচেয়ে ভালো দুটি এজেন্ট বাছাই করা হয়েছে</p>
                </div>

                {agents.length > 0 && (
                    <div className="mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Activity className="h-3 w-3" />
                            <span>এজেন্ট খুঁজার অ্যালগোরিদম: </span>
                            <span className="text-slate-300">ট্রাস্ট স্কোর + রিসিভ টাইম + লোড ব্যালানস + সিটি রেট + নির্বিগাহ ট্রাক রেকর্ড</span>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <AnimatePresence>
                        {agents.map((agent, idx) => {
                            const trust = getTrustBadge(agent.trust_score);
                            const method = getMethodStyle(agent.method);
                            const isBest = idx === 0;
                            return (
                                <motion.div
                                    key={agent.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={isBest
                                        ? "p-4 rounded-xl border-2 cursor-pointer bg-gradient-to-r from-pink-500/5 to-purple-500/5 border-pink-500/50 hover:border-pink-400 transition-all"
                                        : "p-4 rounded-xl border transition-all cursor-pointer bg-slate-950 border-slate-800 hover:border-slate-600"
                                    }
                                    onClick={() => selectAgent(agent)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {isBest && <Star className="h-4 w-4 text-pink-400 fill-pink-400" />}
                                                <h3 className="font-bold text-white">{agent.agent_name || "এজেন্ট"}</h3>
                                                <Badge className={trust.color + " text-[10px] px-1.5 py-0"}>
                                                    <trust.icon className="h-3 w-3 mr-0.5" /> {trust.label}
                                                </Badge>
                                                {isBest && (
                                                    <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-[10px]">
                                                        সবচেয়ে ভালো ম্যাচ
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Trust metrics row */}
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                                                    <TrendingUp className="h-3 w-3" /> ট্রাস্ট {agent.trust_score}%
                                                </div>
                                                <div className="inline-flex items-center gap-1 text-slate-400 text-[10px]">
                                                    <Clock className="h-3 w-3" /> {agent.avg_response_min}মিন
                                                </div>
                                                <div className="inline-flex items-center gap-1 text-slate-400 text-[10px]">
                                                    <Activity className="h-3 w-3" /> সিটি {agent.success_rate?.toFixed(0)}%
                                                </div>
                                                {agent.streak_fast_confirmations > 0 && (
                                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium text-amber-400 bg-amber-500/10 border-amber-500/20">
                                                        <Zap className="h-3 w-3" /> স্ট্রিক {agent.streak_fast_confirmations}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Phone + Method */}
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={method.color + " text-white text-[10px] px-2 py-0.5 rounded font-bold"}>
                                                    {method.icon} {method.label}
                                                </span>
                                                <span className="text-slate-300 text-sm font-mono">{agent.phone_number}</span>
                                            </div>

                                            {/* Extra details for best match */}
                                            {isBest && (
                                                <div className="mt-2 text-[10px] text-slate-500 flex gap-3">
                                                    <span>আজ বাকি: ৳{agent.daily_remaining?.toLocaleString()}</span>
                                                    <span>একটিভাবে: {agent.total_processed_usdt?.toFixed(0)} USDT</span>
                                                    {agent.dispute_losses > 0 && <span className="text-red-400">ডিসপিউট: {agent.dispute_losses}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-500 mt-1 shrink-0" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {agents.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">এখন কোনো এজেন্ট অনলাইন নেই</p>
                        <p className="text-slate-500 text-sm mt-1">কিছুখন পরে আবার চেষ্টা করুন বা এডমিনের সাথে যোগাজোগ করুন।</p>
                    </div>
                )}
                <Button variant="ghost" onClick={() => setStep("amount")} className="mt-4 text-slate-400 hover:text-white">
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" /> পরিমাণ পরিবর্তন করুন
                </Button>
            </div>
        );
    }

    // ========== STEP: awaiting_payment ==========
    if (step === "awaiting_payment" && session) {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-3">
                        <Timer className="h-4 w-4" /> সেশন চলমান — {formatTime(timeLeft)}
                    </div>
                    <h2 className="text-xl font-bold text-white">পেমেন্ট পাঠান</h2>
                    <p className="text-slate-400 text-sm mt-1">নিম্ন নির্দেশনাবলী পাঠান</p>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-700">
                        <p className="text-slate-400 text-sm mb-2">পাঠাতে হবে</p>
                        <div className="flex items-center justify-between">
                            <span className="text-white text-2xl font-bold">৳{session.amount_bdt}</span>
                            <span className="text-slate-400">= {session.amount_usdt?.toFixed(2)} USDT</span>
                        </div>
                    </div>
                    <div className="p-4 bg-pink-500/5 rounded-xl border border-pink-500/20">
                        <p className="text-slate-400 text-sm mb-2">পাঠান</p>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-pink-400" />
                            <span className="text-white font-mono text-lg">{session.agent_phone}</span>
                            <button onClick={() => copyToClipboard(session.agent_phone || "")} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{session.agent_name}</p>
                        <Badge variant="outline" className="mt-2 text-slate-300 border-slate-600">{session.payment_method?.toUpperCase()}</Badge>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                        <div className="p-3 bg-slate-950 rounded-lg border border-amber-500/20">
                            <p className="text-amber-400 text-sm font-medium">সতর্ক ধাপ নির্দেশ নাম্বার যোগ করুন</p>
                            <p className="text-slate-400 text-xs mt-1">
                                bKash/Nagad এ পাঠানের সময় রিফারেন্স/নোট এ "<strong className="text-white">{session.session_code}</strong>" লিখুন।
                            </p>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <p className="text-slate-400 text-xs leading-relaxed space-y-1">
                                <span className="block">1. bKash/Nagad এপ খুলুন</span>
                                <span className="block">2. "Send Money" বা "Cash Out" সিলেক্ট করুন</span>
                                <span className="block">3. এজেন্টের নম্বার দিন → রিফারেন্স যোগ করুন "{session.session_code}"</span>
                                <span className="block">4. নির্দিষ্ট টাকায় পাঠান করুন</span>
                                <span className="block">5. এখানে ট্রানজাকশন ID (TrxID) সাবমিট করুন</span>
                            </p>
                        </div>
                    </div>

                    <Button onClick={() => setStep("payment_sent")} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg">
                        <Wallet className="h-5 w-5 mr-2" /> পেমেন্ট সাফল্য হয়েছে →
                    </Button>
                    <Button variant="ghost" onClick={cancelSession} disabled={loading} className="w-full text-slate-400 hover:text-red-400">
                        <X className="h-4 w-4 mr-2" /> সেশন বাতিল
                    </Button>
                </div>
            </div>
        );
    }

    // ========== STEP: payment_sent ==========
    if (step === "payment_sent" && session) {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
                <h2 className="text-xl font-bold text-white text-center mb-2">পেমেন্ট প্রমাণ সাবমিট করুন</h2>
                <p className="text-center text-slate-400 text-sm mb-6">আপনার ট্রানজাকশন ID সাবমিট করুন যাতে এজেন্ট দ্রুত কনফার্ম করতে পারে</p>
                <div className="space-y-5">
                    <div>
                        <Label className="text-slate-300 mb-2 block">TrxID (bKash/Nagad)</Label>
                        <Input placeholder="যেমন: 9A7B6C5D4E" value={trxId} onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                            className="bg-slate-950 border-slate-700 text-white h-12 font-mono tracking-wider" maxLength={20} />
                        <p className="text-xs text-slate-500 mt-1">bKash/Nagad এপ থেকে ট্রানজাকশন ID কপি পেস্ট করুন</p>
                    </div>
                    <div>
                        <Label className="text-slate-300 mb-2 block">পাঠানকারীর নম্বার (অপশন)</Label>
                        <Input placeholder="017XXXXXXXX" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white h-12" />
                        <p className="text-xs text-slate-500 mt-1">যে নম্বার থেকে পাঠান করেছেন</p>
                    </div>
                    <div>
                        <Label className="text-slate-300 mb-2 block">স্ক্রিনশট (অপশন কিন্তু সুপারিশ)</Label>
                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-slate-500 transition-colors cursor-pointer"
                            onClick={() => document.getElementById("screenshot-upload")?.click()}>
                            <input id="screenshot-upload" type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) setScreenshot(file); }} />
                            {screenshot ? <div className="text-emerald-400 font-medium">{screenshot.name} ✓</div> : <>
                                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">স্ক্রিনশট আপলোড করুন</p>
                                <p className="text-slate-500 text-xs mt-1">PNG, JPG গ্রহণযোগ্য</p>
                            </>}
                        </div>
                    </div>
                    <Button onClick={submitPayment} disabled={!trxId.trim() || loading}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg">
                        {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><CheckCircle className="h-5 w-5 mr-2" /> সাবমিট করুন →</>}
                    </Button>
                    <Button variant="ghost" onClick={() => setStep("awaiting_payment")} className="w-full text-slate-400 hover:text-white">
                        <ArrowRight className="h-4 w-4 mr-2 rotate-180" /> পিছনে যান
                    </Button>
                </div>
            </div>
        );
    }

    // ========== STEP: confirming ==========
    if (step === "confirming" && session) {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">এজেন্টের অপেক্ষা চলমান</h2>
                <p className="text-slate-400 mb-4">
                    {session.agent_name} কে জানিয়ে দেয়া হয়েছে। সাধারণত {Math.round(selectedAgent?.avg_response_min || 3)} মিনিটের মধ্যে কনফার্ম করে।
                </p>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-700 text-left mb-4 space-y-2">
                    <div>
                        <p className="text-slate-400 text-xs">TrxID</p>
                        <p className="text-white font-mono">{session.transaction_id}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">সেশন কোড</p>
                        <p className="text-pink-400 font-mono font-bold">{session.session_code}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">এজেন্ট</p>
                        <p className="text-slate-300">{session.agent_name}</p>
                    </div>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                    <Timer className="h-4 w-4" /> {formatTime(timeLeft)}
                </div>
                <p className="text-slate-500 text-xs mt-4">
                    তাডা সময় শেষ হলে স্বয়ংক্রিয়াভাবে বাতিল হয়ে যাবে।
                </p>
            </div>
        );
    }

    // ========== STEP: completed ==========
    if (step === "completed") {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">ডিপোজিট সাফল!</h2>
                <p className="text-slate-400 mb-2">{session?.amount_usdt?.toFixed(2)} USDT আপনার ওযালেটে জমা হয়েছে।</p>
                <p className="text-slate-500 text-sm mb-6">অপনার বালান্স ডেশবোর্ডে অন্য তালিকায় দেখা যাবে।</p>
                <Button onClick={() => { setStep("amount"); setSession(null); setAmountBdt(""); setTrxId(""); setSenderPhone(""); setScreenshot(null); setScreenshotUrl(""); }}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold">
                    <Wallet className="h-4 w-4 mr-2" /> নতুন ডিপোজিট
                </Button>
            </div>
        );
    }

    // ========== STEP: expired / cancelled ==========
    if (step === "expired" || step === "cancelled") {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl text-center">
                <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-2">
                    {step === "expired" ? "সেশন মেয়াদ শেষ" : "সেশন বাতিল"}
                </h2>
                <p className="text-slate-400 mb-6">
                    {step === "expired"
                        ? "30 মিনিট শেষ হয়েছে। আপনি নতুন সেশন শুরু করতে পারেন।"
                        : "আপনি এই সেশন বাতিল করেছেন।"
                    }
                </p>
                <Button onClick={() => { setStep("amount"); setSession(null); setAmountBdt(""); }}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold">
                    <RefreshCw className="h-4 w-4 mr-2" /> নতুন সেশন শুরু করুন
                </Button>
            </div>
        );
    }

    return null;
}
