import { WithdrawalForm } from '@/components/wallet/WithdrawalForm';
import { ExchangeRateDisplay } from '@/components/wallet/ExchangeRateDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';

export default function WithdrawPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">USDT উইথড্রয়াল</h1>
                    <p className="text-muted-foreground">
                        USDT বিক্রি করে BDT পান
                    </p>
                </div>
            </div>

            <ExchangeRateDisplay />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <WithdrawalForm />
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">নির্দেশনা</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex gap-2">
                                <span className="text-blue-600 font-bold">১.</span>
                                <span>USDT পরিমাণ লিখুন</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-blue-600 font-bold">২.</span>
                                <span>MFS প্রোভাইডার নির্বাচন করুন</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-blue-600 font-bold">৩.</span>
                                <span>আপনার নম্বর ও নাম দিন</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-blue-600 font-bold">৪.</span>
                                <span>রিকোয়েস্ট সাবমিট করুন</span>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-800">
                                    💡 পেমেন্ট ২-৬ ঘণ্টার মধ্যে আপনার নম্বরে পাঠানো হবে
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">প্রসেসিং টাইম</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>সাধারণত:</span>
                                <span className="font-medium">২-৪ ঘণ্টা</span>
                            </div>
                            <div className="flex justify-between">
                                <span>ব্যস্ত সময়:</span>
                                <span className="font-medium">৬-১২ ঘণ্টা</span>
                            </div>
                            <div className="flex justify-between">
                                <span>ফি:</span>
                                <span className="font-medium text-blue-600">২ USDT</span>
                            </div>
                            <div className="flex justify-between">
                                <span>সর্বনিম্ন:</span>
                                <span className="font-medium">১০ USDT</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}