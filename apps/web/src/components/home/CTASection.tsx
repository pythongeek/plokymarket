'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                        <Sparkles className="h-4 w-4" />
                        Limited Time Offer
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        Start trading with <span className="text-primary">0% fees</span>
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Join the fastest growing prediction market in Bangladesh. No hidden costs. Just pure trading.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25">
                                Create Free Account
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-8 text-sm text-muted-foreground/60">
                        No credit card required • Secure Bkash/Nagad Deposits
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
