/**
 * WorkflowExecutionList Component
 * Displays workflow executions with status and actions
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkflowStore } from '@/store/workflowStore';
import type { WorkflowExecution } from '@/types/database';
import { formatDistanceToNow } from '@/lib/utils/format';

interface WorkflowExecutionListProps {
  executions: WorkflowExecution[];
  compact?: boolean;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Pending' },
  running: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Running' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Failed' },
  paused: { icon: Pause, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Paused' },
  escalated: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Escalated' },
};

export function WorkflowExecutionList({ executions, compact = false }: WorkflowExecutionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const store = useWorkflowStore();

  const handleRetry = async (executionId: string) => {
    await store.retryExecution(executionId);
  };

  const handleEscalate = async (executionId: string) => {
    await store.escalateExecution(executionId, 'Manual escalation', 'admin');
  };

  if (executions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No executions to display
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {executions.map((execution) => {
        const status = statusConfig[execution.status];
        const StatusIcon = status.icon;
        const isExpanded = expandedId === execution.id;

        if (compact) {
          return (
            <div
              key={execution.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${status.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${status.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {execution.workflow_id}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(execution.created_at)}
                  </p>
                </div>
              </div>
              <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                {status.label}
              </Badge>
            </div>
          );
        }

        return (
          <motion.div
            key={execution.id}
            layout
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => setExpandedId(isExpanded ? null : execution.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${status.bg}`}>
                  <StatusIcon className={`w-5 h-5 ${status.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Execution #{execution.id.slice(0, 8)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {execution.stage}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Workflow: {execution.workflow_id} • Event: {execution.event_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(execution.created_at)}
                  </p>
                  {execution.completed_at && (
                    <p className="text-xs text-gray-400">
                      Duration: {getDuration(execution.started_at, execution.completed_at)}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {execution.status === 'failed' && (
                      <DropdownMenuItem onClick={() => handleRetry(execution.id)}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleEscalate(execution.id)}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Escalate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/30"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium">{execution.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stage</p>
                    <p className="font-medium">{execution.stage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Retry Count</p>
                    <p className="font-medium">{execution.retry_count} / {execution.max_retries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">AI Confidence</p>
                    <p className="font-medium">
                      {execution.ai_confidence_score 
                        ? `${(execution.ai_confidence_score * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {execution.result && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Result</p>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                      {JSON.stringify(execution.result, null, 2)}
                    </pre>
                  </div>
                )}

                {execution.error_message && (
                  <div className="mb-4">
                    <p className="text-xs text-red-500 mb-1">Error</p>
                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {execution.error_message}
                    </p>
                  </div>
                )}

                {execution.escalation_reason && (
                  <div>
                    <p className="text-xs text-orange-500 mb-1">Escalation</p>
                    <p className="text-sm text-orange-600">
                      {execution.escalation_reason} • Escalated to: {execution.escalated_to}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function getDuration(start: string | undefined, end: string | undefined): string {
  if (!start || !end) return 'N/A';
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;
  
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${(durationMs / 60000).toFixed(1)}m`;
}
