'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  recommended?: string;
}

interface AutomatedWorkflow {
  name: string;
  cron: string;
  description: string;
}

export default function WorkflowManager() {
  const supabase = createClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<any>(null);

  // Fetch available workflows
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['adminWorkflows'],
    queryFn: async () => {
      const response = await fetch('/api/admin/workflows/trigger');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      return response.json();
    }
  });

  // Trigger workflow mutation
  const triggerMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await fetch('/api/admin/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflowId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Trigger failed');
      return data;
    },
    onSuccess: (data) => {
      setTriggerResult({ type: 'success', data });
    },
    onError: (error: Error) => {
      setTriggerResult({ type: 'error', message: error.message });
    }
  });

  const manualWorkflows: Workflow[] = workflowsData?.workflows || [];
  const automatedWorkflows: AutomatedWorkflow[] = workflowsData?.automated || [];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Admin': 'bg-red-100 text-red-800',
      'Market Data': 'bg-blue-100 text-blue-800',
      'Core': 'bg-purple-100 text-purple-800',
      'Reporting': 'bg-green-100 text-green-800',
      'USDT Management': 'bg-yellow-100 text-yellow-800',
      'Analytics': 'bg-indigo-100 text-indigo-800',
      'Daily Operations': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatCron = (cron: string) => {
    const descriptions: Record<string, string> = {
      '*/5 * * * *': 'প্রতি ৫ মিনিটে',
      '0 * * * *': 'প্রতি ঘণ্টায়',
      '0 0 * * *': 'প্রতিদিন রাত ১২টায়',
      '0 9 * * *': 'প্রতিদিন সকাল ৯টায়',
      '0 12 * * *': 'প্রতিদিন দুপুর ১২টায়',
      '*/10 * * * *': 'প্রতি ১০ মিনিটে',
      '0 */6 * * *': 'প্রতি ৬ ঘণ্টায়',
      '0,15,30,45 * * * *': 'প্রতি ১৫ মিনিটে'
    };
    return descriptions[cron] || cron;
  };

  if (workflowsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">ওয়ার্কফ্লো ম্যানেজমেন্ট</h2>
        <p className="text-gray-600">অটোমেটেড এবং ম্যানুয়াল ওয়ার্কফ্লো পরিচালনা করুন</p>
      </div>

      {/* Automated Workflows Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            সক্রিয় অটোমেটেড ওয়ার্কফ্লো (৪টি)
          </CardTitle>
          <CardDescription>
            এই ওয়ার্কফ্লোগুলো স্বয়ংক্রিয়ভাবে নির্ধারিত সময়ে চলে
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {automatedWorkflows.map((workflow, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{workflow.name}</p>
                  <p className="text-sm text-gray-600">{workflow.description}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatCron(workflow.cron)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Workflows Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            ম্যানুয়াল ট্রিগার ওয়ার্কফ্লো ({manualWorkflows.length}টি)
          </CardTitle>
          <CardDescription>
            প্রয়োজনে এই ওয়ার্কফ্লোগুলো ম্যানুয়ালি চালান
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {manualWorkflows.map((workflow) => (
              <div 
                key={workflow.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getCategoryColor(workflow.category)}>
                    {workflow.category}
                  </Badge>
                </div>
                <h4 className="font-medium mb-1">{workflow.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                {workflow.recommended && (
                  <p className="text-xs text-blue-600 mb-3">
                    💡 {workflow.recommended}
                  </p>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedWorkflow(workflow.id);
                    setTriggerResult(null);
                    triggerMutation.mutate(workflow.id);
                  }}
                  disabled={triggerMutation.isPending && selectedWorkflow === workflow.id}
                  className="w-full"
                >
                  {triggerMutation.isPending && selectedWorkflow === workflow.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      চলছে...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      চালান
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trigger Result */}
      {triggerResult && (
        <Card className={triggerResult.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {triggerResult.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {triggerResult.type === 'success' ? 'সফল' : 'ব্যর্থ'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {triggerResult.type === 'success' ? (
              <div className="space-y-2">
                <p><strong>ওয়ার্কফ্লো:</strong> {triggerResult.data.workflow}</p>
                <p><strong>বিবরণ:</strong> {triggerResult.data.description}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600">পূর্ণাঙ্গ রেসপন্স দেখুন</summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(triggerResult.data.result, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <p>{triggerResult.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Consolidation Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">ওয়ার্কফ্লো কনসলিডেশন তথ্য</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>৪টি অটোমেটেড:</strong> Combined Market Data (৫ মিনিট), Combined Analytics (ঘণ্টায়), Combined Daily Ops (মধ্যরাত), Check Escalations (৫ মিনিট)</li>
            <li>👆 <strong>৮টি ম্যানুয়াল:</strong> প্রয়োজনে অ্যাডমিন প্যানেল থেকে চালানো যাবে</li>
            <li>💡 <strong>সুবিধা:</strong> QStash ফ্রি টিয়ারের ১০টি সীমার মধ্যে থেকে সবচেয়ে গুরুত্বপূর্ণ ওয়ার্কফ্লো অটোমেশন</li>
            <li>🔧 <strong>ম্যানুয়াল ওয়ার্কফ্লো:</strong> Dispute, News Data, Batch Markets, Daily Report, Auto-Verify এবং Combined ওয়ার্কফ্লোগুলোর ম্যানুয়াল রান</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
