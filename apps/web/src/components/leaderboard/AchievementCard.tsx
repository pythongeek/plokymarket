'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParticleEffect } from '../ui/ParticleEffect';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

interface AchievementCardProps {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    awardedAt?: string;
    isLocked?: boolean;
}

const RARITY_CONFIG = {
    COMMON: { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: Trophy },
    RARE: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: Zap },
    EPIC: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: Star },
    LEGENDARY: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Crown },
};

export function AchievementCard({ name, description, rarity, isLocked }: AchievementCardProps) {
    const config = RARITY_CONFIG[rarity];
    const Icon = config.icon;
    const [showParticles, setShowParticles] = useState(false);

    // 3D Tilt Logic
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseEnter={() => !isLocked && (rarity === 'LEGENDARY' || rarity === 'EPIC') && setShowParticles(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="perspective-1000"
        >
            <Card className={cn(
                "relative overflow-hidden group border-2 transition-all duration-300",
                config.border,
                isLocked ? "opacity-50 grayscale" : "bg-gradient-to-br from-slate-900 to-slate-950",
                !isLocked && "hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            )}>
                <CardContent className="p-4 flex items-center gap-4 relative z-10" style={{ transform: "translateZ(50px)" }}>
                    <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                        config.bg
                    )}>
                        <Icon className={cn("h-6 w-6", config.color)} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1 text-shadow-sm">
                            <h4 className="font-bold text-sm text-slate-100">{name}</h4>
                            <Badge variant="outline" className={cn("text-[10px] px-1 h-4 font-black tracking-tighter", config.color, config.border)}>
                                {rarity}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-400 leading-tight font-medium">{description}</p>
                    </div>

                    {/* Animated glow effect for EPICS/LEGENDARIES */}
                    {(rarity === 'EPIC' || rarity === 'LEGENDARY') && !isLocked && (
                        <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-60 transition-opacity">
                            <div className={cn(
                                "absolute -inset-[100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,currentColor_90deg,transparent_180deg)]",
                                config.color
                            )} />
                        </div>
                    )}
                </CardContent>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full" />
            </Card>
            <ParticleEffect active={showParticles} />
        </motion.div>
    );
}
