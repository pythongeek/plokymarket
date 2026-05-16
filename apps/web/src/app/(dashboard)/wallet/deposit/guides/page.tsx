import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, BookOpen, ChevronRight, CheckCircle2, Smartphone, Wallet, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'ডিপোজিট গাইড - Polymarket Bangladesh',
    description: 'নতুন ব্যবহারকারীদের জন্য ক্রিপ্টো ওয়ালেট সেটআপ গাইড',
};

export default function DepositGuidesPage() {
    return (
        <div className="min-h-screen py-8 px-4 space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back */}
                <Link
                    href="/wallet/deposit"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft size={16} />
                    ডিপোজিট হাবে ফিরে যান
                </Link>

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
                        <BookOpen className="h-8 w-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        ডিপোজিট গাইড ও নির্দেশিকা
                    </h1>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                        বাংলাদেশে ক্রিপ্টো কিনতে এবং USDT জমা করতে স্টেপ-বাই-স্টেপ গাইড। বিনামূল্যে এবং সহজ।
                    </p>
                </div>

                {/* Guide Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Bitget Wallet Guide */}
                    <div className="bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/20 rounded-2xl p-6 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <Wallet className="h-6 w-6 text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-white">Bitget Wallet গাইড</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                        জনপ্রিয়
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">Bitget Wallet</p>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed">
                            Bitget Wallet বাংলাদেশে সবচেয়ে সহজ ক্রিপ্টো ওয়ালেট। P2P-তে বিকাশ/নগদ দিয়ে USDT কিনুন, তারপর আমাদের প্ল্যাটফর্মে জমা করুন।
                        </p>

                        <div className="bg-slate-900/60 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                ডাউনলোড ও সেটআপ (ফ্রি)
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                KYC সম্পন্ন করুন (প্রয়োজন)
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                P2P-তে USDT কিনুন
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                প্ল্যাটফর্মে জমা করুন
                            </div>
                        </div>

                        <Link
                            href="/wallet/deposit/bitget"
                            className="inline-flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full justify-center"
                        >
                            <BookOpen className="h-4 w-4" />
                            সম্পূর্ণ গাইড দেখুন
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {/* Binance P2P Guide */}
                    <div className="bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/20 rounded-2xl p-6 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingUp className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-white">Binance P2P গাইড</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                        বিশ্বস্ত
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">Binance P2P</p>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed">
                            বিশ্বের সবচেয়ে বড় ক্রিপ্টো এক্সচেঞ্জ Binance। P2P-তে বিকাশ/নগদ দিয়ে সরাসরি USDT কিনুন। এরপর Method 3 (ক্রিপ্টো ডিপোজিট) দিয়ে জমা করুন।
                        </p>

                        <div className="bg-slate-900/60 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                Binance অ্যাকাউন্ট তৈরি
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                KYC ভেরিফিকেশন
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                P2P-তে USDT কেনা
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                                প্ল্যাটফর্মে ট্রান্সফার
                            </div>
                        </div>

                        <Link
                            href="/wallet/deposit/binance"
                            className="inline-flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full justify-center"
                        >
                            <BookOpen className="h-4 w-4" />
                            সম্পূর্ণ গাইড দেখুন
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Telegram Mini App Info */}
                <div className="bg-gradient-to-br from-sky-500/5 to-transparent border border-sky-500/20 rounded-2xl p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center shrink-0">
                            <Smartphone className="h-6 w-6 text-sky-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-1">টেলিগ্রাম মিনি অ্যাপ</h3>
                            <p className="text-xs text-slate-500">Telegram Mini App • Phase 2</p>
                        </div>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                            শীঘ্রই আসছে
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        টেলিগ্রাম বটের মাধ্যমে সরাসরি ডিপোজিট করুন। @PolymarketBD_bot খুলুন, মিনি অ্যাপ লোড করুন, এবং নেটিভ TON ওয়ালেট পেমেন্ট দিয়ে USDT জমা করুন। চ্যাট থেকেই সব কাজ হবে।
                    </p>
                    <div className="bg-slate-900/60 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                            টেলিগ্রাম বট খুলুন
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                            মিনি অ্যাপ লোড করুন
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                            TON ওয়ালেট দিয়ে পেমেন্ট
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                            অটো-ক্রেডিট পান
                        </div>
                    </div>
                </div>

                {/* Safety notice */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-400 text-sm mb-1">নিরাপত্তা সতর্কতা</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            সবসময় অফিসিয়াল লিংক ব্যবহার করুন। কখনোই কারো সাথে আপনার সিক্রেট কী বা পাসওয়ার্ড শেয়ার করবেন না। প্ল্যাটফর্ম কখনো আপনার কাছে সরাসরি USDT চাইবে না। সমস্যায় support@polymarketbd.com-এ মেইল করুন।
                        </p>
                    </div>
                </div>

                {/* Next step CTA */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-center">
                    <p className="text-slate-400 text-sm mb-3">USDT কিনে জমা করার পর, আপনি ট্রেডিং শুরু করতে পারবেন!</p>
                    <Link
                        href="/markets"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                    >
                        বাজার দেখুন
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}