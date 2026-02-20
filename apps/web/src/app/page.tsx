'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PremiumHero from '@/components/home/PremiumHero';
import MarketGrid from '@/components/home/MarketGrid';
import WhySection from '@/components/home/WhySection';
import PremiumFooter from '@/components/home/PremiumFooter';
import TickerTape from '@/components/home/TickerTape';
import { fetchMarkets } from '@/lib/supabase';
import { Trophy, Vote, Coins, Smartphone } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export default function HomePage() {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
    async function loadData() {
      try {
        const data = await fetchMarkets();
        setMarkets(data || []);
      } catch (err) {
        console.error('Failed to fetch markets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getMarketsByCategory = (cat: string | string[]) => {
    const cats = Array.isArray(cat) ? cat.map(c => c.toLowerCase()) : [cat.toLowerCase()];
    return markets.filter(m => m.category && cats.includes(m.category.toLowerCase()));
  };

  const sportsMarkets = getMarketsByCategory('Sports').slice(0, 3);
  const politicsMarkets = getMarketsByCategory('Politics').slice(0, 3);
  const economyMarkets = getMarketsByCategory('Economy').slice(0, 3);
  const techMarkets = getMarketsByCategory(['Technology', 'Entertainment', 'Infrastructure']).slice(0, 3);

  const tickerItems = [
    { label: 'BPL 2024', value: 'Rangpur Riders 60% Chance of winning', color: 'green' },
    { label: 'Economy', value: 'USD rate stable at 122 BDT', color: 'blue' },
    { label: 'Politics', value: 'Election date speculation rising', color: 'red' },
    { label: 'Gold', value: 'Price hits new high 1.15L BDT', color: 'yellow' },
    { label: 'Tech', value: 'ChatGPT 5 rumored release date', color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-[#fcfdff] dark:bg-background text-foreground transition-colors duration-200 pb-16">
      <Navbar />
      <PremiumHero />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 space-y-24 mt-12">
        <MarketGrid
          title="ক্রিকেট স্পেশাল"
          tag="BPL"
          icon={Trophy}
          markets={sportsMarkets.length > 0 ? sportsMarkets : [{ id: '2e8f42fe-327b-42d6-98aa-c7ba71ea5ac6', question: 'Will Rangpur Riders win the BPL 2024 final?', yes_price: 60.50, no_price: 39.50, volume_total: 12500, category: 'BPL 2024' }]}
        />

        <MarketGrid
          title="রাজনীতি"
          tag="Politics"
          icon={Vote}
          markets={politicsMarkets.length > 0 ? politicsMarkets : [{ id: '6a6b3d00-896a-4c46-84dd-389ce58e8dd2', question: 'Will the next National Election be held by Jan 2025?', yes_price: 85.00, no_price: 15.00, volume_total: 45000, category: 'Elections' }]}
        />

        <MarketGrid
          title="অর্থনীতি"
          tag="Economy"
          icon={Coins}
          markets={economyMarkets.length > 0 ? economyMarkets : [{ id: 'f9653979-3ff4-425e-86bb-de3e2d322054', question: 'Will USD/BDT exchange rate exceed 130 by June?', yes_price: 90.00, no_price: 10.00, volume_total: 82000, category: 'Prices' }]}
        />

        <MarketGrid
          title="টেক ও বিনোদন"
          tag="Tech & Ent"
          icon={Smartphone}
          markets={techMarkets.length > 0 ? techMarkets : [{ id: '440adb1b-d68b-4df9-a7d9-95d3411530fa', question: 'Will "Toofan 2" gross over 50 Crore BDT?', yes_price: 35.00, no_price: 65.00, volume_total: 15600, category: 'Movies' }]}
        />
      </main>

      <WhySection />
      <PremiumFooter />
      {hasHydrated && <TickerTape items={tickerItems} />}
    </div>
  );
}
