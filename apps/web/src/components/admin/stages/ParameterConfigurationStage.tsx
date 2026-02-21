'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Link,
  FileText,
  Tag,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Image,
  Eye,
  Cpu,
  Users,
  Layers,
  Percent,
  Clock,
  SlidersHorizontal,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { MarketDraft, MarketTemplate } from '@/lib/market-creation/service';

interface ParameterConfigurationStageProps {
  draft: MarketDraft;
  templates: MarketTemplate[];
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
}

const CATEGORIES = [
  { id: 'Sports', bn: 'খেলাধুলা' },
  { id: 'Politics', bn: 'রাজনীতি' },
  { id: 'Crypto', bn: 'ক্রিপ্টো' },
  { id: 'Finance', bn: 'অর্থনীতি' },
  { id: 'Entertainment', bn: 'বিনোদন' },
  { id: 'Technology', bn: 'প্রযুক্তি' },
  { id: 'Science', bn: 'বিজ্ঞান' },
  { id: 'Weather', bn: 'আবহাওয়া' },
  { id: 'Other', bn: 'অন্যান্য' }
];

const ORACLE_TYPES = [
  { id: 'MANUAL', name: 'ম্যানুয়াল (অ্যাডমিন)', nameEn: 'Manual (Admin)', description: 'প্ল্যাটফর্ম অ্যাডমিন দ্বারা সমাধান', icon: Users },
  { id: 'AI', name: 'AI কনসেনসাস', nameEn: 'AI Consensus', description: 'AI ওরাকল দ্বারা স্বয়ংক্রিয়', icon: Cpu },
  { id: 'UMA', name: 'UMA অপটিমিস্টিক', nameEn: 'UMA Optimistic', description: 'বিকেন্দ্রীভূত অপটিমিস্টিক ওরাকল', icon: Layers },
  { id: 'CHAINLINK', name: 'Chainlink', nameEn: 'Chainlink', description: 'বিকেন্দ্রীভূত ডেটা ফিড', icon: Link },
  { id: 'MULTI', name: 'মাল্টি-সোর্স', nameEn: 'Multi-Source', description: 'একাধিক উৎস থেকে যাচাইকরণ', icon: SlidersHorizontal },
];

const VERIFICATION_SOURCES = [
  { id: 'admin_manual', label: 'অ্যাডমিন ম্যানুয়াল', labelEn: 'Admin Manual' },
  { id: 'ai_oracle', label: 'AI ওরাকল', labelEn: 'AI Oracle' },
  { id: 'chainlink_feed', label: 'Chainlink ফিড', labelEn: 'Chainlink Feed' },
  { id: 'uma_oracle', label: 'UMA ওরাকল', labelEn: 'UMA Oracle' },
  { id: 'news_scraper', label: 'নিউজ স্ক্র্যাপার', labelEn: 'News Scraper' },
  { id: 'api_endpoint', label: 'কাস্টম API', labelEn: 'Custom API' },
];

export function ParameterConfigurationStage({
  draft,
  templates,
  onSave,
  onBack,
  isSaving,
  errors
}: ParameterConfigurationStageProps) {
  // Basic fields
  const [question, setQuestion] = useState(draft?.question || '');
  const [description, setDescription] = useState(draft?.description || '');
  const [category, setCategory] = useState(draft?.category || '');
  const [imageUrl, setImageUrl] = useState(draft?.image_url || '');
  const [tags, setTags] = useState<string[]>(draft?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Resolution
  const [resolutionSource, setResolutionSource] = useState(draft?.resolution_source || '');
  const [resolutionSourceUrl, setResolutionSourceUrl] = useState(draft?.resolution_source_url || '');
  const [resolutionCriteria, setResolutionCriteria] = useState(draft?.resolution_criteria || '');
  const [resolutionDeadline, setResolutionDeadline] = useState(draft?.resolution_deadline?.slice(0, 16) || '');
  const [resolutionConfig, setResolutionConfig] = useState<Record<string, any>>(draft?.resolution_config || { method: 'AI Oracle' });

  // Oracle & Verification
  const [oracleType, setOracleType] = useState(draft?.oracle_type || 'MANUAL');
  const [requiredConfirmations, setRequiredConfirmations] = useState(draft?.required_confirmations || 1);
  const [confidenceThreshold, setConfidenceThreshold] = useState(draft?.confidence_threshold || 80);
  const [verificationSources, setVerificationSources] = useState<string[]>(
    draft?.verification_method?.sources || ['admin_manual']
  );
  const [resolvers, setResolvers] = useState<any[]>([]);
  const [selectedResolver, setSelectedResolver] = useState<string>(draft?.resolver_reference || '');

  // Trading config
  const [tradingFeePercent, setTradingFeePercent] = useState(draft?.trading_fee_percent || 2.0);
  const [tradingEndType, setTradingEndType] = useState(draft?.trading_end_type || 'date');

  // Scalar market
  const [minValue, setMinValue] = useState(draft?.min_value ?? 0);
  const [maxValue, setMaxValue] = useState(draft?.max_value ?? 100);
  const [unit, setUnit] = useState(draft?.unit || 'USD');

  // Categorical market
  const [outcomes, setOutcomes] = useState<Array<{ id: string; label: string }>>(
    draft?.outcomes || [
      { id: '1', label: '' },
      { id: '2', label: '' }
    ]
  );

  // Load resolvers
  useEffect(() => {
    const fetchResolvers = async () => {
      const { data } = await createClient()
        .from('resolvers')
        .select('*')
        .eq('is_active', true)
        .order('success_count', { ascending: false });
      if (data) setResolvers(data);
    };
    fetchResolvers();
  }, []);

  const handleSubmit = async () => {
    const data: Record<string, any> = {
      question,
      description,
      category,
      image_url: imageUrl,
      tags,
      resolution_source: resolutionSource,
      resolution_source_url: resolutionSourceUrl,
      resolution_criteria: resolutionCriteria,
      resolution_deadline: resolutionDeadline ? new Date(resolutionDeadline).toISOString() : undefined,
      resolution_config: resolutionConfig,
      oracle_type: oracleType,
      resolver_reference: selectedResolver,
      market_type: draft?.market_type,
      // Verification config
      verification_method: {
        type: oracleType,
        sources: verificationSources
      },
      required_confirmations: requiredConfirmations,
      confidence_threshold: confidenceThreshold,
      // Trading config
      trading_fee_percent: tradingFeePercent,
      trading_end_type: tradingEndType,
    };

    if (draft?.market_type === 'scalar') {
      data.min_value = minValue;
      data.max_value = maxValue;
      data.unit = unit;
    }

    if (draft?.market_type === 'categorical') {
      data.outcomes = outcomes.filter(o => o.label.trim());
    }

    await onSave(data);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addOutcome = () => {
    setOutcomes([...outcomes, { id: String(outcomes.length + 1), label: '' }]);
  };

  const removeOutcome = (index: number) => {
    if (outcomes.length > 2) {
      setOutcomes(outcomes.filter((_, i) => i !== index));
    }
  };

  const updateOutcome = (index: number, label: string) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], label };
    setOutcomes(updated);
  };

  const toggleVerificationSource = (sourceId: string) => {
    setVerificationSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const isTrusted = (resolver: any) => {
    const total = resolver.success_count + resolver.dispute_count;
    if (total === 0) return false;
    const successRate = (resolver.success_count / total) * 100;
    const disputeRate = (resolver.dispute_count / total) * 100;
    return successRate >= 95 && disputeRate <= 2;
  };

  return (
    <div className="space-y-8">
      {/* ===== BASIC INFORMATION ===== */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          মৌলিক তথ্য (Basic Information)
        </h3>

        {/* Question */}
        <div className="space-y-2">
          <Label className="text-slate-300">মার্কেট প্রশ্ন (Market Question) *</Label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="যেমন: ২০২৬ সালের ফেব্রুয়ারিতে BTC কি $১০০K পৌঁছাবে?"
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
          />
          <p className="text-xs text-slate-500">{question.length}/500 অক্ষর</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-slate-300">বিবরণ (Description)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="মার্কেটের বিস্তারিত বিবরণ লিখুন..."
            rows={3}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        {/* Category + Image URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">ক্যাটাগরি (Category) *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-slate-800">
                    {cat.bn} ({cat.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">ইমেজ URL (Image URL)</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
              />
              {imageUrl && (
                <div className="w-10 h-10 rounded border border-slate-700 overflow-hidden flex-shrink-0">
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-slate-300">ট্যাগ (Tags)</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="ট্যাগ যোগ করুন..."
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
            />
            <Button type="button" variant="outline" onClick={addTag} className="border-slate-700 text-slate-300">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} className="bg-slate-800 text-slate-300 border-slate-700 gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== SCALAR MARKET CONFIG ===== */}
      {draft?.market_type === 'scalar' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            স্কেলার কনফিগারেশন (Scalar Configuration)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">সর্বনিম্ন মান (Min) *</Label>
              <Input
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(Number(e.target.value))}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">সর্বোচ্চ মান (Max) *</Label>
              <Input
                type="number"
                value={maxValue}
                onChange={(e) => setMaxValue(Number(e.target.value))}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">একক (Unit)</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="USD"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORICAL MARKET CONFIG ===== */}
      {draft?.market_type === 'categorical' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            ফলাফল (Outcomes) — ন্যূনতম ২টি
          </h3>
          <div className="space-y-2">
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={outcome.label}
                  onChange={(e) => updateOutcome(index, e.target.value)}
                  placeholder={`ফলাফল ${index + 1}`}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
                />
                {outcomes.length > 2 && (
                  <Button variant="ghost" size="sm" onClick={() => removeOutcome(index)} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOutcome} className="border-slate-700 text-slate-300 hover:text-white">
              <Plus className="w-4 h-4 mr-1" /> ফলাফল যোগ করুন
            </Button>
          </div>
        </div>
      )}

      {/* ===== RESOLUTION CRITERIA ===== */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          সমাধানের মানদণ্ড (Resolution Criteria)
        </h3>

        <div className="space-y-2">
          <Label className="text-slate-300">সমাধানের পদ্ধতি (Resolution Method) *</Label>
          <Select
            value={resolutionConfig.method}
            onValueChange={(val: any) => setResolutionConfig(prev => ({ ...prev, method: val }))}
          >
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="পদ্ধতি নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="AI Oracle" className="text-white hover:bg-slate-800">
                <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> এআই ওরাকল (AI Oracle)</span>
              </SelectItem>
              <SelectItem value="Expert Panel" className="text-white hover:bg-slate-800">
                <span className="flex items-center gap-2"><Users className="w-3 h-3" /> বিশেষজ্ঞ প্যানেল (Expert Panel)</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">সমাধানের উৎস (Resolution Source)</Label>
            <Input
              value={resolutionSource}
              onChange={(e) => setResolutionSource(e.target.value)}
              placeholder="যেমন: CoinGecko, ESPN, Reuters"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">উৎস URL</Label>
            <Input
              value={resolutionSourceUrl}
              onChange={(e) => setResolutionSourceUrl(e.target.value)}
              placeholder="https://..."
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">সমাধানের মানদণ্ড (Resolution Criteria) *</Label>
          <Textarea
            value={resolutionCriteria}
            onChange={(e) => setResolutionCriteria(e.target.value)}
            placeholder="এই মার্কেটটি কিভাবে সমাধান করা হবে তার বিস্তারিত বিবরণ দিন..."
            rows={3}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">সমাধানের সময়সীমা (Resolution Deadline) *</Label>
            <Input
              type="datetime-local"
              value={resolutionDeadline}
              onChange={(e) => setResolutionDeadline(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">ট্রেডিং শেষ ধরন (Trading End Type)</Label>
            <Select value={tradingEndType} onValueChange={(val: any) => setTradingEndType(val)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="date" className="text-white hover:bg-slate-800">
                  <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> তারিখ অনুযায়ী (By Date)</span>
                </SelectItem>
                <SelectItem value="manual" className="text-white hover:bg-slate-800">
                  <span className="flex items-center gap-2"><Users className="w-3 h-3" /> ম্যানুয়াল বন্ধ (Manual Close)</span>
                </SelectItem>
                <SelectItem value="event_triggered" className="text-white hover:bg-slate-800">
                  <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> ইভেন্ট ট্রিগার (Event Triggered)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ===== RESOLVERS REGISTRY ===== */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          রেজোলিউশন অথরিটি (Resolvers Registry)
        </h3>
        <p className="text-sm text-slate-400">নিবন্ধিত রেজোলিউশন কর্তৃপক্ষ নির্বাচন করুন</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resolvers.map((resolver) => {
            const isSelected = selectedResolver === resolver.address;
            const trusted = isTrusted(resolver);
            return (
              <button
                key={resolver.address}
                onClick={() => {
                  setSelectedResolver(resolver.address);
                  // Auto-set oracle type if it matches
                  if (resolver.type === 'AI_ORACLE') setOracleType('AI');
                  if (resolver.type === 'MANUAL_ADMIN') setOracleType('MANUAL');
                  if (resolver.type === 'UMA') setOracleType('UMA');
                  if (resolver.type === 'Chainlink') setOracleType('CHAINLINK');
                }}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-all text-left relative overflow-hidden",
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-white">{resolver.name}</p>
                    {trusted && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] py-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> ট্রাস্টেড
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] opacity-70 mb-2 line-clamp-1">{resolver.description}</p>
                  <div className="flex items-center gap-3 text-[10px] font-mono opacity-50">
                    <span>Type: {resolver.type}</span>
                    <span>Success: {resolver.success_count}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== VERIFICATION & ORACLE CONFIGURATION ===== */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-violet-400" />
          উন্নত যাচাইকরণ কনফিগারেশন
        </h3>

        {/* Oracle Type */}
        <div className="space-y-2">
          <Label className="text-slate-300">ওরাকল মেকানিজম (Oracle Mechanism)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ORACLE_TYPES.map((oracle) => {
              const OIcon = oracle.icon;
              const isSelected = oracleType === oracle.id;
              return (
                <button
                  key={oracle.id}
                  onClick={() => setOracleType(oracle.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    isSelected
                      ? "border-violet-500 bg-violet-500/10 text-violet-300"
                      : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500"
                  )}
                >
                  <OIcon className={cn("w-5 h-5", isSelected ? "text-violet-400" : "text-slate-500")} />
                  <div>
                    <p className="text-sm font-medium">{oracle.name}</p>
                    <p className="text-[10px] opacity-70">{oracle.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Required Confirmations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">প্রয়োজনীয় নিশ্চিতকরণ (Required Confirmations)</Label>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              {requiredConfirmations} / 5
            </Badge>
          </div>
          <Slider
            value={[requiredConfirmations]}
            onValueChange={([val]) => setRequiredConfirmations(val)}
            min={1}
            max={5}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>১টি (দ্রুত)</span>
            <span>৩টি (স্ট্যান্ডার্ড)</span>
            <span>৫টি (সর্বাধিক নিরাপদ)</span>
          </div>
        </div>

        {/* Confidence Threshold (for AI oracle) */}
        {(oracleType === 'AI' || oracleType === 'MULTI') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">AI কনফিডেন্স থ্রেশহোল্ড (Confidence Threshold)</Label>
              <Badge className={cn(
                "border",
                confidenceThreshold >= 90 ? "bg-green-500/20 text-green-300 border-green-500/30" :
                  confidenceThreshold >= 70 ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                    "bg-red-500/20 text-red-300 border-red-500/30"
              )}>
                {confidenceThreshold}%
              </Badge>
            </div>
            <Slider
              value={[confidenceThreshold]}
              onValueChange={([val]) => setConfidenceThreshold(val)}
              min={50}
              max={99}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Verification Sources */}
        <div className="space-y-3">
          <Label className="text-slate-300">যাচাইকরণ উৎস (Verification Sources)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {VERIFICATION_SOURCES.map((source) => {
              const isSelected = verificationSources.includes(source.id);
              return (
                <button
                  key={source.id}
                  onClick={() => toggleVerificationSource(source.id)}
                  className={cn(
                    "p-2 rounded-lg border text-left transition-all text-sm",
                    isSelected
                      ? "border-violet-500 bg-violet-500/10 text-violet-300"
                      : "border-slate-700 bg-slate-900/50 text-slate-500 hover:border-slate-500"
                  )}
                >
                  <p className="font-medium text-xs">{source.label}</p>
                  <p className="text-[10px] opacity-60">{source.labelEn}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== TRADING FEE ===== */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Percent className="w-5 h-5 text-emerald-400" />
          ট্রেডিং ফি (Trading Fee)
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <Slider
              value={[tradingFeePercent]}
              onValueChange={([val]) => setTradingFeePercent(val)}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>০%</span>
              <span>২% (স্ট্যান্ডার্ড)</span>
              <span>১০%</span>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-lg px-3 py-1">
            {tradingFeePercent.toFixed(1)}%
          </Badge>
        </div>
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
          disabled={isSaving}
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
