/**
 * Advanced Workflow Management Dashboard
 * Create, configure, monitor, and execute verification workflows
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Settings,
  BarChart3,
  Eye,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/WorkflowBuilder';

interface Workflow {
  id: string;
  name: string;
  description: string;
  event_category: string;
  config: any;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkflowExecution {
  id: string;
  event_id: string;
  workflow_id: string;
  outcome: 'yes' | 'no' | 'uncertain' | 'escalated';
  confidence: number;
  execution_time: number;
  created_at: string;
  error?: string;
}

interface WorkflowStats {
  totalExecutions: number;
  yesCount: number;
  noCount: number;
  escalatedCount: number;
  yesPercentage: number;
  noPercentage: number;
  escalatedPercentage: number;
  avgConfidence: number;
}

export default function WorkflowManagementDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventCategory: '',
    sources: [] as Array<{
      method: string;
      weight: number;
      timeout: number;
      config: Record<string, any>;
    }>,
  });

  useEffect(() => {
    loadWorkflows();
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh stats every 30s
    return () => clearInterval(interval);
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Load workflows error:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (workflowId?: string) => {
    try {
      const url = workflowId ? `/api/workflows/stats?id=${workflowId}` : '/api/workflows/stats';
      const response = await fetch(url);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      if (!formData.name || !formData.eventCategory || formData.sources.length === 0) {
        toast.error('Please fill all required fields and add at least one source');
        return;
      }

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create workflow');

      toast.success('Workflow created successfully');
      setFormData({
        name: '',
        description: '',
        eventCategory: '',
        sources: [],
      });
      await loadWorkflows();
      setIsCreating(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      toast.success('Workflow deleted successfully');
      await loadWorkflows();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleWorkflow = async (workflow: Workflow) => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !workflow.enabled }),
      });

      if (!response.ok) throw new Error('Failed to update workflow');

      toast.success(`Workflow ${!workflow.enabled ? 'enabled' : 'disabled'}`);
      await loadWorkflows();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDuplicateWorkflow = async (workflow: Workflow) => {
    try {
      const newWorkflow = {
        name: `${workflow.name} (Copy)`,
        description: workflow.description,
        eventCategory: workflow.event_category,
        steps: workflow.config.steps,
      };

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflow),
      });

      if (!response.ok) throw new Error('Failed to duplicate workflow');

      toast.success('Workflow duplicated successfully');
      await loadWorkflows();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-500" />
            Advanced Verification Workflows
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure multi-source event verification chains with Upstash orchestration
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Verification Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workflow Name *</label>
                <Input
                  placeholder="e.g., BTC Price Verification"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe what this workflow verifies..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Event Category *</label>
                <Select
                  value={formData.eventCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, eventCategory: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="politics">Politics</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4" />
                  Choose Default or Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DEFAULT_WORKFLOWS).map(([key, workflow]) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="text-left h-auto"
                      onClick={() => {
                        setFormData({
                          name: workflow.name,
                          description: workflow.description,
                          eventCategory: workflow.eventCategory,
                          sources: workflow.steps[0]?.sources.map((s) => ({
                            method: s.method,
                            weight: s.weight,
                            timeout: s.timeout,
                            config: s.config,
                          })) || [],
                        });
                        toast.success(`Loaded ${workflow.name} template`);
                      }}
                    >
                      <div className="text-sm">
                        <div className="font-semibold">{workflow.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {workflow.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateWorkflow} className="w-full">
                Create Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">YES Outcomes</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.yesCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stats.yesPercentage}% of executions</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">NO Outcomes</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.noCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stats.noPercentage}% of executions</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Escalated</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.escalatedCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.escalatedPercentage}% of executions
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.avgConfidence}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Across all executions</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflows List */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows ({workflows.length})</TabsTrigger>
          <TabsTrigger value="presets">Default Presets ({Object.keys(DEFAULT_WORKFLOWS).length})</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          {loading ? (
            <div className="text-center py-8">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <Card className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No workflows created yet</p>
              <Button onClick={() => setIsCreating(true)}>Create First Workflow</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{workflow.name}</h3>
                          <Badge
                            variant={workflow.enabled ? 'secondary' : 'destructive'}
                          >
                            {workflow.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline">{workflow.event_category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {workflow.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            <p className="text-gray-600 dark:text-gray-400">Sources</p>
                            <p className="font-semibold">
                              {workflow.config?.steps?.[0]?.sources?.length || 0}
                            </p>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            <p className="text-gray-600 dark:text-gray-400">Min Confidence</p>
                            <p className="font-semibold">
                              {workflow.config?.escalationThreshold || 75}%
                            </p>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            <p className="text-gray-600 dark:text-gray-400">Timeout</p>
                            <p className="font-semibold">
                              {(workflow.config?.globalTimeout || 300000) / 1000}s
                            </p>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            <p className="text-gray-600 dark:text-gray-400">Updated</p>
                            <p className="font-semibold text-xs">
                              {new Date(workflow.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateWorkflow(workflow)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleWorkflow(workflow)}
                        >
                          {workflow.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="presets">
          <div className="space-y-3">
            {Object.entries(DEFAULT_WORKFLOWS).map(([key, workflow]) => (
              <Card key={key} className="hover:shadow-md transition-shadow border-2 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          Template
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {workflow.description}
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Verification Sources:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {workflow.steps[0]?.sources?.map((source, idx) => (
                            <Badge key={idx} variant="secondary">
                              {source.method} ({source.weight}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleDuplicateWorkflow({
                        ...workflow,
                        event_category: workflow.eventCategory,
                      } as any)}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Workflow Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'YES', value: stats?.yesCount || 0 },
                    { name: 'NO', value: stats?.noCount || 0 },
                    { name: 'Escalated', value: stats?.escalatedCount || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Confidence Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Average Confidence</span>
                      <span className="text-sm font-bold text-blue-600">{stats?.avgConfidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${stats?.avgConfidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">95% Confidence</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">85%</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">75-95% Conf.</p>
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">12%</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">&lt;75% Conf.</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">3%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
