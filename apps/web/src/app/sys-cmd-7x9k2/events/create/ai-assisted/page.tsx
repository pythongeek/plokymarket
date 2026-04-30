/**
 * AI-Assisted Event Creator (Mode 2)
 * Complete AI-powered event generation
 * Bangladesh Context + Upstash Workflow
 * Optimized for Vercel Free Tier
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calendar,
  Tag,
  FileText,
  Lightbulb,
  Globe,
  Loader2,
  Clock,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Bangladesh Categories with icons
const BD_CATEGORIES = [
  { value: 'sports', label: 'খেলাধুলা', icon: '🏏', color: 'bg-green-100 text-green-800' },
  { value: 'politics', label: 'রাজনীতি', icon: '🏛️', color: 'bg-blue-100 text-blue-800' },
  { value: 'economy', label: 'অর্থনীতি', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'entertainment', label: 'বিনোদন', icon: '🎬', color: 'bg-purple-100 text-purple-800' },
  { value: 'technology', label: 'প্রযুক্তি', icon: '💻', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'international', label: 'আন্তর্জাতিক', icon: '🌍', color: 'bg-orange-100 text-orange-800' },
  { value: 'social', label: 'সামাজিক', icon: '👥', color: 'bg-pink-100 text-pink-800' },
  { value: 'weather', label: 'আবহাওয়া', icon: '🌦️', color: 'bg-cyan-100 text-cyan-800' }
];

interface AISuggestion {
  id: string;
  suggested_title: string;
  suggested_question: string;
  suggested_description: string;
  suggested_category: string;
  suggested_subcategory: string;
  suggested_tags: string[];
  trending_score: number;
  confidence_score: number;
  ai_reasoning: string;
  source_urls: string[];
  suggested_trading_end: string;
  workflow_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  generated_at: string;
}

export default function AIAssistedCreator() {
  const router = useRouter();
  
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [variations, setVariations] = useState(3);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<string>('');

  // Generate AI suggestions via Upstash Workflow
  const generateSuggestions = async () => {
    if (!topic.trim()) {
      setError('দয়া করে একটি টপিক লিখুন');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setWorkflowStatus('🔄 Upstash Workflow শুরু হচ্ছে...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('অনুগ্রহ করে লগইন করুন');
      }

      // Call Edge API which triggers Upstash Workflow
      const response = await fetch('/api/ai/generate-topic-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          topic: topic.trim(),
          context: context.trim(),
          variations: Math.min(Math.max(variations, 1), 5),
          user_id: session.user.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'সাজেশন জেনারেট করতে ব্যর্থ');
      }

      setWorkflowStatus(`✅ Workflow ট্রিগার হয়েছে: ${result.workflow_run_id}`);
      
      // Poll for results
      await pollForResults(result.workflow_run_id, session.access_token);

    } catch (err: any) {
      setError(err.message);
      setWorkflowStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Poll for workflow results
  const pollForResults = async (workflowId: string, token: string) => {
    setWorkflowStatus('⏳ AI প্রসেসিং চলছে... (সর্বোচ্চ ৩০ সেকেন্ড)');
    
    const maxAttempts = 30;
    let attempts = 0;
    
    const checkStatus = async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/ai/workflow-status?workflow_id=${workflowId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (result.status === 'completed' && result.suggestions) {
          setSuggestions(result.suggestions);
          setSuccess(`✨ ${result.suggestions.length}টি AI সাজেশন তৈরি হয়েছে!`);
          setWorkflowStatus('');
          return;
        }
        
        if (result.status === 'failed') {
          setError('AI প্রসেসিং ব্যর্থ হয়েছে');
          setWorkflowStatus('');
          return;
        }
        
        if (attempts < maxAttempts) {
          setWorkflowStatus(`⏳ প্রসেসিং চলছে... (${attempts}/${maxAttempts})`);
          setTimeout(checkStatus, 1000);
        } else {
          setError('সময় শেষ। আবার চেষ্টা করুন।');
          setWorkflowStatus('');
        }
        
      } catch (err) {
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000);
        }
      }
    };
    
    checkStatus();
  };

  // Create event from suggestion
  const createEventFromSuggestion = async (suggestion: AISuggestion) => {
    setIsCreating(suggestion.id);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/events/create-from-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          suggestion_id: suggestion.id,
          workflow_id: suggestion.workflow_id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ইভেন্ট তৈরি করতে ব্যর্থ');
      }

      setSuccess('✅ ইভেন্ট সফলভাবে তৈরি হয়েছে!');
      
      // Update local state
      setSuggestions(prev => 
        prev.map(s => s.id === suggestion.id ? { ...s, status: 'converted' } : s)
      );
      
      // Redirect after delay
      setTimeout(() => {
        router.push(`/sys-cmd-7x9k2/events/${result.event_id}`);
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(null);
    }
  };

  // Reject suggestion
  const rejectSuggestion = async (suggestionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      await fetch('/api/ai/reject-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ suggestion_id: suggestionId })
      });

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      setSuccess('সাজেশন প্রত্যাখ্যান করা হয়েছে');
      
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  // Get category info
  const getCategoryInfo = (cat: string) => {
    return BD_CATEGORIES.find(c => c.value === cat) || BD_CATEGORIES[0];
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-500" />
          AI-Assisted Event Creator
        </h1>
        <p className="text-muted-foreground">
          Gemini AI দিয়ে স্বয়ংক্রিয়ভাবে ইভেন্ট জেনারেট করুন - বাংলাদেশ কনটেক্স্ট
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            আপনার টপিক বলুন
          </CardTitle>
          <CardDescription>
            AI বুঝতে পারে এমন সহজ বাংলা/ইংরেজিতে লিখুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic">মূল টপিক *</Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="যেমন: 'আগামী BPL ফাইনালে কুমিল্লা জিতবে কি?', 'Bitcoin ২০২৬ এ $100K হবে?', 'ঢাকা সিটি নির্বাচনে কে জিতবে?'"
              rows={3}
              className="mt-1 text-lg"
            />
          </div>

          <div>
            <Label htmlFor="context">অতিরিক্ত কনটেক্সট (ঐচ্ছিক)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="যেমন: 'বিপিএল ২০২৪, কুমিল্লা ভিক্টোরিয়ান্স দল, ফাইনাল ম্যাচ'"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="variations">সাজেশন সংখ্যা</Label>
              <Input
                id="variations"
                type="number"
                min={1}
                max={5}
                value={variations}
                onChange={(e) => setVariations(parseInt(e.target.value) || 3)}
                className="w-24 mt-1"
              />
            </div>
            
            <div className="flex-1" />
            
            <Button
              onClick={generateSuggestions}
              disabled={isGenerating || !topic.trim()}
              size="lg"
              className="mt-6"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  জেনারেট হচ্ছে...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI সাজেশন জেনারেট করুন
                </>
              )}
            </Button>
          </div>

          {workflowStatus && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded">
              <Loader2 className="w-4 h-4 animate-spin" />
              {workflowStatus}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions List */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              AI সাজেশন ({suggestions.length})
            </h2>

            {suggestions.map((suggestion, index) => {
              const category = getCategoryInfo(suggestion.suggested_category);
              
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{category.icon}</span>
                        <h3 className="text-xl font-bold">
                          {suggestion.suggested_title}
                        </h3>
                        <Badge className={category.color}>
                          {category.label}
                        </Badge>
                        {suggestion.suggested_subcategory && (
                          <Badge variant="outline">
                            {suggestion.suggested_subcategory}
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg text-primary font-medium">
                        {suggestion.suggested_question}
                      </p>
                    </div>

                    {/* Scores */}
                    <div className="flex gap-4 ml-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {suggestion.confidence_score}%
                        </div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 mr-1" />
                          {suggestion.trending_score}
                        </div>
                        <div className="text-xs text-muted-foreground">Trending</div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-4">
                    {suggestion.suggested_description}
                  </p>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        ট্রেডিং শেষ: {new Date(suggestion.suggested_trading_end).toLocaleDateString('bn-BD')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        জেনারেটেড: {new Date(suggestion.generated_at).toLocaleTimeString('bn-BD')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span>
                        সোর্স: {suggestion.source_urls.length}টি
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <div className="flex gap-1 flex-wrap">
                      {suggestion.suggested_tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-blue-600 mb-1">
                          AI বিশ্লেষণ:
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {suggestion.ai_reasoning}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Source URLs */}
                  {suggestion.source_urls.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        রেফারেন্স সোর্স:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.source_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                          >
                            {new URL(url).hostname.replace('www.', '')}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => createEventFromSuggestion(suggestion)}
                      disabled={isCreating === suggestion.id || suggestion.status === 'converted'}
                      className="flex-1"
                    >
                      {isCreating === suggestion.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          তৈরি হচ্ছে...
                        </>
                      ) : suggestion.status === 'converted' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          তৈরি হয়েছে
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          এই ইভেন্ট তৈরি করুন
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => rejectSuggestion(suggestion.id)}
                      disabled={isCreating === suggestion.id}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {suggestions.length === 0 && !isGenerating && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-12 h-12 text-purple-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">AI সাজেশন শুরু করুন</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            উপরের বক্সে একটি টপিক লিখুন এবং "AI সাজেশন জেনারেট করুন" বাটনে ক্লিক করুন। 
            Gemini AI আপনার জন্য বাংলাদেশ কনটেক্স্টে ইভেন্ট সাজেশন তৈরি করবে।
          </p>
          
          {/* Example Topics */}
          <div className="mt-8">
            <p className="text-sm text-muted-foreground mb-3">উদাহরণ টপিক:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'বিপিএল ফাইনাল',
                'Bitcoin দাম',
                'ঢাকা সিটি নির্বাচন',
                'ডলার রেট',
                'IPL চ্যাম্পিয়ন'
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setTopic(ex)}
                  className="text-sm px-3 py-1 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
