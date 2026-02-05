'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function StatsSection() {
    const { t, i18n } = useTranslation();

    const stats = [
        { value: i18n.language === 'en' ? "৳10M+" : "৳১০M+", label: t('stats.volume_traded') },
        { value: i18n.language === 'en' ? "50,000+" : "৫০,০০০+", label: t('stats.active_predictions') },
        { value: t('stats.instant_withdrawals'), label: t('stats.instant_withdrawals') },
        { value: "0%", label: t('stats.trading_fees') },
    ];

    return (
        <section className="py-20 border-y border-white/5 bg-white/5 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center"
                        >
                            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm font-medium text-white/50 uppercase tracking-wider">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

