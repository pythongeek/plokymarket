'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Search, TrendingUp, HandCoins } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
    const { t } = useTranslation();

    const steps = [
        {
            icon: Search,
            title: t('how_it_works.step1_title'),
            description: t('how_it_works.step1_desc'),
            color: "bg-blue-500/10 text-blue-500"
        },
        {
            icon: TrendingUp,
            title: t('how_it_works.step2_title'),
            description: t('how_it_works.step2_desc'),
            color: "bg-purple-500/10 text-purple-500"
        },
        {
            icon: HandCoins,
            title: t('how_it_works.step3_title'),
            description: t('how_it_works.step3_desc'),
            color: "bg-green-500/10 text-green-500"
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('how_it_works.title')}</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {t('how_it_works.subtitle')}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                            >
                                <Card className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors h-full">
                                    <CardContent className="p-8 flex flex-col items-center text-center">
                                        <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

