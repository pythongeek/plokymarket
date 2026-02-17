'use client';

import { useTranslation } from 'react-i18next';
import { ShieldCheck, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhySection() {
    const { t } = useTranslation();

    const features = [
        {
            title: t('premium_home.feature_transparency_title'),
            desc: t('premium_home.feature_transparency_desc'),
            icon: ShieldCheck,
            color: 'blue'
        },
        {
            title: t('premium_home.feature_instant_title'),
            desc: t('premium_home.feature_instant_desc'),
            icon: Zap,
            color: 'pink'
        },
        {
            title: t('premium_home.feature_local_title'),
            desc: t('premium_home.feature_local_desc'),
            icon: Users,
            color: 'green'
        }
    ];

    return (
        <section className="bg-white dark:bg-muted/10 py-20 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black mb-6 text-foreground">{t('premium_home.why_title')}</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t('premium_home.why_subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15, duration: 0.6 }}
                            className="p-10 rounded-[32px] bg-[#f8faff] dark:bg-muted/20 border border-blue-50/50 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
                        >
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-10 transform group-hover:rotate-6 transition-transform duration-500 ${feature.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                feature.color === 'pink' ? 'bg-pink-50 text-pink-600' :
                                    'bg-green-50 text-green-600'
                                } shadow-inner`}>
                                <feature.icon className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black mb-5 text-foreground">{feature.title}</h3>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
