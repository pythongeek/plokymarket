/**
 * AI Topic Configuration Panel
 * Admin interface for managing news sources, prompts, and generation settings
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Globe,
  Newspaper,
  Settings,
  Play,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NewsSource {
  name: string;
  url: string;
  type: 'rss' | 'api';
}

interface AIConfig {
  id?: string;
  name: string;
  description: string;
  context_type: 'bangladesh' | 'international' | 'sports' | 'custom';
  news_sources: NewsSource[];
  search_keywords: string[];
  prompt_template: string;
  ai_model: string;
  temperature: number;
  max_tokens: number;
  topics_per_generation: number;
  focus_areas: string[];
  is_active: boolean;
  generation_schedule: string;
}

const DEFAULT_PROMPT_TEMPLATE = `You are a professional prediction market analyst for {context}.

Task: Create {count} binary outcome prediction market questions (Yes/No) based on current trending topics.

Requirements:
1. Questions must be verifiable after the suggested end date
2. Focus on: {focus_areas}
3. Categories to include: {categories}
4. Use these sources for context: {sources}

Validation Rules:
- Must have clear Yes/No outcome
- Must be verifiable by a specific date
- Should be relevant to {context}
- Avoid subjective/opinion-based questions

Return JSON format:
[
  {
    "title": "Will [event] happen by [date]?",
    "category": "Sports|Politics|Crypto|Tech|Entertainment",
    "description": "Detailed context...",
    "suggested_end_date": "YYYY-MM-DD",
    "source_keywords": ["keyword1", "keyword2"],
    "confidence_reasoning": "Why this is a good prediction market"
  }
]`;

const DEFAULT_CONFIG: AIConfig = {
  name: '',
  description: '',
  context_type: 'bangladesh',
  news_sources: [],
  search_keywords: [],
  prompt_template: DEFAULT_PROMPT_TEMPLATE,
  ai_model: 'gemini-1.5-flash',
  temperature: 0.7,
  max_tokens: 2048,
  topics_per_generation: 5,
  focus_areas: [],
  is_active: true,
  generation_schedule: '0 6 * * *'
};

export function AITopicConfigPanel() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/ai-topic-configs', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch configs');
      
      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    if (!editingConfig) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/ai-topic-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(editingConfig)
      });

      if (!response.ok) throw new Error('Failed to save config');

      setSuccess('Configuration saved successfully');
      setIsDialogOpen(false);
      setEditingConfig(null);
      fetchConfigs();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/admin/ai-topic-configs?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      if (!response.ok) throw new Error('Failed to delete config');

      setSuccess('Configuration deleted');
      fetchConfigs();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGenerate = async (configId?: string) => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/cron/daily-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ config_id: configId })
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setSuccess(`Generated ${data.total_topics_generated} topics`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const addNewsSource = () => {
    if (!editingConfig) return;
    setEditingConfig({
      ...editingConfig,
      news_sources: [...editingConfig.news_sources, { name: '', url: '', type: 'rss' }]
    });
  };

  const removeNewsSource = (index: number) => {
    if (!editingConfig) return;
    const sources = [...editingConfig.news_sources];
    sources.splice(index, 1);
    setEditingConfig({ ...editingConfig, news_sources: sources });
  };

  const updateNewsSource = (index: number, field: keyof NewsSource, value: string) => {
    if (!editingConfig) return;
    const sources = [...editingConfig.news_sources];
    sources[index] = { ...sources[index], [field]: value };
    setEditingConfig({ ...editingConfig, news_sources: sources });
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
          <h2 className="text-2xl font-bold">AI Topic Configurations</h2>
          <p className="text-muted-foreground">Manage news sources, prompts, and generation settings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleGenerate()} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Generate All
          </Button>
          <Button onClick={() => { setEditingConfig({ ...DEFAULT_CONFIG }); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Config
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Configs List */}
      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id} className={config.is_active ? '' : 'opacity-60'}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{config.name}</CardTitle>
                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>{config.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleGenerate(config.id)}>
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditingConfig(config); setIsDialogOpen(true); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(config.id!)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Context:</span>
                  <p className="font-medium capitalize">{config.context_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sources:</span>
                  <p className="font-medium">{config.news_sources?.length || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Topics:</span>
                  <p className="font-medium">{config.topics_per_generation}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Schedule:</span>
                  <p className="font-medium">{config.generation_schedule}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConfig?.id ? 'Edit Configuration' : 'New Configuration'}</DialogTitle>
            <DialogDescription>
              Configure news sources, AI prompts, and generation settings
            </DialogDescription>
          </DialogHeader>

          {editingConfig && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={editingConfig.name} 
                    onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                    placeholder="e.g., Bangladesh News"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={editingConfig.description} 
                    onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                    placeholder="Brief description of this configuration"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Context Type</Label>
                  <Select 
                    value={editingConfig.context_type} 
                    onValueChange={(v: any) => setEditingConfig({ ...editingConfig, context_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bangladesh">Bangladesh News</SelectItem>
                      <SelectItem value="international">International News</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Focus Areas (comma-separated)</Label>
                  <Input 
                    value={editingConfig.focus_areas?.join(', ')} 
                    onChange={(e) => setEditingConfig({ 
                      ...editingConfig, 
                      focus_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="cricket, politics, economy"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch 
                    checked={editingConfig.is_active} 
                    onCheckedChange={(v) => setEditingConfig({ ...editingConfig, is_active: v })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="sources" className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Keywords (comma-separated)</Label>
                  <Input 
                    value={editingConfig.search_keywords?.join(', ')} 
                    onChange={(e) => setEditingConfig({ 
                      ...editingConfig, 
                      search_keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="bangladesh, cricket, election"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>News Sources (RSS)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addNewsSource}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Source
                    </Button>
                  </div>

                  {editingConfig.news_sources?.map((source, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input 
                          placeholder="Source Name"
                          value={source.name}
                          onChange={(e) => updateNewsSource(index, 'name', e.target.value)}
                        />
                        <Input 
                          placeholder="RSS URL"
                          value={source.url}
                          onChange={(e) => updateNewsSource(index, 'url', e.target.value)}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeNewsSource(index)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="prompt" className="space-y-4">
                <div className="space-y-2">
                  <Label>Prompt Template</Label>
                  <Textarea 
                    value={editingConfig.prompt_template}
                    onChange={(e) => setEditingConfig({ ...editingConfig, prompt_template: e.target.value })}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: {'{context}'}, {'{count}'}, {'{focus_areas}'}, {'{categories}'}, {'{sources}'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select 
                    value={editingConfig.ai_model} 
                    onValueChange={(v) => setEditingConfig({ ...editingConfig, ai_model: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Temperature: {editingConfig.temperature}</Label>
                  <Input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={editingConfig.temperature}
                    onChange={(e) => setEditingConfig({ ...editingConfig, temperature: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input 
                    type="number"
                    value={editingConfig.max_tokens}
                    onChange={(e) => setEditingConfig({ ...editingConfig, max_tokens: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Topics Per Generation</Label>
                  <Input 
                    type="number"
                    value={editingConfig.topics_per_generation}
                    onChange={(e) => setEditingConfig({ ...editingConfig, topics_per_generation: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cron Schedule</Label>
                  <Input 
                    value={editingConfig.generation_schedule}
                    onChange={(e) => setEditingConfig({ ...editingConfig, generation_schedule: e.target.value })}
                    placeholder="0 6 * * *"
                  />
                  <p className="text-xs text-muted-foreground">Format: minute hour day month weekday</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingConfig(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
