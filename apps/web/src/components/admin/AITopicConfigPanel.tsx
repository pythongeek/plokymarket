'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Bot,
  Settings,
  MessageSquare
} from 'lucide-react';

interface AIProvider {
  id: string;
  provider_name: string;
  model: string;
  base_url: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
}

interface AIPrompt {
  id: string;
  agent_name: string;
  description: string;
  system_prompt: string;
  is_active: boolean;
}

export function AITopicConfigPanel() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/ai-config', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch configs');

      const data = await response.json();
      setProviders(data.providers || []);
      setPrompts(data.prompts || []);
    } catch (err: any) {
      toast({
        title: "Error fetching configs",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProvider = (id: string, field: keyof AIProvider, value: any) => {
    setProviders(providers.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleUpdatePrompt = (id: string, field: keyof AIPrompt, value: any) => {
    setPrompts(prompts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSaveProvider = async (provider: AIProvider) => {
    setSavingId(provider.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ type: 'provider', data: provider })
      });

      if (!response.ok) throw new Error('Failed to save provider config');

      toast({
        title: "Success",
        description: `${provider.provider_name} configuration saved successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleSavePrompt = async (prompt: AIPrompt) => {
    setSavingId(prompt.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ type: 'prompt', data: prompt })
      });

      if (!response.ok) throw new Error('Failed to save prompt config');

      toast({
        title: "Success",
        description: `${prompt.agent_name} prompt saved successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-500 font-medium">Loading AI configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">AI Global Configuration</h2>
        <p className="text-muted-foreground text-lg">
          Manage API models, temperatures, and customize agent prompts dynamically.
        </p>
      </div>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 h-12">
          <TabsTrigger value="providers" className="text-base gap-2"><Settings className="w-4 h-4" /> Providers</TabsTrigger>
          <TabsTrigger value="prompts" className="text-base gap-2"><MessageSquare className="w-4 h-4" /> Agent Prompts</TabsTrigger>
        </TabsList>

        {/* PROVIDERS TAB */}
        <TabsContent value="providers" className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Bot className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Settings changed here will affect how the AI Event Creation pipeline connects to AI API models.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className={`border-gray-200 shadow-sm transition-opacity ${!provider.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl capitalize flex items-center gap-3">
                      {provider.provider_name}
                      {provider.is_active && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>}
                    </CardTitle>
                    <CardDescription>Configurations for the {provider.provider_name} integration.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${provider.id}`} className="font-semibold text-gray-700">Enabled</Label>
                    <Switch
                      id={`active-${provider.id}`}
                      checked={provider.is_active}
                      onCheckedChange={(val) => handleUpdateProvider(provider.id, 'is_active', val)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6 grid sm:grid-cols-2 gap-x-8 gap-y-6">

                  <div className="space-y-2">
                    <Label className="font-semibold" htmlFor={`model-${provider.id}`}>Model Name</Label>
                    <Input
                      id={`model-${provider.id}`}
                      value={provider.model}
                      onChange={(e) => handleUpdateProvider(provider.id, 'model', e.target.value)}
                      placeholder="e.g. moonshot-v1-32k"
                    />
                    <p className="text-xs text-gray-500 mt-1">Exact identifier expected by the API</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold" htmlFor={`baseurl-${provider.id}`}>Base URL</Label>
                    <Input
                      id={`baseurl-${provider.id}`}
                      value={provider.base_url || ''}
                      onChange={(e) => handleUpdateProvider(provider.id, 'base_url', e.target.value)}
                      placeholder="https://api.moonshot.cn/v1"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="font-semibold" htmlFor={`temp-${provider.id}`}>Temperature</Label>
                      <span className="text-sm text-gray-500">{provider.temperature}</span>
                    </div>
                    <Input
                      id={`temp-${provider.id}`}
                      type="range"
                      min="0" max="2" step="0.1"
                      value={provider.temperature}
                      onChange={(e) => handleUpdateProvider(provider.id, 'temperature', parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Strict</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold" htmlFor={`tokens-${provider.id}`}>Max Tokens</Label>
                    <Input
                      id={`tokens-${provider.id}`}
                      type="number"
                      value={provider.max_tokens}
                      onChange={(e) => handleUpdateProvider(provider.id, 'max_tokens', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end pt-4 border-t border-gray-100">
                    <Button
                      onClick={() => handleSaveProvider(provider)}
                      disabled={savingId === provider.id}
                      className="gap-2"
                    >
                      {savingId === provider.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingId === provider.id ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PROMPTS TAB */}
        <TabsContent value="prompts" className="space-y-6">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              These system prompts define the AI's behavior. Modifying these will directly alter how events and classifications are generated. <b>Edit with caution.</b>
            </AlertDescription>
          </Alert>

          <div className="space-y-8">
            {prompts.map((prompt) => (
              <Card key={prompt.id} className="border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {prompt.agent_name.replace('_', ' ').toUpperCase()}
                        {!prompt.is_active && <Badge variant="secondary">Disabled</Badge>}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">{prompt.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-gray-700">System Prompt</Label>
                      <Button
                        size="sm"
                        onClick={() => handleSavePrompt(prompt)}
                        disabled={savingId === prompt.id}
                        className="bg-primary hover:bg-primary/90 h-8 gap-2"
                      >
                        {savingId === prompt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save Prompt
                      </Button>
                    </div>
                    <Textarea
                      value={prompt.system_prompt}
                      onChange={(e) => handleUpdatePrompt(prompt.id, 'system_prompt', e.target.value)}
                      className="font-mono text-sm leading-relaxed min-h-[400px] resize-y bg-gray-50 p-4 border-gray-300 focus:bg-white transition-colors"
                      spellCheck={false}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
