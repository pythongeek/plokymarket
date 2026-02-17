import DepositFlow from '@/components/deposit/DepositFlow';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'P2P Deposit - Polymarket Bangladesh',
    description: 'Buy USDT directly from Binance P2P with bKash/Nagad',
};

export default function DepositPage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
                    ডিপোজিট করুন
                </h1>
                <DepositFlow />
            </div>
        </div>
    );
}
