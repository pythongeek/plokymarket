'use client';

import { Navbar } from '@/components/layout/Navbar';
import PremiumFooter from '@/components/home/PremiumFooter';
import { Newspaper } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NewsPage() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-20 text-center">
                <Newspaper className="w-16 h-16 mx-auto mb-6 text-primary/50" />
                <h1 className="text-4xl font-bold mb-4">{t('common.news')}</h1>
                <p className="text-muted-foreground text-lg">
                    আমাদের নিউজ সেকশনটি শীঘ্রই চালু হচ্ছে। ততক্ষণ পর্যন্ত ট্রেডিং সাথেই থাকুন!
                </p>
            </main>
            <PremiumFooter />
        </div>
    );
}
