'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Calendar,
  FileText,
  Tag,
  DollarSign,
  Users,
  Eye,
  Cpu,
  SlidersHorizontal,
  AlertCircle,
  Check,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EventCreationPanelProps {
  onEventCreated?: (eventId: string) => void;
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
  { id: 'UMA', name: 'UMA অপটিমিস্টিক', nameEn: 'UMA Optimistic', description: 'বিকেন্দ্রীভূত অপটিমিস্টিক ওরাকল', icon: SlidersHorizontal },
  { id: 'CHAINLINK', name: 'Chainlink', nameEn: 'Chainlink', description: 'বিকেন্দ্রীভূত ডেটা ফিড', icon: SlidersHorizontal },
  { id: 'MULTI', name: 'মাল্টি-সোর্স', nameEn: 'Multi-Source', description: 'একাধিক উৎস থেকে যাচাইকরণ', icon: SlidersHorizontal },
];

export function EventCreationPanel({ onEventCreated }: EventCreationPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Form state
  const [eventData, setEventData] = useState({
    name: '',
    question: '',
    description: '',
    category: '',
    subcategory: '',
    tags: [] as string[],
    image_url: '',
    trading_closes_at: '',
    resolution_delay: 1440,
    initial_liquidity: 1000,
    slug: '',
    answer1: 'হ্যাঁ',
    answer2: 'না',
    is_featured: false
  });

  const [resolutionConfig, setResolutionConfig] = useState({
    primary_method: 'MANUAL',
    ai_keywords: [] as string[],
    ai_sources: [] as string[],
    confidence_threshold: 85
  });

  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !eventData.tags.includes(tagInput.trim())) {
      setEventData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setEventData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !resolutionConfig.ai_keywords.includes(keywordInput.trim())) {
      setResolutionConfig(prev => ({
        ...prev,
        ai_keywords: [...prev.ai_keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setResolutionConfig(prev => ({
      ...prev,
      ai_keywords: prev.ai_keywords.filter(k => k !== keyword)
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!eventData.name.trim()) {
      errors.push('শিরোনাম প্রয়োজন');
    } else if (eventData.name.length < 10) {
      errors.push('শিরোনাম কমপক্ষে ১০ অক্ষর হতে হবে');
    }

    if (!eventData.question.trim()) {
      errors.push('প্রশ্ন প্রয়োজন');
    } else if (eventData.question.length < 20) {
      errors.push('প্রশ্ন কমপক্ষে ২০ অক্ষর হতে হবে');
    }

    if (!eventData.category) {
      errors.push('ক্যাটাগরি প্রয়োজন');
    }

    if (!eventData.trading_closes_at) {
      errors.push('ট্রেডিং শেষের সময় প্রয়োজন');
    }

    if (!eventData.slug.trim()) {
      errors.push('স্লাগ প্রয়োজন');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess(false);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_data: eventData,
          resolution_config: resolutionConfig
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ইভেন্ট তৈরি করতে ব্যর্থ');
      }

      toast.success('ইভেন্ট এবং মার্কেট সফলভাবে তৈরি হয়েছে!');
      setSuccess(true);
      setEventData({
        name: '',
        question: '',
        description: '',
        category: '',
        subcategory: '',
        tags: [],
        image_url: '',
        trading_closes_at: '',
        resolution_delay: 1440,
        initial_liquidity: 1000,
        slug: '',
        answer1: 'হ্যাঁ',
        answer2: 'না',
        is_featured: false
      });
      setResolutionConfig({
        primary_method: 'MANUAL',
        ai_keywords: [],
        ai_sources: [],
        confidence_threshold: 85
      });

      if (onEventCreated && result.event_id) {
        onEventCreated(result.event_id);
      }

    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.message || 'ইভেন্ট তৈরি করতে ব্যর্থ হয়েছে');
      setErrors([error.message || 'ইভেন্ট তৈরি করতে ব্যর্থ']);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Plus className="w-6 h-6 text-blue-400" />
            নতুন ইভেন্ট তৈরি করুন
          </h2>
          <p className="text-slate-400 mt-1">
            Create a new prediction market event
          </p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          ইভেন্ট ম্যানেজমেন্ট
        </Badge>
      </div>

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-900/20 border border-red-800/50 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-red-300">ভুল</span>
            </div>
            <ul className="text-xs text-red-400/80 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-900/20 border border-green-800/50 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-300">
                ইভেন্ট সফলভাবে তৈরি হয়েছে!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              মৌলিক তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">শিরোনাম (Name) *</Label>
                <Input
                  value={eventData.name}
                  onChange={(e) => setEventData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="যেমন: বাংলাদেশ প্রিমিয়ার লিগ ২০২৬"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
                <p className="text-xs text-slate-500">{eventData.name.length}/100 অক্ষর</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">স্লাগ (Slug) *</Label>
                <Input
                  value={eventData.slug}
                  onChange={(e) => setEventData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="bangladesh-premier-league-2026"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">প্রশ্ন (Question) *</Label>
              <Textarea
                value={eventData.question}
                onChange={(e) => setEventData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="যেমন: বাংলাদেশ প্রিমিয়ার লিগ ২০২৬ এর চ্যাম্পিয়ন কে হবে?"
                rows={3}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
              />
              <p className="text-xs text-slate-500">{eventData.question.length}/500 অক্ষর</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">বিবরণ (Description)</Label>
              <Textarea
                value={eventData.description}
                onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="ইভেন্টের বিস্তারিত বিবরণ..."
                rows={3}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">ক্যাটাগরি (Category) *</Label>
                <Select value={eventData.category} onValueChange={(value) => setEventData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
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
                <Label className="text-slate-300">সাব-ক্যাটাগরি</Label>
                <Input
                  value={eventData.subcategory}
                  onChange={(e) => setEventData(prev => ({ ...prev, subcategory: e.target.value }))}
                  placeholder="যেমন: ক্রিকেট"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">ইমেজ URL</Label>
                <Input
                  value={eventData.image_url}
                  onChange={(e) => setEventData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
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
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                />
                <Button type="button" variant="outline" onClick={addTag} className="border-slate-700 text-slate-300">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {eventData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {eventData.tags.map((tag) => (
                    <Badge key={tag} className="bg-slate-800 text-slate-300 border-slate-700 gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                        <span className="text-xs">×</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resolution Configuration */}
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              সমাধান কনফিগারেশন
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">প্রাথমিক ওরাকল পদ্ধতি</Label>
                <Select value={resolutionConfig.primary_method} onValueChange={(value) => setResolutionConfig(prev => ({ ...prev, primary_method: value }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {ORACLE_TYPES.map((oracle) => {
                      const Icon = oracle.icon;
                      return (
                        <SelectItem key={oracle.id} value={oracle.id} className="text-white hover:bg-slate-800">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <div>
                              <p>{oracle.name}</p>
                              <p className="text-xs text-slate-500">{oracle.description}</p>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">AI কীওয়ার্ড</Label>
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="কীওয়ার্ড যোগ করুন..."
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600"
                  />
                  <Button type="button" variant="outline" onClick={addKeyword} className="border-slate-700 text-slate-300">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {resolutionConfig.ai_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {resolutionConfig.ai_keywords.map((keyword) => (
                      <Badge key={keyword} className="bg-slate-800 text-slate-300 border-slate-700 gap-1">
                        {keyword}
                        <button onClick={() => removeKeyword(keyword)} className="hover:text-red-400">
                          <span className="text-xs">×</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">ট্রেডিং শেষের সময় *</Label>
                <Input
                  type="datetime-local"
                  value={eventData.trading_closes_at}
                  onChange={(e) => setEventData(prev => ({ ...prev, trading_closes_at: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">সমাধানের ডিলে (মিনিট)</Label>
                <Input
                  type="number"
                  value={eventData.resolution_delay}
                  onChange={(e) => setEventData(prev => ({ ...prev, resolution_delay: parseInt(e.target.value) }))}
                  placeholder="24"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">আস্থার থ্রেশহোল্ড</Label>
                <Input
                  type="number"
                  value={resolutionConfig.confidence_threshold}
                  onChange={(e) => setResolutionConfig(prev => ({ ...prev, confidence_threshold: parseInt(e.target.value) }))}
                  placeholder="85"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">প্রাথমিক তারল্য</Label>
                <Input
                  type="number"
                  value={eventData.initial_liquidity}
                  onChange={(e) => setEventData(prev => ({ ...prev, initial_liquidity: parseInt(e.target.value) }))}
                  placeholder="1000"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">ফলাফল ১</Label>
                <Input
                  value={eventData.answer1}
                  onChange={(e) => setEventData(prev => ({ ...prev, answer1: e.target.value }))}
                  placeholder="হ্যাঁ"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>সব *</span>
            <span>প্রয়োজনীয় ফিল্ড</span>
          </div>
          <Button
            type="submit"
            disabled={isCreating}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold px-8 py-2 rounded-lg transition-all duration-200"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                তৈরি করা হচ্ছে...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                ইভেন্ট তৈরি করুন
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}