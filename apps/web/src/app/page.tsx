'use client';

import { useEffect, useState } from 'react';
import Hero from '@/components/home/Hero';
import LiveMarketsTicker from '@/components/home/LiveMarketsTicker';
import HowItWorks from '@/components/home/HowItWorks';
import StatsSection from '@/components/home/StatsSection';
import CTASection from '@/components/home/CTASection';
import { fetchMarkets } from '@/lib/supabase';

interface Market {
  title: string;
  change: string;
  color: string;
}

export default function HomePage() {
  const [tickerData, setTickerData] = useState<Market[]>([]);

  useEffect(() => {
    async function loadMarkets() {
      try {
        const data = await fetchMarkets();
        if (data && data.length > 0) {
          const formatted = data.map((m: any) => ({
            title: m.question,
            change: m.category || 'Active',
            color: 'text-green-500' // Default to green for now
          }));
          setTickerData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch markets:', err);
      }
    }
    loadMarkets();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <LiveMarketsTicker initialMarkets={tickerData} />

      <main>
        <Hero />
        <StatsSection />
        <HowItWorks />
        <CTASection />
      </main>
    </div>
  );
}
