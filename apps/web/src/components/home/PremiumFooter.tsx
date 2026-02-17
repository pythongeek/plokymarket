'use client';

import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Instagram, Heart, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function PremiumFooter() {
    const { t } = useTranslation();

    return (
        <footer className="bg-muted/50 dark:bg-background border-t border-border pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
                            <span className="text-xl font-bold font-display text-foreground">Plokymarket</span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                            {t('premium_home.footer_desc')}
                        </p>
                        <div className="flex space-x-5">
                            <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white dark:bg-muted/20 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm"><Facebook className="w-5 h-5" /></a>
                            <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-white dark:bg-muted/20 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm"><Twitter className="w-5 h-5" /></a>
                            <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white dark:bg-muted/20 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm"><Instagram className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-foreground mb-6 uppercase tracking-wider text-xs">{t('common.markets')}</h4>
                        <ul className="space-y-3 text-[14px] text-muted-foreground">
                            <li><Link href="/markets" className="hover:text-primary transition-colors">ক্রিকেট</Link></li>
                            <li><Link href="/markets" className="hover:text-primary transition-colors">রাজনীতি</Link></li>
                            <li><Link href="/markets" className="hover:text-primary transition-colors">অর্থনীতি</Link></li>
                            <li><Link href="/markets" className="hover:text-primary transition-colors">টেক</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-bold text-foreground mb-6 uppercase tracking-wider text-xs">কোম্পানি</h4>
                        <ul className="space-y-3 text-[14px] text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">আমাদের সম্পর্কে</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">কোম্পানি নীতি</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">যোগাযোগ</a></li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h4 className="font-bold text-foreground mb-6 uppercase tracking-wider text-xs">অ্যাকাউন্ট</h4>
                        <ul className="space-y-3 text-[14px] text-muted-foreground">
                            <li><Link href="/login" className="hover:text-primary transition-colors">{t('auth.sign_in')}</Link></li>
                            <li><Link href="/register" className="hover:text-primary transition-colors">{t('auth.create_account')}</Link></li>
                            <li><Link href="/portfolio" className="hover:text-primary transition-colors">{t('common.portfolio')}</Link></li>
                        </ul>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <h4 className="font-bold text-foreground mb-6 uppercase tracking-wider text-xs">পেমেন্ট মেথড</h4>
                        <div className="flex gap-4 items-center">
                            <div className="bg-white px-4 py-2 rounded-lg border border-border text-[#E2136E] font-black text-xs shadow-sm tracking-tighter">BKASH</div>
                            <div className="bg-white px-4 py-2 rounded-lg border border-border text-[#F26522] font-black text-xs shadow-sm tracking-tighter">NAGAD</div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center text-[13px] text-muted-foreground font-medium">
                    <p>© 2024 Plokymarket. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0 items-center">
                        <span className="flex items-center gap-1.5">Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> in Bangladesh</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
