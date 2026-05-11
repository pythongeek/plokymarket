'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Activity, Zap } from 'lucide-react';

interface SlideMarket {
  id: string;
  question: string;
  prob: number;
  volume: string;
  icon: string;
  tag: string;
  slug: string;
}

interface Props {
  markets: SlideMarket[];
}

const toBengali = (n: number | string): string => {
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.',
  };
  return String(n).replace(/[0-9.]/g, (d) => map[d] || d);
};

export function NewsEventSlider({ markets }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = markets.slice(0, 8);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, slides.length]);

  if (slides.length === 0) return null;

  const current = slides[index];
  const isHighProb = current.prob >= 50;
  const probColor = isHighProb ? 'text-green-500' : 'text-red-500';
  const probBg = isHighProb ? 'bg-green-500' : 'bg-red-500';

  return (
    <div
      className="relative mb-6 rounded-2xl overflow-hidden shadow-lg border border-gray-200"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background gradient based on probability */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: isHighProb
            ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #86efac 100%)'
            : 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #fca5a5 100%)',
        }}
      />

      {/* Slide content */}
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{current.icon}</span>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {current.tag}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
              <Zap className="w-3 h-3" /> LIVE
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] text-gray-400">
              {toBengali(index + 1)} / {toBengali(slides.length)}
            </span>
          </div>
        </div>

        {/* Animated slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <Link href={`/markets/${current.slug}`} className="block group">
              <div className="flex items-center gap-4">
                {/* Left: Big probability circle */}
                <div className="shrink-0">
                  <div
                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 ${
                      isHighProb ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <span className={`text-xl font-black ${probColor}`}>
                      {toBengali(current.prob)}%
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">YES</span>
                  </div>
                </div>

                {/* Center: Question + stats */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-extrabold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {current.question}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-600">
                      <TrendingUp className={`w-3.5 h-3.5 ${probColor}`} />
                      {isHighProb ? 'বেশিরভাগ মনে করে হ্যাঁ' : 'বেশিরভাগ মনে করে না'}
                    </span>
                    <span className="text-[11px] text-gray-400">|</span>
                    <span className="text-xs font-bold text-gray-600">
                      {current.volume} ট্রেড হয়েছে
                    </span>
                  </div>
                </div>

                {/* Right: CTA */}
                <div className="shrink-0 hidden sm:block">
                  <div className={`${probBg} text-white text-xs font-bold px-4 py-2 rounded-xl group-hover:scale-105 transition-transform`}>
                    এখনই ট্রেড করুন →
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${probBg}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, ease: 'linear' }}
            key={current.id + '-progress'}
          />
        </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-600 hover:bg-white hover:text-gray-900 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-gray-800' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
