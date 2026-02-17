/**
 * Manual Event Creator (Mode 1)
 * Complete manual control for event creation
 * Optimized for Vercel Edge + Upstash Workflow
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  Eye, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Tag,
  FileText,
  Image as ImageIcon,
  Settings,
  Loader2,
  Clock,
  Coins,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Bangladesh Categories
const CATEGORIES = [
  { value: 'sports', label: 'খেলাধুলা (Sports)', icon: '🏏' },
  { value: 'politics', label: 'রাজনীতি (Politics)', icon: '🏛️' },
  { value: 'economy', label: 'অর্থনীতি (Economy)', icon: '💰' },
  { value: 'entertainment', label: 'বিনোদন (Entertainment)', icon: '🎬' },
  { value: 'technology', label: 'প্রযুক্তি (Technology)', icon: '💻' },
  { value: 'international', label: 'আন্তর্জাতিক (International)', icon: '🌍' },
  { value: 'social', label: 'সামাজিক (Social)', icon: '👥' },
  { value: 'weather', label: 'আবহাওয়া (Weather)', icon: '🌦️' }
];

// Bangladesh Sports Subcategories
const SPORTS_SUBCATEGORIES = [
  'BPL (বিপিএল)',
  'Bangladesh National Team',
  'IPL (আইপিএল)',
  'International Cricket',
  'Football (ফুটবল)',
  'Hockey (হকি)',
  'Kabaddi (কাবাডি)',
  'Tennis (টেনিস)',
  'Other Sports'
];

// Resolution Methods
const RESOLUTION_METHODS = [
  { 
    value: 'manual_admin', 
    label: 'ম্যানুয়াল অ্যাডমিন (Manual Admin)',
    description: 'অ্যাডমিন ম্যানুয়ালি রেজোলিউশন করবেন'
  },
  { 
    value: 'ai_oracle', 
    label: 'AI Oracle (স্বয়ংক্রিয়)',
    description: 'AI স্বয়ংক্রিয়ভাবে রেজোলিউশন করবে'
  },
  { 
    value: 'expert_panel', 
    label: 'বিশেষজ্ঞ প্যানেল (Expert Panel)',
    description: 'বিশেষজ্ঞদের ভোটে রেজোলিউশন'
  }
];

// Bangladesh News Sources
const BD_NEWS_SOURCES = [
  'prothomalo.com',
  'banglatribune.com',
  'dhakatribune.com',
  'bdnews24.com',
  'jugantor.com',
  'ittefaq.com.bd',
  'kalerkantho.com',
  'nayadiganta.com',
  'bbc.com/bengali',
  'cnn.com'
];

interface FormData {
  name: string;
  question: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  answer1: string;
  answer2: string;
  trading_closes_at: string;
  resolution_delay_hours: number;
  initial_liquidity: number;
  image_url: string;
  is_featured: boolean;
}

interface ResolutionConfig {
  primary_method: string;
  ai_keywords: string[];
  ai_sources: string[];
  confidence_threshold: number;
}

export default function ManualEventCreator() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    question: '',
    description: '',
    category: 'sports',
    subcategory: '',
    tags: [],
    answer1: 'হ্যাঁ (Yes)',
    answer2: 'না (No)',
    trading_closes_at: '',
    resolution_delay_hours: 24,
    initial_liquidity: 1000,
    image_url: '',
    is_featured: false
  });

  const [resolutionConfig, setResolutionConfig] = useState<ResolutionConfig>({
    primary_method: 'manual_admin',
    ai_keywords: [],
    ai_sources: ['prothomalo.com', 'bdnews24.com'],
    confidence_threshold: 85
  });

  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Validation
  const validateForm = (): boolean => {
    if (!formData.name || formData.name.length < 10) {
      setError('শিরোনাম কমপক্ষে ১০ অক্ষর হতে হবে');
      return false;
    }
    if (!formData.question || formData.question.length < 20) {
      setError('প্রশ্ন কমপক্ষে ২০ অক্ষর হতে হবে');
      return false;
    }
    if (!formData.question.includes('?') && !formData.question.includes('কি') && !formData.question.includes('হবে')) {
      setError('প্রশ্নে "?" বা "কি" বা "হবে" থাকতে হবে');
      return false;
    }
    if (!formData.trading_closes_at) {
      setError('ট্রেডিং শেষের তারিখ প্রয়োজন');
      return false;
    }
    const endDate = new Date(formData.trading_closes_at);
    const now = new Date();
    if (endDate <= now) {
      setError('শেষের তারিখ বর্তমান সময়ের পরে হতে হবে');
      return false;
    }
    if (formData.tags.length === 0) {
      setError('কমপক্ষে ১টি ট্যাগ যোগ করুন');
      return false;
    }
    return true;
  };

  // Generate slug
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Add keyword
  const addKeyword = () => {
    if (keywordInput.trim() && !resolutionConfig.ai_keywords.includes(keywordInput.trim())) {
      setResolutionConfig({ 
        ...resolutionConfig, 
        ai_keywords: [...resolutionConfig.ai_keywords, keywordInput.trim()] 
      });
      setKeywordInput('');
    }
  };

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    setResolutionConfig({ 
      ...resolutionConfig, 
      ai_keywords: resolutionConfig.ai_keywords.filter(k => k !== keyword) 
    });
  };

  // Submit handler
  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('অনুগ্রহ করে লগইন করুন');
      }

      const slug = generateSlug(formData.name);

      // Call API to create event
      const response = await fetch('/api/admin/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          event_data: {
            ...formData,
            slug,
            status: 'pending'
          },
          resolution_config: resolutionConfig
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ইভেন্ট তৈরি করতে ব্যর্থ');
      }

      setSuccess('✅ ইভেন্ট সফলভাবে তৈরি হয়েছে!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/sys-cmd-7x9k2/events/${result.event_id}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get category icon
  const getCategoryIcon = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat)?.icon || '📌';
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <span className="text-4xl">📝</span>
          নতুন ইভেন্ট তৈরি করুন (ম্যানুয়াল)
        </h1>
        <p className="text-muted-foreground">
          সম্পূর্ণ নিয়ন্ত্রণ সহ ম্যানুয়ালি ইভেন্ট তৈরি করুন - বাংলাদেশ কনটেক্স্ট
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                মূল তথ্য
              </CardTitle>
              <CardDescription>ইভেন্টের মূল তথ্য দিন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">
                  শিরোনাম (বাংলা/ইংরেজি) *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="যেমন: BPL 2024 ফাইনালে কুমিল্লা জিতবে?"
                  maxLength={200}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.name.length}/200 অক্ষর
                </p>
              </div>

              <div>
                <Label htmlFor="question">
                  প্রশ্ন (Yes/No ফরম্যাটে) *
                </Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="পরিষ্কার এবং যাচাইযোগ্য প্রশ্ন লিখুন যার উত্তর হ্যাঁ বা না হবে..."
                  rows={3}
                  maxLength={500}
                  className="mt-1"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>উদাহরণ: "বিপিএল ২০২৪ ফাইনালে কুমিল্লা ভিক্টোরিয়ান্স কি চ্যাম্পিয়ন হবে?"</span>
                  <span>{formData.question.length}/500</span>
                </div>
              </div>

              <div>
                <Label htmlFor="description">
                  বিস্তারিত বিবরণ (ঐচ্ছিক)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ইভেন্ট সম্পর্কে অতিরিক্ত তথ্য, প্রেক্ষাপট, নিয়ম..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category & Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                ক্যাটাগরি এবং ট্যাগ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>ক্যাটাগরি *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="mr-2">{cat.icon}</span>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>সাবক্যাটাগরি</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="সাবক্যাটাগরি নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.category === 'sports' ? (
                        SPORTS_SUBCATEGORIES.map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="general">সাধারণ (General)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>ট্যাগ *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="ট্যাগ লিখুন (যেমন: BPL, ক্রিকেট, ঢাকা)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    যোগ করুন
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                সময় এবং লিকুইডিটি সেটিংস
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="trading-closes">
                  ট্রেডিং শেষের তারিখ এবং সময় *
                </Label>
                <Input
                  id="trading-closes"
                  type="datetime-local"
                  value={formData.trading_closes_at}
                  onChange={(e) => setFormData({ ...formData, trading_closes_at: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  এই সময়ের পর ট্রেডিং বন্ধ হয়ে যাবে
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resolution-delay">
                    <Clock className="w-4 h-4 inline mr-1" />
                    রেজোলিউশন ডিলে (ঘণ্টা)
                  </Label>
                  <Input
                    id="resolution-delay"
                    type="number"
                    min={0}
                    max={168}
                    value={formData.resolution_delay_hours}
                    onChange={(e) => setFormData({ ...formData, resolution_delay_hours: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ট্রেডিং শেষের পর রেজোলিউশনের আগে অপেক্ষা
                  </p>
                </div>

                <div>
                  <Label htmlFor="liquidity">
                    <Coins className="w-4 h-4 inline mr-1" />
                    প্রাথমিক লিকুইডিটি
                  </Label>
                  <Input
                    id="liquidity"
                    type="number"
                    min={100}
                    max={10000}
                    step={100}
                    value={formData.initial_liquidity}
                    onChange={(e) => setFormData({ ...formData, initial_liquidity: parseInt(e.target.value) || 1000 })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                রেজোলিউশন সেটিংস
              </CardTitle>
              <CardDescription>ইভেন্ট কিভাবে রেজোলভ হবে তা নির্ধারণ করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>রেজোলিউশন পদ্ধতি</Label>
                <Select
                  value={resolutionConfig.primary_method}
                  onValueChange={(value) => setResolutionConfig({ ...resolutionConfig, primary_method: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div>
                          <div>{method.label}</div>
                          <div className="text-xs text-muted-foreground">{method.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {resolutionConfig.primary_method === 'ai_oracle' && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Oracle কনফিগারেশন
                  </h3>
                  
                  <div>
                    <Label>কীওয়ার্ড (বাংলা + ইংরেজি)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="যেমন: BPL, কুমিল্লা, Shakib"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      />
                      <Button type="button" onClick={addKeyword} variant="outline" size="sm">
                        যোগ
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {resolutionConfig.ai_keywords.map((kw) => (
                        <Badge key={kw} variant="outline" className="cursor-pointer" onClick={() => removeKeyword(kw)}>
                          {kw} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>নিউজ সোর্স</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {BD_NEWS_SOURCES.map((source) => (
                        <Badge
                          key={source}
                          variant={resolutionConfig.ai_sources.includes(source) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newSources = resolutionConfig.ai_sources.includes(source)
                              ? resolutionConfig.ai_sources.filter(s => s !== source)
                              : [...resolutionConfig.ai_sources, source];
                            setResolutionConfig({ ...resolutionConfig, ai_sources: newSources });
                          }}
                        >
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Confidence Threshold: {resolutionConfig.confidence_threshold}%</Label>
                    <input
                      type="range"
                      min="70"
                      max="99"
                      value={resolutionConfig.confidence_threshold}
                      onChange={(e) => setResolutionConfig({ 
                        ...resolutionConfig, 
                        confidence_threshold: parseInt(e.target.value) 
                      })}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">প্রিভিউ</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'প্রিভিউ লুকান' : 'প্রিভিউ দেখুন'}
              </Button>

              {showPreview && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(formData.category)}</span>
                    <Badge variant="secondary">{formData.category}</Badge>
                  </div>
                  <h3 className="font-semibold">{formData.name || 'শিরোনাম'}</h3>
                  <p className="text-sm text-muted-foreground">{formData.question || 'প্রশ্ন'}</p>
                  <div className="flex gap-2 flex-wrap">
                    {formData.tags.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-background rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <div>লিকুইডিটি: ৳{formData.initial_liquidity}</div>
                    <div>রেজোলিউশন: {RESOLUTION_METHODS.find(m => m.value === resolutionConfig.primary_method)?.label}</div>
                  </div>
                </div>
              )}

              {/* Validation Checklist */}
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium mb-2">ভ্যালিডেশন চেকলিস্ট</h3>
                {[
                  { key: 'name', label: 'শিরোনাম (১০+ অক্ষর)', valid: formData.name.length >= 10 },
                  { key: 'question', label: 'প্রশ্ন (২০+ অক্ষর)', valid: formData.question.length >= 20 },
                  { key: 'date', label: 'শেষ তারিখ', valid: !!formData.trading_closes_at },
                  { key: 'tags', label: 'ট্যাগ (১+)', valid: formData.tags.length > 0 }
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-sm">
                    {item.valid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={item.valid ? 'text-green-600' : 'text-red-600'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'ইভেন্ট তৈরি করুন'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
