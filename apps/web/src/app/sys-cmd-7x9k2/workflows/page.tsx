/**
 * Admin Workflows Page
 * Manage QStash background cron jobs
 */

'use client';

import { QStashWorkflowManager } from '@/components/admin/QStashWorkflowManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Workflow, Clock, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkflowsAdminPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/sys-cmd-7x9k2')}
            className="border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Workflow className="w-8 h-8 text-violet-400" />
              Workflow Management
            </h1>
            <p className="text-slate-400 mt-1">
              Manage background QStash cron jobs and automated processes
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/15">
                <Clock className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Cron Jobs</p>
                <p className="text-lg font-semibold text-white">5 Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15">
                <Server className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Provider</p>
                <p className="text-lg font-semibold text-white">Upstash QStash</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/15">
                <Workflow className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Manager */}
      <QStashWorkflowManager />
    </div>
  );
}
