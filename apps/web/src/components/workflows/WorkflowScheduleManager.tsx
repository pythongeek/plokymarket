/**
 * WorkflowScheduleManager Component
 * Manage QStash schedules for workflows
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useWorkflowStore } from '@/store/workflowStore';
import type { WorkflowSchedule } from '@/types/database';

const defaultSchedules: Omit<WorkflowSchedule, 'id'>[] = [
  {
    name: 'Crypto Workflow Verification',
    description: 'Verify crypto events every 5 minutes',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/execute-crypto',
    isActive: true,
  },
  {
    name: 'Sports Workflow Verification',
    description: 'Verify sports events every 10 minutes',
    cron: '*/10 * * * *',
    endpoint: '/api/workflows/execute-sports',
    isActive: true,
  },
  {
    name: 'News Workflow Verification',
    description: 'Verify news events every 15 minutes',
    cron: '*/15 * * * *',
    endpoint: '/api/workflows/execute-news',
    isActive: true,
  },
  {
    name: 'Escalation Check',
    description: 'Check for escalated events every 5 minutes',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/check-escalations',
    isActive: true,
  },
  {
    name: 'Daily Analytics',
    description: 'Generate daily workflow analytics',
    cron: '0 0 * * *',
    endpoint: '/api/workflows/analytics/daily',
    isActive: true,
  },
];

export function WorkflowScheduleManager() {
  const store = useWorkflowStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    cron: '',
    endpoint: '',
  });

  const handleCreateSchedule = async () => {
    setIsCreating(true);
    const success = await store.createSchedule(newSchedule);
    setIsCreating(false);
    if (success) {
      setShowCreateDialog(false);
      setNewSchedule({ name: '', description: '', cron: '', endpoint: '' });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    await store.deleteSchedule(scheduleId);
  };

  const handleCreateDefaultSchedules = async () => {
    setIsCreating(true);
    for (const schedule of defaultSchedules) {
      await store.createSchedule(schedule);
    }
    setIsCreating(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          QStash Schedules
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateDefaultSchedules}
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Defaults
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
                <DialogDescription>
                  Create a new QStash schedule for workflow execution
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                    placeholder="e.g., Crypto Verification"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    placeholder="What does this schedule do?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cron">Cron Expression</Label>
                  <Input
                    id="cron"
                    value={newSchedule.cron}
                    onChange={(e) => setNewSchedule({ ...newSchedule, cron: e.target.value })}
                    placeholder="*/5 * * * *"
                  />
                  <p className="text-xs text-gray-500">
                    Format: minute hour day month weekday
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <Input
                    id="endpoint"
                    value={newSchedule.endpoint}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endpoint: e.target.value })}
                    placeholder="/api/workflows/execute-crypto"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSchedule}
                  disabled={!newSchedule.name || !newSchedule.cron || !newSchedule.endpoint || isCreating}
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {store.schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No schedules configured</p>
            <p className="text-sm text-gray-400 mt-1">
              Create schedules to automate workflow execution
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {store.schedules.map((schedule) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${schedule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {schedule.name}
                        </h3>
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{schedule.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {schedule.cron}
                        </code>
                        <span>{schedule.endpoint}</span>
                      </div>
                      {(schedule.lastRun || schedule.nextRun) && (
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          {schedule.lastRun && (
                            <span>Last run: {new Date(schedule.lastRun).toLocaleString()}</span>
                          )}
                          {schedule.nextRun && (
                            <span>Next run: {new Date(schedule.nextRun).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Reference */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Cron Expression Reference
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">*/5 * * * *</code>
            <span className="text-blue-700 dark:text-blue-300">Every 5 minutes</span>
            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">0 * * * *</code>
            <span className="text-blue-700 dark:text-blue-300">Every hour</span>
            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">0 0 * * *</code>
            <span className="text-blue-700 dark:text-blue-300">Daily at midnight</span>
            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">0 6 * * *</code>
            <span className="text-blue-700 dark:text-blue-300">Daily at 6 AM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
