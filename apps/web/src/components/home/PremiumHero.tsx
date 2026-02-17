'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import Link from 'next/link';

export default function PremiumHero() {
    const { t } = useTranslation();
    const { isAuthenticated } = useStore();

    return (
        <section className="relative pt-12 pb-24 overflow-hidden bg-[#f0f2ff] dark:bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,100,255,0.05),transparent),radial-gradient(circle_at_top_left,rgba(255,100,255,0.05),transparent)] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                {/* Animated Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e8edff] text-[#3b82f6] text-[13px] font-bold mb-8 border border-blue-200/50"
                >
                    <div className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                    {t('premium_home.hero_badge')}
                </motion.div>

                {/* Dynamic Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl md:text-7xl font-bold tracking-tight mb-6 font-display leading-[1.1] text-foreground"
                >
                    {t('premium_home.hero_title_part1')}{' '}
                    <span className="text-primary italic">
                        {t('premium_home.hero_title_accent')}
                    </span>,
                    <br />
                    {t('premium_home.hero_title_part2')}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto"
                >
                    {t('premium_home.hero_description')}
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row justify-center gap-6"
                >
                    <Button
                        size="lg"
                        asChild
                        className="bg-primary hover:bg-primary/91 text-black px-10 py-7 rounded-lg text-lg font-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Link href={isAuthenticated ? "/markets" : "/register"}>
                            {String(t('premium_home.hero_cta_start'))} <ArrowRight className="w-5 h-5 ml-1" />
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="bg-white dark:bg-background hover:bg-accent text-foreground border border-border px-10 py-7 rounded-lg text-lg font-medium transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <PlayCircle className="w-5 h-5" /> {String(t('premium_home.hero_cta_how_it_works'))}
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
