'use client';

import { motion } from 'framer-motion';

interface TickerItem {
    label: string;
    value: string;
    color: string;
}

export default function TickerTape({ items }: { items: TickerItem[] }) {
    return (
        <div className="fixed bottom-0 w-full z-40 border-t border-border bg-card/80 backdrop-blur-md">
            <div className="relative flex overflow-x-hidden py-2">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="flex whitespace-nowrap gap-12 px-4 items-center"
                >
                    {[...items, ...items].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm font-medium">
                            <span className={
                                item.color === 'green' ? 'text-green-500' :
                                    item.color === 'blue' ? 'text-blue-500' :
                                        item.color === 'red' ? 'text-red-500' :
                                            item.color === 'yellow' ? 'text-yellow-500' :
                                                'text-purple-500'
                            }>
                                {item.label}:
                            </span>
                            <span className="text-card-foreground">{item.value}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
