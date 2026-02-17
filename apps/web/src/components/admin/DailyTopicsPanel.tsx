/**
 * Admin Daily Topics Panel
 * Manage AI-generated daily topics
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Sparkles,
  Calendar,
  Tag,
  Trash2,
  Play,
  Settings,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DailyTopic {
  id: string;
  suggested_title: string;
  suggested_category: string;
  suggested_description: string;
  suggested_question: string;
  ai_reasoning: string;
  ai_confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  generated_at: string;
  approved_at?: string;
  market_id?: string;
  rejected_reason?: string;
}

interface AISettings {
  custom_instruction: string;
  target_region: string;
  default_categories: string[];
  auto_generate_enabled: boolean;
  auto_generate_time: string;
  max_daily_topics: number;
  gemini_model: string;
}

export function DailyTopicsPanel() {
  const { t } = useTranslation();
  const [topics, setTopics] = useState<DailyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<DailyTopic | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [tradingClosesAt, setTradingClosesAt] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  // AI Generation Config
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Sports', 'Politics', 'Economy']);
  const [generateCount, setGenerateCount] = useState(5);
  const [showConfig, setShowConfig] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [autoGenerateTime, setAutoGenerateTime] = useState('06:00');

  const fetchTopics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/admin/daily-topics?status=${activeTab}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const data = await response.json();
      setTopics(data.topics || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/ai-config', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setCustomPrompt(data.settings?.custom_instruction || '');
        setSelectedCategories(data.settings?.default_categories || ['Sports', 'Politics', 'Economy']);
        setGenerateCount(data.settings?.max_daily_topics || 5);
        setAutoGenerate(data.settings?.auto_generate_enabled || false);
        setAutoGenerateTime(data.settings?.auto_generate_time?.slice(0, 5) || '06:00');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchSettings();
  }, [activeTab]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/generate-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          custom_prompt: customPrompt,
          categories: selectedCategories,
          count: generateCount,
          admin_id: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate topics');
      }

      const data = await response.json();
      setSuccess(`Generated ${data.generated} new topics`);
      fetchTopics();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          custom_instruction: customPrompt,
          default_categories: selectedCategories,
          max_daily_topics: generateCount,
          auto_generate_enabled: autoGenerate,
          auto_generate_time: autoGenerateTime + ':00',
          admin_id: user?.id
        })
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      setSuccess('Settings saved successfully' + (autoGenerate ? ' - Auto-generation enabled!' : ''));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async () => {
    if (!selectedTopic || !tradingClosesAt) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/daily-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          topic_id: selectedTopic.id,
          action: 'approve',
          market_data: {
            trading_closes_at: tradingClosesAt
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve topic');
      }

      setSuccess('Topic approved and market created');
      setApproveDialogOpen(false);
      setSelectedTopic(null);
      setTradingClosesAt('');
      fetchTopics();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTopic) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/daily-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          topic_id: selectedTopic.id,
          action: 'reject',
          rejection_reason: rejectionReason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject topic');
      }

      setSuccess('Topic rejected');
      setRejectDialogOpen(false);
      setSelectedTopic(null);
      setRejectionReason('');
      fetchTopics();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/admin/daily-topics?id=${topicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete topic');
      }

      setSuccess('Topic deleted');
      fetchTopics();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Daily Topics</h2>
          <p className="text-muted-foreground">Manage AI-generated prediction market topics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTopics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowConfig(!showConfig)}>
            <Settings className="w-4 h-4 mr-2" />
            {showConfig ? 'Hide Config' : 'Configure'}
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Now
          </Button>
        </div>
      </div>

      {/* AI Configuration Panel */}
      {showConfig && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              AI Generation Configuration
            </CardTitle>
            <CardDescription>
              Customize how AI generates prediction market topics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Custom Prompt */}
            <div className="space-y-2">
              <Label htmlFor="custom-prompt">Custom Instruction (Optional)</Label>
              <Textarea
                id="custom-prompt"
                placeholder="e.g., Focus on upcoming BPL cricket matches and political events..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="bg-white"
              />
              <p className="text-xs text-muted-foreground">
                Add specific instructions to guide the AI topic generation
              </p>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {['Sports', 'Politics', 'Economy', 'Entertainment', 'Technology', 'International'].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedCategories(prev => 
                        prev.includes(cat) 
                          ? prev.filter(c => c !== cat)
                          : [...prev, cat]
                      );
                    }}
                  >
                    {selectedCategories.includes(cat) && <CheckCircle className="w-3 h-3 mr-1" />}
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div className="space-y-2">
              <Label htmlFor="topic-count">Number of Topics to Generate</Label>
              <Input
                id="topic-count"
                type="number"
                min={1}
                max={10}
                value={generateCount}
                onChange={(e) => setGenerateCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
                className="w-32 bg-white"
              />
            </div>

            {/* Auto Generate */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-generate" className="font-medium">Auto-Generate Daily</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate topics every day at 6:00 AM
                  </p>
                </div>
                <Button
                  variant={autoGenerate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoGenerate(!autoGenerate)}
                >
                  {autoGenerate ? (
                    <><CheckCircle className="w-4 h-4 mr-1" /> Enabled</>
                  ) : (
                    'Disabled'
                  )}
                </Button>
              </div>
              
              {autoGenerate && (
                <div className="space-y-2">
                  <Label htmlFor="auto-time">Generation Time (Bangladesh Time)</Label>
                  <Input
                    id="auto-time"
                    type="time"
                    value={autoGenerateTime}
                    onChange={(e) => setAutoGenerateTime(e.target.value)}
                    className="w-32 bg-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    Topics will be generated automatically at this time daily
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveSettings} variant="outline" className="flex-1">
                Save as Default
              </Button>
              <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate {generateCount} Topics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {topics.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No topics found in this category
                </CardContent>
              </Card>
            ) : (
              topics.map((topic) => (
                <Card key={topic.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight mb-2">
                          {topic.suggested_title}
                        </CardTitle>
                        <p className="text-sm font-medium text-primary mb-2">
                          {topic.suggested_question}
                        </p>
                        <CardDescription className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {topic.suggested_category}
                          </span>
                          <span>AI Confidence: {(topic.ai_confidence * 100).toFixed(0)}%</span>
                          <span>Generated: {new Date(topic.generated_at).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(topic.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {topic.suggested_description}
                    </p>
                    
                    {topic.ai_reasoning && (
                      <p className="text-xs text-blue-600 mb-4 bg-blue-50 p-2 rounded">
                        <Lightbulb className="w-3 h-3 inline mr-1" />
                        {topic.ai_reasoning}
                      </p>
                    )}

                    {topic.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedTopic(topic);
                            // Set default trading close date to 7 days from now
                            const defaultDate = new Date();
                            defaultDate.setDate(defaultDate.getDate() + 7);
                            setTradingClosesAt(defaultDate.toISOString().slice(0, 16));
                            setApproveDialogOpen(true);
                          }}
                          className="flex-1 bg-green-50 hover:bg-green-100 border-green-200"
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedTopic(topic);
                            setRejectDialogOpen(true);
                          }}
                          className="flex-1 bg-red-50 hover:bg-red-100 border-red-200"
                        >
                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(topic.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {topic.status === 'approved' && topic.market_id && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Market created: {topic.market_id.slice(0, 8)}...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Topic</DialogTitle>
            <DialogDescription>
              This will create a new prediction market from this topic.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedTopic?.suggested_title}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedTopic?.suggested_question}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trading-closes">Trading Closes At</Label>
              <Input
                id="trading-closes"
                type="datetime-local"
                value={tradingClosesAt}
                onChange={(e) => setTradingClosesAt(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading || !tradingClosesAt} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve & Create Market
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Topic</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this topic (optional).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedTopic?.suggested_title}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedTopic?.suggested_question}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason (Optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Why are you rejecting this topic?"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={actionLoading} variant="destructive">
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
