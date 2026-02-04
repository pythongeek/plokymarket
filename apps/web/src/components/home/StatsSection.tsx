'use client';

import { motion } from 'framer-motion';

const stats = [
    { value: "৳10M+", label: "Volume Traded" },
    { value: "50,000+", label: "Active Predictions" },
    { value: "Instant", label: "Withdrawals" },
    { value: "0%", label: "Trading Fees (Beta)" },
];

export default function StatsSection() {
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
