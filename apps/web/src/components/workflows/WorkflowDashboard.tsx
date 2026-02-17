/**
 * WorkflowDashboard Component
 * Admin dashboard for managing workflows and viewing analytics
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Calendar,
  Settings,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useWorkflowStore, 
  selectWorkflows,
  selectPendingExecutions,
  selectRunningExecutions,
  selectFailedExecutions,
  selectEscalatedExecutions,
  selectStats 
} from '@/store/workflowStore';
import { WorkflowExecutionList } from './WorkflowExecutionList';
import { WorkflowScheduleManager } from './WorkflowScheduleManager';
import type { VerificationWorkflow, WorkflowExecution } from '@/types/database';

export function WorkflowDashboard() {
  const store = useWorkflowStore();
  const workflows = selectWorkflows(store);
  const pendingExecutions = selectPendingExecutions(store);
  const runningExecutions = selectRunningExecutions(store);
  const failedExecutions = selectFailedExecutions(store);
  const escalatedExecutions = selectEscalatedExecutions(store);
  const stats = selectStats(store);

  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    store.fetchWorkflows();
    store.fetchStats();
    store.fetchSchedules();
    store.subscribeToExecutions();

    // Poll for updates
    const interval = setInterval(() => {
      store.fetchStats();
      store.fetchPendingExecutions();
      store.fetchRunningExecutions();
    }, 5000);

    return () => {
      clearInterval(interval);
      store.unsubscribeAll();
    };
  }, []);

  const handleToggleWorkflow = async (workflow: VerificationWorkflow) => {
    await store.updateWorkflowData(workflow.id, { is_active: !workflow.is_active });
  };

  const handleTriggerExecution = async (workflowId: string) => {
    // This would typically trigger for a specific event
    // For now, we'll just show a toast or notification
    console.log('Trigger execution for workflow:', workflowId);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workflow Management
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage verification workflows
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Executions"
          value={stats?.totalExecutions || 0}
          icon={Activity}
          trend={stats?.last24Hours.executions}
          trendLabel="24h"
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.last24Hours.successRate.toFixed(1) || 0}%`}
          icon={CheckCircle2}
          trend={stats ? (stats.successfulExecutions / stats.totalExecutions) * 100 : 0}
          trendLabel="all time"
          color="green"
        />
        <StatCard
          title="Pending"
          value={pendingExecutions.length}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Failed (24h)"
          value={failedExecutions.length}
          icon={AlertTriangle}
          color="red"
          alert={failedExecutions.length > 0}
        />
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="executions">
            Executions
            {runningExecutions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {runningExecutions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Workflows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Active Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              {store.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : workflows.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No workflows configured
                </p>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <WorkflowRow
                      key={workflow.id}
                      workflow={workflow}
                      onToggle={() => handleToggleWorkflow(workflow)}
                      onTrigger={() => handleTriggerExecution(workflow.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Executions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Executions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTab('executions')}
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <WorkflowExecutionList
                executions={[...runningExecutions, ...pendingExecutions].slice(0, 5)}
                compact
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {failedExecutions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Failed Executions
                    </h3>
                    <WorkflowExecutionList executions={failedExecutions} />
                  </div>
                )}

                {runningExecutions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-blue-600 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 animate-pulse" />
                      Running
                    </h3>
                    <WorkflowExecutionList executions={runningExecutions} />
                  </div>
                )}

                {escalatedExecutions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-amber-600 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Escalated
                    </h3>
                    <WorkflowExecutionList executions={escalatedExecutions} />
                  </div>
                )}

                {pendingExecutions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending
                    </h3>
                    <WorkflowExecutionList executions={pendingExecutions} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <WorkflowScheduleManager />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Workflow Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Analytics dashboard coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===================================
// SUB-COMPONENTS
// ===================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'amber' | 'red';
  alert?: boolean;
}

function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'blue', alert }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <Card className={alert ? 'border-red-300 dark:border-red-700' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <div className="text-right">
              <span className="text-xs text-gray-500">{trendLabel}</span>
              <p className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {typeof trend === 'number' ? trend.toFixed(1) : trend}
              </p>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface WorkflowRowProps {
  workflow: VerificationWorkflow;
  onToggle: () => void;
  onTrigger: () => void;
}

function WorkflowRow({ workflow, onToggle, onTrigger }: WorkflowRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {workflow.name}
          </h3>
          <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
            {workflow.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <span>Category: {workflow.event_category}</span>
          <span>Method: {workflow.verification_method}</span>
          <span>Interval: {workflow.check_interval_minutes}min</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
        >
          {workflow.is_active ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTrigger}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-red-600">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
