'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryTab {
    id: string;
    label: string;
    icon?: string;
}

const CATEGORIES: CategoryTab[] = [
    { id: 'trending', label: 'ট্রেন্ডিং', icon: '🔥' },
    { id: 'latest', label: 'সর্বশেষ', icon: '⚡' },
    { id: 'new', label: 'নতুন', icon: '✨' },
    { id: 'politics', label: 'রাজনীতি', icon: '🏛️' },
    { id: 'sports', label: 'খেলাধুলা', icon: '🏏' },
    { id: 'technology', label: 'প্রযুক্তি', icon: '💻' },
    { id: 'economy', label: 'অর্থনীতি', icon: '💰' },
    { id: 'entertainment', label: 'বিনোদন', icon: '🎬' },
    { id: 'international', label: 'আন্তর্জাতিক', icon: '🌍' },
    { id: 'weather', label: 'আবহাওয়া', icon: '🌦️' },
    { id: 'infrastructure', label: 'অবকাঠামো', icon: '🏗️' },
];

interface CategoryTabsProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = direction === 'left' ? -200 : 200;
        el.scrollBy({ left: amount, behavior: 'smooth' });
        setTimeout(checkScroll, 300);
    };

    return (
        <div className="relative border-b border-gray-200 bg-white">
            {/* Left scroll arrow */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-white via-white to-transparent"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
            )}

            {/* Tabs */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex items-center gap-1 overflow-x-auto scrollbar-none px-4 py-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors rounded-lg ${activeCategory === cat.id
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        {cat.icon && <span className="text-sm">{cat.icon}</span>}
                        {cat.label}
                        {activeCategory === cat.id && (
                            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Right scroll arrow */}
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-white via-white to-transparent"
                >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
            )}
        </div>
    );
}

interface TrendingTag {
    id: string;
    label: string;
}

interface TrendingTagsProps {
    tags: TrendingTag[];
    activeTag: string | null;
    onTagClick: (tagId: string | null) => void;
}

export function TrendingTags({ tags, activeTag, onTagClick }: TrendingTagsProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            <button
                onClick={() => onTagClick(null)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap border transition-colors ${activeTag === null
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
            >
                সব
            </button>
            {tags.map((tag) => (
                <button
                    key={tag.id}
                    onClick={() => onTagClick(activeTag === tag.id ? null : tag.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap border transition-colors ${activeTag === tag.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    {tag.label}
                </button>
            ))}
        </div>
    );
}
