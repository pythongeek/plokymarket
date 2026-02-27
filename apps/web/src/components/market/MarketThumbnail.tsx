'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MarketThumbnailProps {
    imageUrl?: string | null;
    title: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const GRADIENT_MAP: Record<string, string> = {
    Sports: 'from-green-500 to-emerald-700',
    Politics: 'from-red-500 to-rose-700',
    Crypto: 'from-orange-400 to-amber-600',
    Finance: 'from-blue-500 to-indigo-700',
    Entertainment: 'from-purple-500 to-violet-700',
    Technology: 'from-cyan-400 to-sky-600',
    default: 'from-slate-500 to-slate-700',
};

export function MarketThumbnail({ imageUrl, title, size = 'md', className }: MarketThumbnailProps) {
    const sizeMap = { sm: 40, md: 64, lg: 96 };
    const px = sizeMap[size];

    if (imageUrl) {
        return (
            <div
                className={cn('rounded-full overflow-hidden shrink-0 border-2 border-slate-700 relative', className)}
                style={{ width: px, height: px }}
            >
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes={`${px}px`}
                    className="object-cover"
                />
            </div>
        );
    }

    // Gradient fallback based on first letter or common categories
    const initial = title.charAt(0).toUpperCase();
    const gradient = GRADIENT_MAP[initial] || GRADIENT_MAP.default;

    return (
        <div
            className={cn(
                'rounded-full shrink-0 flex items-center justify-center text-white font-bold bg-gradient-to-br border-2 border-slate-700',
                gradient,
                className
            )}
            style={{ width: px, height: px, fontSize: px * 0.4 }}
        >
            {initial}
        </div>
    );
}
