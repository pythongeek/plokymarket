import DepositHub from '@/components/deposit/DepositHub';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ডিপোজিট - Polymarket Bangladesh',
    description: 'বিভিন্ন পদ্ধতিতে USDT ডিপোজিট করুন - ভাউচার, এজেন্ট, ক্রিপ্টো, P2P',
};

export default function DepositPage() {
    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <DepositHub />
            </div>
        </div>
    );
}
