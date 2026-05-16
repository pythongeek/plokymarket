import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, TrendingUp, CheckCircle2, Globe, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Binance P2P গাইড - Polymarket Bangladesh',
    description: 'Binance P2P দিয়ে বাংলাদেশ থেকে USDT কিনে প্ল্যাটফর্মে জমা করুন',
};

const STEPS = [
    {
        step: 1,
        title: 'Binance অ্যাকাউন্ট তৈরি করুন',
        description: 'বিশ্বের সবচেয়ে বড় ক্রিপ্টো এক্সচেঞ্জে অ্যাকাউন্ট খুলুন।',
        details: [
            'https://www.binance.com/register -এ যান',
            'ইমেইল বা ফোন নম্বর দিয়ে রেজিস্ট্রেশন করুন',
            'একটি শক্ত পাসওয়ার্ড সেট করুন',
            'ইমেইল বা SMS ভেরিফিকেশন সম্পন্ন করুন',
            'রেফারেল কোড থাকলে এখনই দিন (ফি ছাড় পেতে)',
        ],
        warning: 'বাংলাদেশি ব্যবহারকারীদের জন্য KYC বাধ্যতামূলক। KYC ছাড়া P2P-তে কেনা-বেচা করা যায় না।',
    },
    {
        step: 2,
        title: 'KYC / Identity Verification করুন',
        description: 'বাংলাদেশি NID দিয়ে আপনার অ্যাকাউন্ট ভেরিফাই করুন।',
        details: [
            'Binance অ্যাপ → Profile → Identification',
            'Country: Bangladesh সিলেক্ট করুন',
            'Document Type: "National ID" বাছাই করুন',
            'NID নম্বর, জন্ম তারিখ এবং মেয়াদ লিখুন',
            'NID-এর সামনে ও পেছনের ছবি তুলুন',
            'সেলফি তুলুন (স্পষ্ট, ভালো আলোতে)',
            'ভেরিফিকেশন সাধারণত ১-২ দিনে হয়ে যায়',
        ],
        warning: 'KYC ছাড়া P2P লেনদেন করা যাবে না। প্রথমে KYC সম্পন্ন করুন।',
    },
    {
        step: 3,
        title: 'বিকাশ/নগদ দিয়ে P2P-তে USDT কিনুন',
        description: 'সরাসরি বিকাশ বা নগদ দিয়ে অন্যান্য ব্যবহারকারীর কাছ থেকে USDT কিনুন।',
        details: [
            'Binance অ্যাপ → "Trade" → "P2P"',
            '"Buy" ট্যাবে ট্যাপ করুন',
            '"USDT" সিলেক্ট করুন',
            '"BDT" ফিল্টার করুন',
            '"Payment" অপশনে "bKash" বা "Nagad" বাছাই করুন',
            'এভারেজ প্রাইস দেখে সেরা বিক্রেতা বাছাই করুন',
            'পরিমাণ লিখুন → "Buy USDT" চাপুন',
            'অর্ডার কনফার্ম করুন',
            'বিক্রেতার বিকাশ/নগদ নম্বরে টাকা পাঠান',
            'পেমেন্ট করার পর "Transfer" বা "I have paid" চাপুন',
            'বিক্রেতা USDT রিলিজ করবে — অটোমেটিক আপনার Binance ওয়ালেটে আসবে',
        ],
        warning: 'বিক্রেতার USDT রিলিজ না করা পর্যন্ত "I have paid" চাপবেন না! টাকা পাঠানোর পরে বিক্রেতার সাথে যোগাযোগ রাখুন।',
    },
    {
        step: 4,
        title: 'Binance থেকে প্ল্যাটফর্মে USDT ট্রান্সফার',
        description: 'Binance ওয়ালেট থেকে আমাদের প্ল্যাটফর্মে USDT পাঠান।',
        details: [
            'প্ল্যাটফর্মে → Wallet → Deposit → ক্রিপ্টো ডিপোজিট',
            'নেটওয়ার্ক বাছাই করুন: "BEP-20 (BSC)" সবচেয়ে সস্তা',
            'আপনার ডিপোজিট অ্যাড্রেস ও মেমো কপি করুন',
            'Binance অ্যাপ → Wallet → Spot → "Withdraw"',
            '"USDT" সিলেক্ট করুন',
            '"Network" → "BSC (BEP-20)" সিলেক্ট করুন',
            '"Recipient Address" এ প্ল্যাটফর্মের অ্যাড্রেস পেস্ট করুন',
            '"Memo" ফিল্ডে মেমো কপি করে পেস্ট করুন',
            'পরিমাণ লিখুন → "Withdraw" চাপুন',
            '৩-১০ মিনিটে USDT প্ল্যাটফর্মে ক্রেডিট হবে',
        ],
        warning: 'BEP-20 নেটওয়ার্ক ব্যবহার করুন! TRC-20 বা ERC-20 ব্যবহার করলে প্ল্যাটফর্মে আসবে না। মেমো অবশ্যই দিতে হবে, নাহলে ক্রেডিট হবে না।',
    },
];

export default function BinanceGuidePage() {
    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back */}
                <Link
                    href="/wallet/deposit/guides"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft size={16} />
                    গাইড তালিকায় ফিরে যান
                </Link>

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto">
                        <TrendingUp className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        Binance P2P গাইড
                    </h1>
                    <p className="text-slate-400 text-sm">
                        বিশ্বের সবচেয়ে বড় ক্রিপ্টো এক্সচেঞ্জ Binance-এ P2P দিয়ে USDT কিনে আমাদের প্ল্যাটফর্মে জমা করুন
                    </p>
                    <div className="inline-flex items-center gap-2 bg-slate-900/80 rounded-full px-4 py-2 border border-slate-700 text-sm">
                        <span className="text-slate-400">নেটওয়ার্ক ফি:</span>
                        <span className="text-green-400 font-medium">৳০.৫০ - ৳১.০০ (BEP-20)</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    {STEPS.map((s) => (
                        <div key={s.step} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 text-sm font-bold shrink-0">
                                    {s.step}
                                </div>
                                <h3 className="font-bold text-white text-base">{s.title}</h3>
                            </div>
                            <p className="text-slate-400 text-sm mb-3">{s.description}</p>
                            <div className="space-y-1.5">
                                {s.details.map((d, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                                        <span>{d}</span>
                                    </div>
                                ))}
                            </div>
                            {s.warning && (
                                <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                    <span className="text-xs text-amber-300">{s.warning}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Comparison with P2P Escrow on platform */}
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5 space-y-3">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        অথবা — আমাদের P2P এসক্রো দিয়ে USDT কিনুন
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                        আমাদের প্ল্যাটফর্মে সরাসরি P2P এসক্রো আছে। Binance-এর মতো বিকাশ/নগদ দিয়ে USDT কিনুন, কিন্তু লেনদেন প্ল্যাটফর্মের এসক্রোতে সুরক্ষিত থাকবে। কোনো বিদেশি এক্সচেঞ্জ ছাড়াই সব কাজ এক জায়গায় হবে।
                    </p>
                    <Link
                        href="/wallet/deposit/p2p"
                        className="inline-flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                        P2P এসক্রোতে কিনুন
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Referral Banner */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <Globe className="h-5 w-5 text-yellow-400" />
                        <h3 className="font-semibold text-white text-sm">বিশেস অফার: Binance রেফারেল লিংক</h3>
                    </div>
                    <p className="text-slate-400 text-xs mb-3">
                        আমাদের রেফারেল লিংক দিয়ে Binance-এ রেজিস্ট্রেশন করলে ট্রেডিং ফি-তে ছাড় পাবেন।
                    </p>
                    <a
                        href="https://www.binance.com/register?ref=F3LJQV8K"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                        Binance রেজিস্ট্রেশন (রেফারেল সহ)
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>

                {/* Next Steps */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                    <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        পরবর্তী ধাপ
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Link
                            href="/wallet/deposit"
                            className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl transition-all"
                        >
                            <TrendingUp className="h-5 w-5 text-blue-400" />
                            <div>
                                <p className="text-white text-sm font-medium">ডিপোজিট করুন</p>
                                <p className="text-slate-500 text-xs">USDT জমান</p>
                            </div>
                        </Link>
                        <Link
                            href="/markets"
                            className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl transition-all"
                        >
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <div>
                                <p className="text-white text-sm font-medium">বাজার দেখুন</p>
                                <p className="text-slate-500 text-xs">ট্রেডিং শুরু</p>
                            </div>
                        </Link>
                        <Link
                            href="/wallet/deposit/guides"
                            className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl transition-all"
                        >
                            <TrendingUp className="h-5 w-5 text-orange-400" />
                            <div>
                                <p className="text-white text-sm font-medium">আরো গাইড</p>
                                <p className="text-slate-500 text-xs">সব দেখুন</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Safety */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-400 text-xs mb-1">গুরুত্বপূর্ণ নিরাপত্তা সতর্কতা</h4>
                        <p className="text-xs text-slate-400 leading-relaxed space-y-1">
                            <span className="block">• সবসময় BEP-20 নেটওয়ার্ক ব্যবহার করুন — ERC-20 অনেক বেশি ফি নেয়</span>
                            <span className="block">• মেমো/পার্সোনাল ট্যাগ অবশ্যই দিতে হবে, নাহলে USDT ক্রেডিট হবে না</span>
                            <span className="block">• P2P-তে কখনো "পেমেন্ট না করে" USDT ক্লেম করবেন না — বিক্রেতার বিরুদ্ধে রিপোর্ট হবে</span>
                            <span className="block">• Binance ছাড়াও আমাদের প্ল্যাটফর্মে সরাসরি P2P এসক্রো ব্যবহার করতে পারেন</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}