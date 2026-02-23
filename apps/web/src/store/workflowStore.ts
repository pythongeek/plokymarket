/**
 * Workflow Store
 * Zustand store for workflow management and monitoring
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  VerificationWorkflow,
  WorkflowExecution,
  WorkflowSchedule,
  WorkflowStats,
  RealtimePayload
} from '@/types/database';
import * as workflowService from '@/services/workflows';

// ===================================
// STORE STATE INTERFACE
// ===================================

interface WorkflowState {
  // Workflows
  workflows: Map<string, VerificationWorkflow>;
  workflowIds: string[];
  selectedWorkflowId: string | null;

  // Executions
  executions: Map<string, WorkflowExecution>;
  executionIds: string[];
  pendingExecutionIds: string[];
  runningExecutionIds: string[];
  failedExecutionIds: string[];
  escalatedExecutionIds: string[];

  // Schedules
  schedules: WorkflowSchedule[];

  // Stats
  stats: WorkflowStats | null;

  // Filters
  selectedCategory: string | null;
  selectedStatus: string | null;

  // UI State
  isLoading: boolean;
  isLoadingExecutions: boolean;
  error: string | null;

  // Subscriptions
  unsubscribeExecutions: (() => void) | null;
}

interface WorkflowActions {
  // Workflow Actions
  setWorkflows: (workflows: VerificationWorkflow[]) => void;
  addWorkflow: (workflow: VerificationWorkflow) => void;
  updateWorkflow: (id: string, updates: Partial<VerificationWorkflow>) => void;
  removeWorkflow: (id: string) => void;
  setSelectedWorkflow: (id: string | null) => void;

  // Execution Actions
  setExecutions: (executions: WorkflowExecution[]) => void;
  addExecution: (execution: WorkflowExecution) => void;
  updateExecution: (id: string, updates: Partial<WorkflowExecution>) => void;
  removeExecution: (id: string) => void;

  // Schedule Actions
  setSchedules: (schedules: WorkflowSchedule[]) => void;
  addSchedule: (schedule: WorkflowSchedule) => void;
  removeSchedule: (id: string) => void;

  // Stats Actions
  setStats: (stats: WorkflowStats) => void;

  // Filter Actions
  setCategory: (category: string | null) => void;
  setStatus: (status: string | null) => void;

  // Fetch Actions
  fetchWorkflows: () => Promise<void>;
  fetchWorkflowById: (id: string) => Promise<VerificationWorkflow | null>;
  fetchExecutions: (options?: { workflowId?: string; status?: string }) => Promise<void>;
  fetchPendingExecutions: () => Promise<void>;
  fetchRunningExecutions: () => Promise<void>;
  fetchFailedExecutions: () => Promise<void>;
  fetchEscalatedExecutions: () => Promise<void>;
  fetchSchedules: () => Promise<void>;
  fetchStats: () => Promise<void>;

  // Real-time Actions
  subscribeToExecutions: () => void;
  unsubscribeAll: () => void;

  // Operation Actions
  createWorkflow: (data: Partial<VerificationWorkflow>) => Promise<boolean>;
  updateWorkflowData: (id: string, updates: Partial<VerificationWorkflow>) => Promise<boolean>;
  deleteWorkflow: (id: string) => Promise<boolean>;
  triggerExecution: (workflowId: string, eventId: string) => Promise<boolean>;
  retryExecution: (executionId: string) => Promise<boolean>;
  escalateExecution: (executionId: string, reason: string, escalatedTo: string) => Promise<boolean>;
  createSchedule: (schedule: { name: string; description: string; cron: string; endpoint: string }) => Promise<boolean>;
  deleteSchedule: (scheduleId: string) => Promise<boolean>;

  // Utility Actions
  clearError: () => void;
  resetFilters: () => void;
}

// ===================================
// STORE IMPLEMENTATION
// ===================================

const initialState: WorkflowState = {
  workflows: new Map(),
  workflowIds: [],
  selectedWorkflowId: null,
  executions: new Map(),
  executionIds: [],
  pendingExecutionIds: [],
  runningExecutionIds: [],
  failedExecutionIds: [],
  escalatedExecutionIds: [],
  schedules: [],
  stats: null,
  selectedCategory: null,
  selectedStatus: null,
  isLoading: false,
  isLoadingExecutions: false,
  error: null,
  unsubscribeExecutions: null,
};

export const useWorkflowStore = create<WorkflowState & WorkflowActions>()(
  immer(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          ...initialState,

          // ===================================
          // WORKFLOW ACTIONS
          // ===================================

          setWorkflows: (workflows) => {
            set((state) => {
              state.workflows = new Map(workflows.map((w) => [w.id, w]));
              state.workflowIds = workflows.map((w) => w.id);
            });
          },

          addWorkflow: (workflow) => {
            set((state) => {
              state.workflows.set(workflow.id, workflow);
              if (!state.workflowIds.includes(workflow.id)) {
                state.workflowIds.push(workflow.id);
              }
            });
          },

          updateWorkflow: (id, updates) => {
            set((state) => {
              const existing = state.workflows.get(id);
              if (existing) {
                state.workflows.set(id, { ...existing, ...updates });
              }
            });
          },

          removeWorkflow: (id) => {
            set((state) => {
              state.workflows.delete(id);
              state.workflowIds = state.workflowIds.filter((wid) => wid !== id);
            });
          },

          setSelectedWorkflow: (id) => {
            set((state) => {
              state.selectedWorkflowId = id;
            });
          },

          // ===================================
          // EXECUTION ACTIONS
          // ===================================

          setExecutions: (executions) => {
            set((state) => {
              state.executions = new Map(executions.map((e) => [e.id, e]));
              state.executionIds = executions.map((e) => e.id);
              recalculateExecutionLists(state);
            });
          },

          addExecution: (execution) => {
            set((state) => {
              state.executions.set(execution.id, execution);
              if (!state.executionIds.includes(execution.id)) {
                state.executionIds.unshift(execution.id);
              }
              recalculateExecutionLists(state);
            });
          },

          updateExecution: (id, updates) => {
            set((state) => {
              const existing = state.executions.get(id);
              if (existing) {
                state.executions.set(id, { ...existing, ...updates });
                recalculateExecutionLists(state);
              }
            });
          },

          removeExecution: (id) => {
            set((state) => {
              state.executions.delete(id);
              state.executionIds = state.executionIds.filter((eid) => eid !== id);
              recalculateExecutionLists(state);
            });
          },

          // ===================================
          // SCHEDULE ACTIONS
          // ===================================

          setSchedules: (schedules) => {
            set((state) => {
              state.schedules = schedules;
            });
          },

          addSchedule: (schedule) => {
            set((state) => {
              state.schedules.push(schedule);
            });
          },

          removeSchedule: (id) => {
            set((state) => {
              state.schedules = state.schedules.filter((s) => s.id !== id);
            });
          },

          // ===================================
          // STATS ACTIONS
          // ===================================

          setStats: (stats) => {
            set((state) => {
              state.stats = stats;
            });
          },

          // ===================================
          // FILTER ACTIONS
          // ===================================

          setCategory: (category) => {
            set((state) => {
              state.selectedCategory = category;
            });
            get().fetchWorkflows();
          },

          setStatus: (status) => {
            set((state) => {
              state.selectedStatus = status;
            });
            get().fetchWorkflows();
          },

          // ===================================
          // FETCH ACTIONS
          // ===================================

          fetchWorkflows: async () => {
            set((s) => {
              s.isLoading = true;
              s.error = null;
            });

            try {
              const { data, error } = await workflowService.fetchWorkflows({
                isActive: true,
                category: get().selectedCategory || undefined,
              });

              if (error) throw error;

              set((s) => {
                s.workflows = new Map(data.map((w) => [w.id, w]));
                s.workflowIds = data.map((w) => w.id);
              });
            } catch (err) {
              set((s) => {
                s.error = err instanceof Error ? err.message : 'Failed to fetch workflows';
              });
            } finally {
              set((s) => {
                s.isLoading = false;
              });
            }
          },

          fetchWorkflowById: async (id) => {
            const { data, error } = await workflowService.fetchWorkflowById(id);
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return null;
            }
            if (data) {
              set((s) => {
                s.workflows.set(id, data);
              });
            }
            return data;
          },

          fetchExecutions: async (options = {}) => {
            set((s) => {
              s.isLoadingExecutions = true;
            });

            try {
              const { data, error } = await workflowService.fetchWorkflowExecutions({
                workflowId: options.workflowId,
                status: options.status,
                limit: 50,
              });

              if (error) throw error;

              set((s) => {
                data.forEach((e) => s.executions.set(e.id, e));
                s.executionIds = data.map((e) => e.id);
                recalculateExecutionLists(s);
              });
            } catch (err) {
              set((s) => {
                s.error = err instanceof Error ? err.message : 'Failed to fetch executions';
              });
            } finally {
              set((s) => {
                s.isLoadingExecutions = false;
              });
            }
          },

          fetchPendingExecutions: async () => {
            const { data, error } = await workflowService.fetchPendingExecutions();
            if (!error && data) {
              set((s) => {
                data.forEach((e) => s.executions.set(e.id, e));
                s.pendingExecutionIds = data.map((e) => e.id);
              });
            }
          },

          fetchRunningExecutions: async () => {
            const { data, error } = await workflowService.fetchRunningExecutions();
            if (!error && data) {
              set((s) => {
                data.forEach((e) => s.executions.set(e.id, e));
                s.runningExecutionIds = data.map((e) => e.id);
              });
            }
          },

          fetchFailedExecutions: async () => {
            const { data, error } = await workflowService.fetchFailedExecutions();
            if (!error && data) {
              set((s) => {
                data.forEach((e) => s.executions.set(e.id, e));
                s.failedExecutionIds = data.map((e) => e.id);
              });
            }
          },

          fetchEscalatedExecutions: async () => {
            const { data, error } = await workflowService.fetchEscalatedExecutions();
            if (!error && data) {
              set((s) => {
                data.forEach((e) => s.executions.set(e.id, e));
                s.escalatedExecutionIds = data.map((e) => e.id);
              });
            }
          },

          fetchSchedules: async () => {
            const schedules = await workflowService.fetchQStashSchedules();
            set((s) => {
              s.schedules = schedules;
            });
          },

          fetchStats: async () => {
            const { data, error } = await workflowService.fetchWorkflowStats();
            if (!error && data) {
              set((s) => {
                s.stats = data;
              });
            }
          },

          // ===================================
          // REAL-TIME ACTIONS
          // ===================================

          subscribeToExecutions: () => {
            const unsubscribe = workflowService.subscribeToWorkflowExecutions((payload) => {
              const { eventType, new: newExecution, old: oldExecution } = payload;

              switch (eventType) {
                case 'INSERT':
                  get().addExecution(newExecution as WorkflowExecution);
                  break;
                case 'UPDATE':
                  get().updateExecution((newExecution as WorkflowExecution).id, newExecution as Partial<WorkflowExecution>);
                  break;
                case 'DELETE':
                  get().removeExecution((oldExecution as WorkflowExecution).id);
                  break;
              }
            });

            set((s) => {
              s.unsubscribeExecutions = unsubscribe;
            });
          },

          unsubscribeAll: () => {
            const state = get();
            state.unsubscribeExecutions?.();

            set((s) => {
              s.unsubscribeExecutions = null;
            });
          },

          // ===================================
          // OPERATION ACTIONS
          // ===================================

          createWorkflow: async (data) => {
            const { data: workflow, error } = await workflowService.createWorkflow(data);
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return false;
            }
            if (workflow) {
              get().addWorkflow(workflow);
            }
            return true;
          },

          updateWorkflowData: async (id, updates) => {
            const { data, error } = await workflowService.updateWorkflow(id, updates);
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return false;
            }
            if (data) {
              get().updateWorkflow(id, data);
            }
            return true;
          },

          deleteWorkflow: async (id) => {
            const { error } = await workflowService.deleteWorkflow(id);
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return false;
            }
            get().removeWorkflow(id);
            return true;
          },

          triggerExecution: async (workflowId, eventId) => {
            const { data, error } = await workflowService.triggerWorkflowExecution(workflowId, eventId);
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return false;
            }
            if (data) {
              get().addExecution(data);
            }
            return true;
          },

          retryExecution: async (executionId) => {
            const { data, error } = await workflowService.retryWorkflowExecution(executionId);
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return false;
            }
            if (data) {
              get().updateExecution(executionId, data);
            }
            return true;
          },

          escalateExecution: async (executionId, reason, escalatedTo) => {
            const { data, error } = await workflowService.escalateWorkflowExecution(
              executionId,
              reason,
              escalatedTo
            );
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return false;
            }
            if (data) {
              get().updateExecution(executionId, data);
            }
            return true;
          },

          createSchedule: async (schedule) => {
            const success = await workflowService.createQStashSchedule(schedule);
            if (success) {
              await get().fetchSchedules();
            }
            return success;
          },

          deleteSchedule: async (scheduleId) => {
            const success = await workflowService.deleteQStashSchedule(scheduleId);
            if (success) {
              get().removeSchedule(scheduleId);
            }
            return success;
          },

          // ===================================
          // UTILITY ACTIONS
          // ===================================

          clearError: () => {
            set((s) => {
              s.error = null;
            });
          },

          resetFilters: () => {
            set((s) => {
              s.selectedCategory = null;
              s.selectedStatus = null;
            });
            get().fetchWorkflows();
          },
        }),
        {
          name: 'workflow-store',
          partialize: (state) => ({
            selectedCategory: state.selectedCategory,
            selectedStatus: state.selectedStatus,
          }),
        }
      )
    )
  )
);

// ===================================
// HELPER FUNCTIONS
// ===================================

function recalculateExecutionLists(state: WorkflowState) {
  state.pendingExecutionIds = [];
  state.runningExecutionIds = [];
  state.failedExecutionIds = [];
  state.escalatedExecutionIds = [];

  state.executions.forEach((execution) => {
    switch (execution.status) {
      case 'pending':
        state.pendingExecutionIds.push(execution.id);
        break;
      case 'running':
        state.runningExecutionIds.push(execution.id);
        break;
      case 'failed':
        state.failedExecutionIds.push(execution.id);
        break;
      case 'escalated':
        state.escalatedExecutionIds.push(execution.id);
        break;
    }
  });
}

// ===================================
// SELECTORS
// ===================================

export const selectWorkflows = (state: WorkflowState) =>
  state.workflowIds.map((id) => state.workflows.get(id)).filter(Boolean) as VerificationWorkflow[];

export const selectWorkflowById = (state: WorkflowState, id: string) =>
  state.workflows.get(id);

export const selectSelectedWorkflow = (state: WorkflowState) =>
  state.selectedWorkflowId ? state.workflows.get(state.selectedWorkflowId) : null;

export const selectExecutions = (state: WorkflowState) =>
  state.executionIds.map((id) => state.executions.get(id)).filter(Boolean) as WorkflowExecution[];

export const selectPendingExecutions = (state: WorkflowState) =>
  state.pendingExecutionIds.map((id) => state.executions.get(id)).filter(Boolean) as WorkflowExecution[];

export const selectRunningExecutions = (state: WorkflowState) =>
  state.runningExecutionIds.map((id) => state.executions.get(id)).filter(Boolean) as WorkflowExecution[];

export const selectFailedExecutions = (state: WorkflowState) =>
  state.failedExecutionIds.map((id) => state.executions.get(id)).filter(Boolean) as WorkflowExecution[];

export const selectEscalatedExecutions = (state: WorkflowState) =>
  state.escalatedExecutionIds.map((id) => state.executions.get(id)).filter(Boolean) as WorkflowExecution[];

export const selectActiveWorkflows = (state: WorkflowState) =>
  selectWorkflows(state).filter((w) => w.is_active);

export const selectCategories = (state: WorkflowState) => {
  const categories = new Set<string>();
  state.workflows.forEach((w) => categories.add(w.event_category));
  return Array.from(categories).sort();
};

export const selectStats = (state: WorkflowState) => {
  if (state.stats) return state.stats;

  // Fallback calculation from state to prevent UI crashes, as requested
  const executionList = Array.from(state.executions.values());
  const total = executionList.length || 0;
  const pending = executionList.filter(e => e.status === 'pending').length || 0;
  const completed = executionList.filter(e => e.status === 'completed').length || 0;
  const failed = executionList.filter(e => e.status === 'failed').length || 0;

  return { total, pending, completed, failed };
};
