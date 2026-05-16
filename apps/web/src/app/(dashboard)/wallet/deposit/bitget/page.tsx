import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Wallet, CheckCircle2, Smartphone, Globe, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Bitget Wallet গাইড - Polymarket Bangladesh',
    description: 'Bitget Wallet দিয়ে বাংলাদেশ থেকে USDT কিনে প্ল্যাটফর্মে জমা করুন',
};

const STEPS = [
    {
        step: 1,
        title: 'Bitget Wallet অ্যাপ ডাউনলোড করুন',
        description: 'আপনার ফোনে Bitget Wallet ইনস্টল করুন। Android ও iOS দুটোতেই চলে।',
        details: [
            'Android: Google Play Store-এ "Bitget Wallet" সার্চ করুন',
            'iOS: App Store-এ "Bitget Wallet" সার্চ করুন',
            'অফিসিয়াল ওয়েবসাইট: wallet.bitget.com',
            '⚠️ শুধু অফিসিয়াল সোর্স থেকে ডাউনলোড করুন',
        ],
        warning: 'ফোনে Bitget Wallet ডাউনলোড করুন — কম্পিউটারে ওয়েব ভার্সনও আছে তবে মোবাইল সহজ।',
    },
    {
        step: 2,
        title: 'অ্যাকাউন্ট তৈরি করুন',
        description: 'অ্যাপ খুলুন, "Create Wallet" বাটনে ট্যাপ করুন এবং একটি নতুন ওয়ালেট তৈরি করুন।',
        details: [
            '"Create Wallet" → "Create" বাটনে ট্যাপ করুন',
            'একটি সুরক্ষিত পাসওয়ার্ড সেট করুন (৮+ অক্ষর)',
            'রিকভারি ফ্রেজ (১২-বা-২৪ শব্দ) সংরক্ষণ করুন — এটি আপনার সম্পদ পুনরুদ্ধারের একমাত্র উপায়',
            'রিকভারি ফ্রেজ কখনোই কারো সাথে শেয়ার করবেন না',
        ],
        warning: 'রিকভারি ফ্রেজটি কাগজে লিখে নিরাপদ জায়গায় রাখুন। অনলাইনে সংরক্ষণ করবেন না!',
    },
    {
        step: 3,
        title: 'KYC / identity verification সম্পন্ন করুন',
        description: 'বাংলাদেশি ব্যবহারকারীদের জন্য KYC বাধ্যতামূলক। এটি করলে লেনদেন সীমা বাড়বে।',
        details: [
            'Bitget Wallet → Profile → Identity Verification',
            'Country: Bangladesh সিলেক্ট করুন',
            'NID (National ID) নম্বর দিন',
            'সেলফি ও NID-এর ছবি তুলুন',
            'সাধারণত ২-৪ ঘণ্টায় অনুমোদন হয়',
        ],
        warning: 'KYC ছাড়া P2P-তে USDT কেনা সম্ভব নয়। প্রথমে KYC করুন।',
    },
    {
        step: 4,
        title: 'P2P-তে USDT কিনুন',
        description: 'বিকাশ বা নগদ দিয়ে সরাসরি USDT কিনুন। কোনো ব্যাংক একাউন্ট লাগবে না!',
        details: [
            'Bitget Wallet → "P2P Trade" ট্যাবে যান',
            '"Buy" সিলেক্ট করুন',
            'Amount: কত USDT চান লিখুন',
            'Payment Method: "bKash" বা "Nagad" সিলেক্ট করুন',
            'বিক্রেতার রেটিং ও প্রাইস দেখে সেরা অফার বাছাই করুন',
            '"Buy Now" চাপুন',
            'বিক্রেতার বিকাশ/নগদ নম্বরে টাকা পাঠান',
            'বিক্রেতা আপনাকে USDT পাঠাবে — অটোমেটিক ওয়ালেটে আসবে',
        ],
        warning: 'পেমেন্ট করার পর সবসময় "I have paid" বাটন চাপুন। বিক্রেতার কাছে USDT ছাড় হবে না যতক্ষণ না আপনি কনফার্ম করেন।',
    },
    {
        step: 5,
        title: 'প্ল্যাটফর্মে USDT জমা করুন',
        description: 'Bitget Wallet থেকে আমাদের প্ল্যাটফর্মে USDT ট্রান্সফার করুন।',
        details: [
            'প্ল্যাটফর্মে → Wallet → Deposit → ক্রিপ্টো ডিপোজিট',
            'নেটওয়ার্ক বাছাই করুন: BEP-20 (BSC) সবচেয়ে সস্তা',
            'আপনার ডিপোজিট অ্যাড্রেস ও মেমো কপি করুন',
            'Bitget Wallet → "Transfer" → "Withdraw"',
            'Recipient Address-এ প্ল্যাটফর্মের অ্যাড্রেস পেস্ট করুন',
            'Network: BSC (BEP-20) সিলেক্ট করুন',
            'Memo/Password কপি করে "Password/Memo" ফিল্ডে পেস্ট করুন',
            'পরিমাণ দিন → "Withdraw" চাপুন',
            '৩-৫ মিনিটে USDT প্ল্যাটফর্মে ক্রেডিট হবে',
        ],
        warning: 'সঠিক নেটওয়ার্ক বাছাই করুন! ভুল নেটওয়ার্কে পাঠালে USDT হারাবেন। BEP-20 (BSC) দিয়ে পাঠালে ৳০.৫০-৳১ ফি।',
    },
];

export default function BitgetGuidePage() {
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
                    <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
                        <Wallet className="h-8 w-8 text-orange-400" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        Bitget Wallet গাইড
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Bitget Wallet দিয়ে বাংলাদেশ থেকে USDT কিনে আমাদের প্ল্যাটফর্মে জমা করুন
                    </p>
                    <div className="inline-flex items-center gap-2 bg-slate-900/80 rounded-full px-4 py-2 border border-slate-700 text-sm">
                        <span className="text-slate-400">মোট খরচ:</span>
                        <span className="text-green-400 font-medium">৳০ ব্যবহার ফি + নেটওয়ার্ক ফি</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    {STEPS.map((s) => (
                        <div key={s.step} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 text-sm font-bold shrink-0">
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

                {/* Referral Banner */}
                <div className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <Globe className="h-5 w-5 text-orange-400" />
                        <h3 className="font-semibold text-white text-sm">রেফারেল লিংক ব্যবহার করে ক্যাশব্যাক পান</h3>
                    </div>
                    <p className="text-slate-400 text-xs mb-3">
                        Bitget-এ রেফারেল লিংক দিয়ে রেজিস্ট্রেশন করলে ট্রেডিং ফি-তে ক্যাশব্যাক পাবেন।
                    </p>
                    <a
                        href="https://bitgetwallet.onelink.me/BfN7/xc8h0q9m"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                        Bitget Wallet ডাউনলোড করুন
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>

                {/* Next Steps */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                    <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        পরবর্তী ধাপ
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link
                            href="/wallet/deposit"
                            className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl transition-all"
                        >
                            <Wallet className="h-5 w-5 text-blue-400" />
                            <div>
                                <p className="text-white text-sm font-medium">ডিপোজিট করুন</p>
                                <p className="text-slate-500 text-xs">ক্রিপ্টো জমান</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-600 ml-auto" />
                        </Link>
                        <Link
                            href="/markets"
                            className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl transition-all"
                        >
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <div>
                                <p className="text-white text-sm font-medium">বাজার দেখুন</p>
                                <p className="text-slate-500 text-xs">ট্রেডিং শুরু করুন</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-600 ml-auto" />
                        </Link>
                    </div>
                </div>

                {/* Safety */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-400 text-xs mb-1">নিরাপত্তা সতর্কতা</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            রিকভারি ফ্রেজ কখনো অনলাইনে শেয়ার করবেন না। P2P লেনদেনে বিক্রেতার বিরুদ্ধে রিপোর্ট করতে পারবেন যদি USDT না পান। সবসময় সঠিক নেটওয়ার্ক ব্যবহার করুন। ভুল নেটওয়ার্কে পাঠালে USDT ফেরত পাবেন না।
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}