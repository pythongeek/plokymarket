/**
 * Hybrid Event Creator (Mode 3)
 * Manual Control + AI Assistance
 * Field-level suggestions with Bangladesh context
 * Vercel Edge + Upstash Workflow optimized
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles, 
  Edit3, 
  Lightbulb,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
  Wand2,
  Loader2,
  AlertCircle,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Bangladesh Categories
const BD_CATEGORIES = [
  { value: 'sports', label: 'খেলাধুলা', icon: '🏏' },
  { value: 'politics', label: 'রাজনীতি', icon: '🏛️' },
  { value: 'economy', label: 'অর্থনীতি', icon: '💰' },
  { value: 'entertainment', label: 'বিনোদন', icon: '🎬' },
  { value: 'technology', label: 'প্রযুক্তি', icon: '💻' },
  { value: 'international', label: 'আন্তর্জাতিক', icon: '🌍' },
  { value: 'social', label: 'সামাজিক', icon: '👥' },
  { value: 'weather', label: 'আবহাওয়া', icon: '🌦️' }
];

interface FieldSuggestion {
  value: string;
  confidence: number;
  reasoning: string;
  alternatives?: string[];
}

interface SuggestionsState {
  name?: FieldSuggestion;
  question?: FieldSuggestion;
  description?: FieldSuggestion;
  category?: FieldSuggestion;
  subcategory?: FieldSuggestion;
  tags?: FieldSuggestion;
  trading_closes_at?: FieldSuggestion;
}

interface FormData {
  name: string;
  question: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  trading_closes_at: string;
  resolution_delay_hours: number;
  initial_liquidity: number;
  image_url: string;
  resolution_method: 'manual_admin' | 'ai_oracle' | 'expert_panel';
}

export default function HybridEventCreator() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    question: '',
    description: '',
    category: 'sports',
    subcategory: '',
    tags: [],
    trading_closes_at: '',
    resolution_delay_hours: 24,
    initial_liquidity: 1000,
    image_url: '',
    resolution_method: 'manual_admin'
  });

  const [suggestions, setSuggestions] = useState<SuggestionsState>({});
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce timer for auto-suggest
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Generate suggestion for specific field
  const generateFieldSuggestion = useCallback(async (field: keyof FormData) => {
    if (generatingField) return;
    
    setGeneratingField(field);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/ai/suggest-field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          field,
          current_data: formData,
          context: 'bangladesh'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'সাজেশন তৈরি করতে ব্যর্থ');
      }

      setSuggestions(prev => ({
        ...prev,
        [field]: result.suggestion
      }));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingField(null);
    }
  }, [formData, generatingField]);

  // Auto-suggest on field change (debounced)
  const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear suggestion if field is modified
    if (appliedFields.has(field)) {
      setAppliedFields(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }

    // Auto-trigger for text fields after 2 seconds of inactivity
    if (['name', 'question', 'description'].includes(field) && typeof value === 'string' && value.length >= 15) {
      if (debounceTimer) clearTimeout(debounceTimer);
      
      const timer = setTimeout(() => {
        if (!appliedFields.has(field)) {
          generateFieldSuggestion(field as keyof FormData);
        }
      }, 2000);
      
      setDebounceTimer(timer);
    }
  }, [appliedFields, debounceTimer, generateFieldSuggestion]);

  // Apply suggestion to field
  const applySuggestion = useCallback((field: keyof FormData) => {
    const suggestion = suggestions[field];
    if (!suggestion) return;

    let value = suggestion.value;
    
    // Handle array fields
    if (field === 'tags') {
      value = suggestion.value.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    setAppliedFields(prev => new Set(prev).add(field));
    
    // Remove applied suggestion
    setSuggestions(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, [suggestions]);

  // Auto-fill entire form
  const autoFillForm = useCallback(async () => {
    if (!formData.name || formData.name.length < 10) {
      setError('অন্তত ১০ অক্ষরের একটি শিরোনাম দিন');
      return;
    }

    setAutoFilling(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/ai/auto-fill-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          topic: formData.name,
          partial_data: formData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'অটো-ফিল করতে ব্যর্থ');
      }

      setFormData(prev => ({
        ...prev,
        ...result.form_data
      }));
      
      setAppliedFields(new Set(Object.keys(result.form_data)));
      setSuccess('✨ AI সম্পূর্ণ ফর্ম পূরণ করেছে!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setAutoFilling(false);
    }
  }, [formData.name]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.name || formData.name.length < 10) {
      setError('শিরোনাম কমপক্ষে ১০ অক্ষর হতে হবে');
      return;
    }
    if (!formData.question || formData.question.length < 20) {
      setError('প্রশ্ন কমপক্ষে ২০ অক্ষর হতে হবে');
      return;
    }
    if (!formData.trading_closes_at) {
      setError('ট্রেডিং শেষের তারিখ প্রয়োজন');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          event_data: {
            ...formData,
            slug: formData.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').substring(0, 100)
          },
          resolution_config: {
            primary_method: formData.resolution_method,
            ai_keywords: formData.tags,
            confidence_threshold: 85
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ইভেন্ট তৈরি করতে ব্যর্থ');
      }

      setSuccess('✅ ইভেন্ট সফলভাবে তৈরি হয়েছে!');
      
      setTimeout(() => {
        router.push(`/sys-cmd-7x9k2/events/${result.event_id}`);
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, router]);

  // Render suggestion card
  const renderSuggestion = (field: keyof FormData, label: string) => {
    const suggestion = suggestions[field];
    if (!suggestion || appliedFields.has(field)) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border border-purple-200 dark:border-purple-800"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
              AI সাজেশন
            </span>
            <Badge variant="secondary" className="text-xs">
              {suggestion.confidence}% নিশ্চিত
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => generateFieldSuggestion(field)}>
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={() => applySuggestion(field)}>
              <CheckCircle className="w-3 h-3 mr-1" />
              Apply
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
          {suggestion.value}
        </p>
        
        <p className="text-xs text-purple-600 dark:text-purple-400">
          <Lightbulb className="w-3 h-3 inline mr-1" />
          {suggestion.reasoning}
        </p>

        {suggestion.alternatives && suggestion.alternatives.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestion.alternatives.map((alt, i) => (
              <button
                key={i}
                onClick={() => setSuggestions(prev => ({
                  ...prev,
                  [field]: { ...suggestion, value: alt }
                }))}
                className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
              >
                {alt}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-blue-500" />
          Hybrid Event Creator
          <Sparkles className="w-6 h-6 text-purple-500" />
        </h1>
        <p className="text-muted-foreground">
          ম্যানুয়াল কন্ট্রোল + AI সাহায্য - সেরা দুই জগত একসাথে
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

      {/* AI Assistant Bar */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-950 dark:via-blue-950 dark:to-cyan-950">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  {appliedFields.size > 0 
                    ? `${appliedFields.size}টি ফিল্ড AI দিয়ে পূরণ করা হয়েছে`
                    : 'ফিল্ডে <Sparkles /> আইকনে ক্লিক করুন অথবা টাইপ করতে থাকুন'
                  }
                </p>
              </div>
            </div>
            
            <Button
              onClick={autoFillForm}
              disabled={autoFilling || !formData.name || formData.name.length < 10}
              variant="outline"
              className="bg-white dark:bg-gray-900"
            >
              {autoFilling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  পূরণ হচ্ছে...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  সম্পূর্ণ ফর্ম Auto-Fill
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title Field */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  শিরোনাম *
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generateFieldSuggestion('name')}
                  disabled={generatingField === 'name'}
                >
                  {generatingField === 'name' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="যেমন: BPL 2024 ফাইনালে কুমিল্লা জিতবে?"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.name.length}/200 অক্ষর
              </p>
              {renderSuggestion('name', 'শিরোনাম')}
            </CardContent>
          </Card>

          {/* Question Field */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  প্রশ্ন (Yes/No) *
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generateFieldSuggestion('question')}
                  disabled={generatingField === 'question'}
                >
                  {generatingField === 'question' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.question}
                onChange={(e) => handleFieldChange('question', e.target.value)}
                placeholder="পরিষ্কার Yes/No প্রশ্ন লিখুন..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.question.length}/500 অক্ষর
              </p>
              {renderSuggestion('question', 'প্রশ্ন')}
            </CardContent>
          </Card>

          {/* Description Field */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  বিবরণ
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generateFieldSuggestion('description')}
                  disabled={generatingField === 'description'}
                >
                  {generatingField === 'description' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="ইভেন্টের বিস্তারিত বিবরণ..."
                rows={4}
              />
              {renderSuggestion('description', 'বিবরণ')}
            </CardContent>
          </Card>

          {/* Category & Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ক্যাটাগরি এবং ট্যাগ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ক্যাটাগরি</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleFieldChange('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BD_CATEGORIES.map((cat) => (
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
                  <Input
                    value={formData.subcategory}
                    onChange={(e) => handleFieldChange('subcategory', e.target.value)}
                    placeholder="যেমন: BPL, IPL"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>ট্যাগ (কমা দিয়ে আলাদা করুন)</Label>
                <Input
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleFieldChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="ক্রিকেট, BPL, কুমিল্লা, বিপিএল"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4" />
                সময় সেটিংস
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ট্রেডিং শেষের তারিখ *</Label>
                <Input
                  type="datetime-local"
                  value={formData.trading_closes_at}
                  onChange={(e) => handleFieldChange('trading_closes_at', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>রেজোলিউশন ডিলে (ঘণ্টা)</Label>
                  <Input
                    type="number"
                    value={formData.resolution_delay_hours}
                    onChange={(e) => handleFieldChange('resolution_delay_hours', parseInt(e.target.value) || 24)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>প্রাথমিক লিকুইডিটি</Label>
                  <Input
                    type="number"
                    value={formData.initial_liquidity}
                    onChange={(e) => handleFieldChange('initial_liquidity', parseInt(e.target.value) || 1000)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">রেজোলিউশন পদ্ধতি</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.resolution_method}
                onValueChange={(value: any) => handleFieldChange('resolution_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_admin">ম্যানুয়াল অ্যাডমিন</SelectItem>
                  <SelectItem value="ai_oracle">AI Oracle</SelectItem>
                  <SelectItem value="expert_panel">বিশেষজ্ঞ প্যানেল</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Stats */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI স্ট্যাটাস
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">AI ফিল্ডস:</span>
                <Badge variant={appliedFields.size > 0 ? "default" : "secondary"}>
                  {appliedFields.size}/8
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">গড় Confidence:</span>
                <span className="font-semibold">
                  {Object.values(suggestions).length > 0
                    ? Math.round(
                        Object.values(suggestions).reduce((sum, s) => sum + (s?.confidence || 0), 0) / 
                        Object.values(suggestions).length
                      )
                    : 0}%
                </span>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-medium mb-2">টিপস:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• টাইপ করতে থাকুন - AI অটো সাজেশন দেবে</li>
                  <li>• <Sparkles className="w-3 h-3 inline" /> আইকনে ক্লিক করুন</li>
                  <li>• Alternative options দেখুন</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ইভেন্ট তৈরি করুন
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
