"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  User,
  Wallet,
  Shield,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Rocket,
  Gift,
  Video,
  BookOpen,
  Zap,
  Star,
  ArrowRight,
  Building2,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useOnboarding, OnboardingStep } from '@/hooks/useOnboarding';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

// Step configuration
const STEP_CONFIG: Record<OnboardingStep, {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}> = {
  'welcome': {
    title: 'স্বাগতম, ট্রেডার! 🎉',
    subtitle: 'আপনার ট্রেডিং যাত্রা শুরু করুন',
    icon: Rocket,
    color: 'text-amber-500',
  },
  'profile': {
    title: 'প্রোফাইল সম্পন্ন করুন',
    subtitle: 'আপনার অ্যাকাউন্ট সেটআপ করুন',
    icon: User,
    color: 'text-blue-500',
  },
  'deposit': {
    title: 'প্রথম ডিপোজিট করুন',
    subtitle: 'বিকাশ, নগদ বা ব্যাংক একাউন্টে টাকা জমা দিন',
    icon: Wallet,
    color: 'text-emerald-500',
  },
  'kyc': {
    title: 'ভেরিফিকেশন (KYC)',
    subtitle: 'আপনার পরিচয় যাচাই করুন',
    icon: Shield,
    color: 'text-purple-500',
  },
  'first-trade': {
    title: 'প্রথম ট্রেড করুন',
    subtitle: 'বাজারে আপনার প্রথম পদক্ষেপ নিন',
    icon: TrendingUp,
    color: 'text-orange-500',
  },
  'complete': {
    title: 'অভিনন্দন! 🎊',
    subtitle: 'আপনি এখন পূর্ণাঙ্গ ট্রেডার',
    icon: Star,
    color: 'text-yellow-500',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 },
  },
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    </div>
  );
}

// Welcome Step
function WelcomeStep({ onNext }: { onNext: () => void }) {
  const features = [
    { icon: TrendingUp, text: 'বাংলাদেশের সেরা প্রিডিকশন মার্কেট' },
    { icon: Wallet, text: 'দ্রুত ডিপোজিট ও উইথড্র' },
    { icon: Shield, text: 'নিরাপদ ও ভেরিফাইড ট্রেডিং' },
    { icon: Gift, text: 'রেফারেল বোনাস ও রিওয়ার্ড' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto text-center space-y-8"
    >
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold">Plokymarket-এ স্বাগতম!</h1>
        <p className="text-xl text-muted-foreground">
          বাংলাদেশের সবচেয়ে বিশ্বস্ত প্রিডিকশন মার্কেটপ্লেসে আপনাকে পাওয়া গেছে!
          <br />
          আসুন শুরু করি...
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <Card key={i} className="bg-gradient-to-br from-card to-muted/30 border-primary/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button size="lg" className="gap-2 text-lg px-8" onClick={onNext}>
          শুরু করুন
          <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>

      <motion.p variants={itemVariants} className="text-sm text-muted-foreground">
        রেজিস্ট্রেশন করতে সমস্যা হচ্ছে?{' '}
        <Link href="/support" className="text-primary hover:underline">সাহায্য নিন</Link>
      </motion.p>
    </motion.div>
  );
}

// Profile Step
function ProfileStep({ onNext, onSkip, isCompleted }: { onNext: () => void; onSkip: () => void; isCompleted: boolean }) {
  const { user } = useUser();

  const profileFields = [
    { label: 'নাম', value: user?.name || 'সেট করুন', complete: !!user?.name },
    { label: 'ইমেইল', value: user?.email || '', complete: true },
    { label: 'ফোন নম্বর', value: 'সেট করুন', complete: false },
    { label: 'প্রোফাইল ছবি', value: 'সেট করুন', complete: !!user?.avatar_url },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
          <User className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold">প্রোফাইল সম্পন্ন করুন</h2>
        <p className="text-muted-foreground">আপনার অ্যাকাউন্টের তথ্য যাচাই করুন</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name?.charAt(0) || 'T'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user?.name || 'ট্রেডার'}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              {isCompleted && (
                <Badge className="ml-auto bg-emerald-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  সম্পন্ন
                </Badge>
              )}
            </div>

            <div className="divide-y">
              {profileFields.map((field, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">{field.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(!field.complete && "text-muted-foreground")}>
                      {field.value}
                    </span>
                    {field.complete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Link href="/profile/edit">
                        <Button variant="ghost" size="sm">এডিট</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onSkip}>
          এড়িয়ে যান
        </Button>
        <Button onClick={onNext} className="gap-2">
          {isCompleted ? 'পরবর্তী' : 'সম্পন্ন করুন'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Deposit Step
function DepositStep({ onNext, onSkip, isCompleted }: { onNext: () => void; onSkip: () => void; isCompleted: boolean }) {
  const paymentMethods = [
    { icon: Smartphone, name: 'bKash', color: 'bg-pink-500/10 text-pink-500', subtitle: 'তাৎক্ষণিক' },
    { icon: CreditCard, name: 'Nagad', color: 'bg-orange-500/10 text-orange-500', subtitle: 'তাৎক্ষণিক' },
    { icon: Building2, name: 'ব্যাংক ট্রান্সফার', color: 'bg-blue-500/10 text-blue-500', subtitle: '১-২ কর্মদিবস' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold">প্রথম ডিপোজিট করুন</h2>
        <p className="text-muted-foreground">আপনার অ্যাকাউন্টে টাকা জমা দিন</p>
      </motion.div>

      {isCompleted ? (
        <motion.div variants={itemVariants}>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-emerald-600">ডিপোজিট সম্পন্ন!</h3>
              <p className="text-muted-foreground">আপনার অ্যাকাউন্টে টাকা জমা হয়েছে। এখন ট্রেড করুন!</p>
              <div className="flex gap-3 justify-center">
                <Link href="/wallet">
                  <Button variant="outline">ওয়ালেট দেখুন</Button>
                </Link>
                <Button onClick={onNext} className="gap-2">
                  পরবর্তী
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {paymentMethods.map((method, i) => {
              const Icon = method.icon;
              return (
                <Card key={i} className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-4 text-center space-y-2">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto', method.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold">{method.name}</h3>
                    <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          <motion.div variants={itemVariants} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>বোনাস টিপ:</strong> প্রথম ডিপোজিটে ১০০% বোনাস পান! সর্বনিম্ন ৳৫০০ ডিপোজিট করুন।
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onSkip}>
              এড়িয়ে যান
            </Button>
            <Link href="/wallet">
              <Button className="gap-2">
                ডিপোজিট করুন
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// KYC Step
function KYCSearch({ onNext, onSkip, isCompleted }: { onNext: () => void; onSkip: () => void; isCompleted: boolean }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold">ভেরিফিকেশন (KYC)</h2>
        <p className="text-muted-foreground">আপনার পরিচয় যাচাই করুন</p>
      </motion.div>

      {isCompleted ? (
        <motion.div variants={itemVariants}>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-emerald-600">ভেরিফাইড!</h3>
              <p className="text-muted-foreground">আপনার KYC সম্পন্ন হয়েছে। সব সুবিধা উপভোগ করুন!</p>
              <Button onClick={onNext} className="gap-2">
                পরবর্তী
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">KYC স্ট্যাটাস</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">বর্তমান স্ট্যাটাস</span>
                  <Badge variant="outline">অনিশ্চিত (Pending)</Badge>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">KYC করলে পান:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> উচ্চ উইথড্রাল লিমিট</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> দ্রুত লেনদেন</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> বিশ্বস্ত ট্রেডার ব্যাজ</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onSkip}>
              এড়িয়ে যান
            </Button>
            <Link href="/kyc">
              <Button className="gap-2">
                KYC শুরু করুন
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// First Trade Step
function FirstTradeStep({ onNext, onSkip, isCompleted }: { onNext: () => void; onSkip: () => void; isCompleted: boolean }) {
  const popularMarkets = [
    { title: 'বাংলাদেশ vs ভারত ক্রিকেট', probability: '65%', volume: '৳12.5L' },
    { title: 'আগামী সপ্তাহে বন্যা হবে?', probability: '35%', volume: '৳8.2L' },
    { title: 'USD/BDT রেট ১১০ এর নিচে?', probability: '22%', volume: '৳5.1L' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold">প্রথম ট্রেড করুন</h2>
        <p className="text-muted-foreground">বাজারে আপনার প্রথম পদক্ষেপ নিন</p>
      </motion.div>

      {isCompleted ? (
        <motion.div variants={itemVariants}>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-emerald-600">প্রথম ট্রেড সম্পন্ন!</h3>
              <p className="text-muted-foreground">অভিনন্দন! আপনি এখন পূর্ণাঙ্গ ট্রেডার।</p>
              <div className="flex gap-3 justify-center">
                <Link href="/markets">
                  <Button variant="outline">মার্কেট দেখুন</Button>
                </Link>
                <Button onClick={onNext} className="gap-2">
                  সম্পন্ন করুন
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="font-semibold">জনপ্রিয় মার্কেট</h3>
            {popularMarkets.map((market, i) => (
              <Card key={i} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{market.title}</p>
                    <p className="text-sm text-muted-foreground">ভলিউম: {market.volume}</p>
                  </div>
                  <Badge variant="secondary" className="text-emerald-600">
                    {market.probability}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onSkip}>
              এড়িয়ে যান
            </Button>
            <Link href="/markets">
              <Button className="gap-2">
                মার্কেটে যান
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// Complete Step
function CompleteStep({ onFinish }: { onFinish: () => void }) {
  const achievements = [
    { icon: Rocket, text: 'ট্রেডিং শুরু করেছেন' },
    { icon: Wallet, text: 'অ্যাকাউন্ট সেটআপ করেছেন' },
    { icon: Shield, text: 'নিরাপদ ট্রেডিং' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-xl mx-auto text-center space-y-8"
    >
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Star className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold">অভিনন্দন, ট্রেডার! 🎊</h1>
        <p className="text-xl text-muted-foreground">
          আপনি Plokymarket-এ পূর্ণাঙ্গভাবে যোগ দিয়েছেন!
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        {achievements.map((a, i) => {
          const Icon = a.icon;
          return (
            <Card key={i} className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">{a.text}</span>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/markets">
          <Button size="lg" className="gap-2 text-lg px-8">
            <Zap className="w-5 h-5" />
            ট্রেডিং শুরু করুন
          </Button>
        </Link>
        <Link href="/portfolio">
          <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
            পোর্টফোলিও দেখুন
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const {
    currentStep,
    completedSteps,
    profileComplete,
    depositMade,
    kycVerified,
    firstTradeMade,
    isLoading,
    setStep,
    completeStep,
    skipStep,
    nextStep,
    progress,
  } = useOnboarding();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNext = async () => {
    await completeStep(currentStep);
  };

  const handleSkip = async () => {
    await skipStep(currentStep);
  };

  const handleFinish = () => {
    router.push('/markets');
  };

  if (!mounted || userLoading || isLoading) {
    return <LoadingFallback />;
  }

  // If user is not logged in, redirect to login
  if (!user) {
    router.push('/login');
    return <LoadingFallback />;
  }

  const StepIcon = STEP_CONFIG[currentStep].icon;
  const stepConfig = STEP_CONFIG[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Plokymarket</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>অগ্রগতি</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="w-24 h-2" />
          </div>
        </div>
      </header>

      {/* Progress Bar - Mobile */}
      <div className="sm:hidden px-4 py-2 bg-muted/30">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">অগ্রগতি</span>
          <span className="font-semibold">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {Object.entries(STEP_CONFIG).filter(([key]) => key !== 'complete').map(([key, config]) => {
            const step = key as OnboardingStep;
            const isActive = currentStep === step;
            const isCompleted = completedSteps.includes(step);
            const Icon = config.icon;

            return (
              <div
                key={step}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && !isActive && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span>{config.title.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'welcome' && (
              <WelcomeStep onNext={handleNext} />
            )}

            {currentStep === 'profile' && (
              <ProfileStep
                onNext={handleNext}
                onSkip={handleSkip}
                isCompleted={profileComplete}
              />
            )}

            {currentStep === 'deposit' && (
              <DepositStep
                onNext={handleNext}
                onSkip={handleSkip}
                isCompleted={depositMade}
              />
            )}

            {currentStep === 'kyc' && (
              <KYCSearch
                onNext={handleNext}
                onSkip={handleSkip}
                isCompleted={kycVerified}
              />
            )}

            {currentStep === 'first-trade' && (
              <FirstTradeStep
                onNext={handleNext}
                onSkip={handleSkip}
                isCompleted={firstTradeMade}
              />
            )}

            {currentStep === 'complete' && (
              <CompleteStep onFinish={handleFinish} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Plokymarket। সর্বস্বত্ব সংরক্ষিত।</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-foreground">শর্তাবলী</Link>
              <Link href="/privacy" className="hover:text-foreground">গোপনীয়তা</Link>
              <Link href="/support" className="hover:text-foreground">সাহায্য</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
