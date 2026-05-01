'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, TrendingUp, Target, Clock, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Challenge {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  type: 'volume' | 'accuracy' | 'trades' | 'streak';
  target: number;
  current: number;
  reward: number;
  xp: number;
  expiresAt: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: 'weekly_volume_50k',
    title: 'Weekly Volume Hunter',
    titleBn: 'সাপ্তাহিক ভলিউম হান্টার',
    description: 'Trade 50,000 BDT this week',
    descriptionBn: 'এই সপ্তাহে ৫০,০০০ টাকা ট্রেড করুন',
    type: 'volume',
    target: 50000,
    current: 32500,
    reward: 500,
    xp: 100,
    expiresAt: '2026-05-04',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  {
    id: 'weekly_accuracy_80',
    title: 'Accuracy Master',
    titleBn: 'নির্ভুলতা মাস্টার',
    description: 'Achieve 80% prediction accuracy',
    descriptionBn: '৮০% ভবিষ্যদ্বাণী সঠিকতা অর্জন করুন',
    type: 'accuracy',
    target: 80,
    current: 72,
    reward: 1000,
    xp: 200,
    expiresAt: '2026-05-04',
    icon: <Target className="w-5 h-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  {
    id: 'weekly_trades_20',
    title: 'Active Trader',
    titleBn: 'সক্রিয় ট্রেডার',
    description: 'Place 20 trades this week',
    descriptionBn: 'এই সপ্তাহে ২০টি ট্রেড করুন',
    type: 'trades',
    target: 20,
    current: 14,
    reward: 300,
    xp: 50,
    expiresAt: '2026-05-04',
    icon: <Flame className="w-5 h-5" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
  {
    id: 'weekly_streak_7',
    title: 'Consistency Champion',
    titleBn: 'ধারাবাহিকতা চ্যাম্পিয়ন',
    description: 'Login 7 days this week',
    descriptionBn: 'এই সপ্তাহে ৭ দিন লগইন করুন',
    type: 'streak',
    target: 7,
    current: 5,
    reward: 200,
    xp: 75,
    expiresAt: '2026-05-04',
    icon: <Trophy className="w-5 h-5" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
];

function getDaysLeft(expiresAt: string): number {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function WeeklyChallenge() {
  const [challenges, setChallenges] = useState<Challenge[]>(WEEKLY_CHALLENGES);

  const completedCount = challenges.filter(
    (c) => c.current >= c.target
  ).length;
  const totalReward = challenges.reduce((sum, c) => sum + c.reward, 0);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            সাপ্তাহিক চ্যালেঞ্জ
          </CardTitle>
          <Badge className="bg-orange-400/10 text-orange-400 border-orange-400/20">
            <Clock className="w-3 h-3 mr-1" />
            {getDaysLeft(challenges[0].expiresAt)} দিন বাকি
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Progress
            value={(completedCount / challenges.length) * 100}
            className="h-1.5 flex-1"
          />
          <span className="text-xs text-slate-400">
            {completedCount}/{challenges.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenges.map((challenge, i) => {
          const progress = Math.min(100, (challenge.current / challenge.target) * 100);
          const isComplete = challenge.current >= challenge.target;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'rounded-xl p-3 border',
                isComplete ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-slate-800/50 border-slate-800'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg', challenge.bgColor)}>
                  <span className={challenge.color}>{challenge.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-white truncate">
                      {challenge.titleBn}
                    </h4>
                    {isComplete ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-slate-400 border-slate-600 flex-shrink-0"
                      >
                        +{challenge.reward}৳ • +{challenge.xp}XP
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {challenge.descriptionBn}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-slate-500 min-w-[60px] text-right">
                      {challenge.current >= challenge.target
                        ? '✓ সম্পূর্ণ'
                        : `${challenge.current.toLocaleString()}/${challenge.target.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">মোট পুরস্কার</span>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
              +{totalReward}৳
            </Badge>
            <Badge className="bg-blue-400/10 text-blue-400 border-blue-400/20">
              +{challenges.reduce((s, c) => s + c.xp, 0)}XP
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
