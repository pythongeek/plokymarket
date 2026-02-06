'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
}

const COLORS = ['#3b82f6', '#818cf8', '#a855f7', '#f59e0b', '#10b981'];

export function ParticleEffect({ active }: { active: boolean }) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (active) {
            const newParticles = Array.from({ length: 40 }).map((_, i) => ({
                id: i,
                x: Math.random() * 200 - 100,
                y: Math.random() * 200 - 100,
                color: COLORS[Math.floor(Math.random() * COLORS.length)]
            }));
            setParticles(newParticles);
            const timer = setTimeout(() => setParticles([]), 2000);
            return () => clearTimeout(timer);
        }
    }, [active]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]"
                    style={{ color: p.color, backgroundColor: p.color }}
                />
            ))}
        </div>
    );
}
