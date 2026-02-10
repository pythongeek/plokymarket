'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Check,
  Clock,
  ArrowRight,
  ArrowLeft,
  Send,
  Info,
  FileText,
  AlertCircle,
  Scale,
  Gavel,
  ShieldOff,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MarketDraft } from '@/lib/market-creation/service';

interface LegalReviewStageProps {
  draft: MarketDraft;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
  adminBypass?: { liquidity: boolean; legal_review: boolean; simulation: boolean };
}

const RISK_INDICATORS = [
  {
    category: 'রাজনৈতিক সংবেদনশীলতা',
    categoryEn: 'Political Sensitivity',
    keywords: ['election fraud', 'corruption', 'coup', 'assassination', 'নির্বাচন'],
    level: 'high'
  },
  {
    category: 'সহিংসতা ও ক্ষতি',
    categoryEn: 'Violence & Harm',
    keywords: ['terrorism', 'war', 'death', 'violence', 'যুদ্ধ'],
    level: 'high'
  },
  {
    category: 'আর্থিক নিয়মকানুন',
    categoryEn: 'Financial Regulation',
    keywords: ['gambling', 'insider trading', 'market manipulation', 'জুয়া'],
    level: 'medium'
  },
  {
    category: 'স্বাস্থ্য ও নিরাপত্তা',
    categoryEn: 'Health & Safety',
    keywords: ['pandemic', 'disease outbreak', 'public health emergency', 'মহামারী'],
    level: 'medium'
  }
];

export function LegalReviewStage({
  draft,
  onSave,
  onBack,
  isSaving,
  errors,
  adminBypass
}: LegalReviewStageProps) {
  const isBypassed = adminBypass?.legal_review || false;
  const [reviewNotes, setReviewNotes] = useState(draft?.legal_review_notes || '');
  const [detectedRisks, setDetectedRisks] = useState<Array<{ category: string; categoryEn: string; level: string; keywords: string[] }>>([]);
  const [selfApproved, setSelfApproved] = useState(
    draft?.legal_review_status === 'approved' || isBypassed
  );

  // Detect risk indicators in question/description
  useEffect(() => {
    const text = `${draft?.question || ''} ${draft?.description || ''}`.toLowerCase();
    const risks = RISK_INDICATORS.filter(indicator =>
      indicator.keywords.some(keyword => text.includes(keyword.toLowerCase()))
    );
    setDetectedRisks(risks);
  }, [draft?.question, draft?.description]);

  const handleSubmit = async () => {
    await onSave({
      legal_review_status: 'approved',
      legal_review_notes: reviewNotes || (isBypassed ? 'Admin bypass - self-approved' : 'Self-approved by admin'),
      admin_bypass_legal_review: isBypassed
    });
  };

  const handleSelfApprove = () => {
    setSelfApproved(true);
    setReviewNotes(prev => prev || 'অ্যাডমিন দ্বারা স্ব-অনুমোদিত');
  };

  const overallRisk = detectedRisks.some(r => r.level === 'high') ? 'high' :
    detectedRisks.some(r => r.level === 'medium') ? 'medium' : 'low';

  return (
    <div className="space-y-6">
      {/* Bypass Notice */}
      {isBypassed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3"
        >
          <ShieldOff className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">আইনি পর্যালোচনা বাইপাস সক্রিয়</p>
            <p className="text-xs text-amber-400/70">
              আইনি পর্যালোচনা প্রক্রিয়া বাইপাস করা হয়েছে। আপনি সরাসরি অনুমোদন করে এগিয়ে যেতে পারেন।
            </p>
          </div>
        </motion.div>
      )}

      {/* Market Summary */}
      <Card className="bg-slate-900/50 border-slate-700/50 p-4">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          মার্কেট সারসংক্ষেপ (Market Summary)
        </h4>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-slate-500">প্রশ্ন</p>
            <p className="text-sm text-white">{draft?.question || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">বিবরণ</p>
            <p className="text-sm text-slate-300">{draft?.description || 'N/A'}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-slate-500">ক্যাটাগরি</p>
              <Badge className="bg-slate-800 text-slate-300 border-slate-700">{draft?.category || 'N/A'}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500">ধরন</p>
              <Badge className="bg-slate-800 text-slate-300 border-slate-700">{draft?.market_type || 'N/A'}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Risk Assessment */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          ঝুঁকি মূল্যায়ন (Risk Assessment)
        </h4>

        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          overallRisk === 'high' ? "bg-red-900/20 border-red-800/50" :
            overallRisk === 'medium' ? "bg-amber-900/20 border-amber-800/50" :
              "bg-green-900/20 border-green-800/50"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            overallRisk === 'high' ? "bg-red-500/20 text-red-400" :
              overallRisk === 'medium' ? "bg-amber-500/20 text-amber-400" :
                "bg-green-500/20 text-green-400"
          )}>
            {overallRisk === 'low' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              সামগ্রিক ঝুঁকি: {overallRisk === 'high' ? 'উচ্চ' : overallRisk === 'medium' ? 'মাঝারি' : 'কম'}
            </p>
            <p className="text-xs text-slate-400">
              {detectedRisks.length === 0
                ? 'কোন সংবেদনশীল বিষয় সনাক্ত হয়নি'
                : `${detectedRisks.length}টি ঝুঁকি সূচক সনাক্ত হয়েছে`}
            </p>
          </div>
        </div>

        {/* Detected Risks */}
        {detectedRisks.length > 0 && (
          <div className="space-y-2">
            {detectedRisks.map((risk, i) => (
              <div key={i} className={cn(
                "p-3 rounded-lg border flex items-center justify-between",
                risk.level === 'high' ? "bg-red-900/10 border-red-800/30" : "bg-amber-900/10 border-amber-800/30"
              )}>
                <div>
                  <p className="text-sm text-white">{risk.category}</p>
                  <p className="text-xs text-slate-500">{risk.categoryEn}</p>
                </div>
                <Badge className={cn(
                  "border",
                  risk.level === 'high'
                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                )}>
                  {risk.level === 'high' ? 'উচ্চ ঝুঁকি' : 'মাঝারি ঝুঁকি'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Self-Approval */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Gavel className="w-4 h-4 text-violet-400" />
          অ্যাডমিন অনুমোদন (Admin Approval)
        </h4>

        <div className="space-y-2">
          <Label className="text-slate-300">পর্যালোচনা নোট (Review Notes)</Label>
          <Textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="পর্যালোচনা সম্পর্কে নোট যোগ করুন..."
            rows={3}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        {!selfApproved ? (
          <div className="flex gap-2">
            <Button
              onClick={handleSelfApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              স্ব-অনুমোদন করুন (Self-Approve)
            </Button>
            {detectedRisks.length > 0 && !isBypassed && (
              <Button variant="outline" className="border-amber-500/40 text-amber-300">
                <Send className="w-4 h-4 mr-2" />
                সিনিয়র কাউন্সেলে পাঠান
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-900/20 border border-green-800/50 rounded-lg p-3 flex items-center gap-2"
          >
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300">
              {isBypassed ? 'অ্যাডমিন বাইপাস দ্বারা অনুমোদিত' : 'অ্যাডমিন দ্বারা স্ব-অনুমোদিত'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-slate-800">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            পিছনে
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSaving || (!selfApproved && !isBypassed)}
          className="ml-auto"
          size="lg"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              সংরক্ষণ হচ্ছে...
            </>
          ) : (
            <>
              পরবর্তী ধাপ
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
