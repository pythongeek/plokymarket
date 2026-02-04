'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Zap } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-blob" />
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen opacity-50 animate-blob animation-delay-4000" />
            </div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md mb-8 text-primary-foreground/80"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live in Bangladesh
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
                >
                    Predict the Future.
                    <br />
                    <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Profit from Truth.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                    The premier prediction market for Bangladesh. Trade on sports, politics, and crypto with instant settlements and transparent odds.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Link href="/markets">
                        <Button size="lg" className="h-12 px-8 text-lg gap-2 rounded-full shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)] hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] transition-all">
                            Start Trading
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/how-it-works">
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm">
                            How it works
                        </Button>
                    </Link>
                </motion.div>

                {/* Floating Cards Pattern (Decorative) */}
                <div className="mt-20 relative h-[300px] w-full max-w-4xl mx-auto perspective-[1000px] hidden md:block">
                    <motion.div
                        initial={{ opacity: 0, rotateX: 20, y: 50 }}
                        animate={{ opacity: 1, rotateX: 20, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="relative w-full h-full bg-gradient-to-t from-background to-transparent z-10"
                    />
                    <div className="absolute inset-0 grid grid-cols-3 gap-6 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)] transform rotate-x-12 scale-90">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 rounded-xl bg-white/5 border border-white/10 p-4">
                                <div className="h-4 w-2/3 bg-white/10 rounded mb-4" />
                                <div className="h-24 w-full bg-white/5 rounded-lg mb-4" />
                                <div className="flex justify-between">
                                    <div className="w-16 h-8 bg-green-500/20 rounded" />
                                    <div className="w-16 h-8 bg-red-500/20 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
