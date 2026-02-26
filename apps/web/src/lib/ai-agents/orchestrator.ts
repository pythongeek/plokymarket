/**
 * Agent Orchestrator
 * Coordinates multi-agent execution with state management
 * Implements Observer pattern for real-time updates
 */

import {
  AgentState,
  AgentType,
  AgentContext,
  AgentOrchestrationResult,
  ContentAgentResult,
  MarketLogicResult,
  TimingResult,
  RiskAssessmentResult,
} from './types';
import { runContentAgent } from './content-agent';
import { runMarketLogicAgent } from './market-logic-agent';
import { runTimingAgent } from './timing-agent';
import { runRiskAgent } from './risk-agent';
import { checkForDuplicates } from './duplicate-detector';
import { getBestProvider, rotateProvider } from './provider-switcher';

// Callback type for state updates
type StateUpdateCallback = (agents: AgentState[], currentStep: number) => void;

export class AgentOrchestrator {
  private agents: Map<AgentType, AgentState> = new Map();
  private callbacks: StateUpdateCallback[] = [];
  private isRunning: boolean = false;
  private currentStep: number = 0;
  private providerUsed: 'vertex' | 'kimi' | 'rule-based' = 'vertex';

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents(): void {
    const types: AgentType[] = ['content', 'logic', 'timing', 'risk'];
    for (const type of types) {
      this.agents.set(type, {
        type,
        status: 'idle',
        progress: 0,
      });
    }
  }

  /**
   * Subscribe to state updates
   */
  public subscribe(callback: StateUpdateCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notify(): void {
    const agentList = Array.from(this.agents.values());
    for (const callback of this.callbacks) {
      callback(agentList, this.currentStep);
    }
  }

  /**
   * Update agent state
   */
  private updateAgent(type: AgentType, updates: Partial<AgentState>): void {
    const current = this.agents.get(type);
    if (current) {
      this.agents.set(type, { ...current, ...updates });
      this.notify();
    }
  }

  /**
   * Set agent to processing state
   */
  private startAgent(type: AgentType, message?: string): void {
    this.updateAgent(type, {
      status: 'processing',
      progress: 0,
      message,
      startedAt: new Date(),
    });
  }

  /**
   * Set agent progress
   */
  private setAgentProgress(type: AgentType, progress: number): void {
    this.updateAgent(type, { progress });
  }

  /**
   * Complete agent successfully
   */
  private completeAgent(type: AgentType, result: any): void {
    this.updateAgent(type, {
      status: 'completed',
      progress: 100,
      result,
      completedAt: new Date(),
      message: 'Completed',
    });
  }

  /**
   * Fail agent
   */
  private failAgent(type: AgentType, error: string): void {
    this.updateAgent(type, {
      status: 'error',
      error,
      message: error,
    });
  }

  /**
   * Reset all agents
   */
  public reset(): void {
    this.isRunning = false;
    this.currentStep = 0;
    this.initializeAgents();
    this.notify();
  }

  /**
   * Get current state
   */
  public getState(): { agents: AgentState[]; currentStep: number; isRunning: boolean } {
    return {
      agents: Array.from(this.agents.values()),
      currentStep: this.currentStep,
      isRunning: this.isRunning,
    };
  }

  /**
   * Force provider rotation
   */
  public rotateProvider(): 'vertex' | 'kimi' {
    return rotateProvider();
  }

  /**
   * Get current provider
   */
  public getProvider(): 'vertex' | 'kimi' | null {
    return getBestProvider();
  }

  /**
   * Run all agents in sequence
   */
  public async runAll(context: AgentContext): Promise<AgentOrchestrationResult> {
    if (this.isRunning) {
      throw new Error('Orchestrator is already running');
    }

    this.isRunning = true;
    this.reset();
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const agentsUsed: AgentType[] = [];

    let contentResult: ContentAgentResult | undefined;
    let marketLogicResult: MarketLogicResult | undefined;
    let timingResult: TimingResult | undefined;
    let riskResult: RiskAssessmentResult | undefined;

    try {
      // Step 1: Content Agent
      this.currentStep = 1;
      this.startAgent('content', 'Analyzing title & context...');
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        const agent = this.agents.get('content');
        if (agent && agent.status === 'processing' && agent.progress < 90) {
          this.setAgentProgress('content', (agent.progress || 0) + 10);
        }
      }, 200);

      contentResult = await runContentAgent(context);
      clearInterval(progressInterval);
      this.completeAgent('content', contentResult);
      agentsUsed.push('content');

      // Update context with content results
      context = {
        ...context,
        title: contentResult.title,
        description: contentResult.description,
        category: contentResult.category,
      };

      // Step 2: Market Logic Agent
      this.currentStep = 2;
      this.startAgent('logic', 'Determining market type...');
      
      const logicProgressInterval = setInterval(() => {
        const agent = this.agents.get('logic');
        if (agent && agent.status === 'processing' && agent.progress < 90) {
          this.setAgentProgress('logic', (agent.progress || 0) + 15);
        }
      }, 150);

      marketLogicResult = await runMarketLogicAgent(context);
      clearInterval(logicProgressInterval);
      this.completeAgent('logic', marketLogicResult);
      agentsUsed.push('logic');

      // Update context with market logic results
      context = {
        ...context,
        outcomes: marketLogicResult.outcomes,
      };

      // Step 3: Timing Agent
      this.currentStep = 3;
      this.startAgent('timing', 'Calculating optimal timing...');
      
      const timingProgressInterval = setInterval(() => {
        const agent = this.agents.get('timing');
        if (agent && agent.status === 'processing' && agent.progress < 90) {
          this.setAgentProgress('timing', (agent.progress || 0) + 12);
        }
      }, 180);

      timingResult = await runTimingAgent(context);
      clearInterval(timingProgressInterval);
      this.completeAgent('timing', timingResult);
      agentsUsed.push('timing');

      // Add timing warnings if any
      if (timingResult.warnings.length > 0) {
        warnings.push(...timingResult.warnings);
      }

      // Step 4: Risk Agent
      this.currentStep = 4;
      this.startAgent('risk', 'Checking compliance...');
      
      const riskProgressInterval = setInterval(() => {
        const agent = this.agents.get('risk');
        if (agent && agent.status === 'processing' && agent.progress < 90) {
          this.setAgentProgress('risk', (agent.progress || 0) + 20);
        }
      }, 120);

      riskResult = await runRiskAgent(context);
      clearInterval(riskProgressInterval);
      this.completeAgent('risk', riskResult);
      agentsUsed.push('risk');

      // Add risk warnings if any
      if (riskResult.warnings.length > 0) {
        warnings.push(...riskResult.warnings);
      }
      if (riskResult.recommendations.length > 0) {
        warnings.push(...riskResult.recommendations.map(r => `Recommendation: ${r}`));
      }

      // Check for duplicates
      if (context.existingEvents && context.existingEvents.length > 0) {
        const duplicateCheck = checkForDuplicates(
          contentResult.title,
          context.existingEvents
        );
        
        if (duplicateCheck.isDuplicate) {
          warnings.push(`Similar event exists: ${duplicateCheck.matchedEvent?.title}`);
          warnings.push(...duplicateCheck.suggestions.map(s => `Suggestion: ${s}`));
        }
      }

      const totalTime = Date.now() - startTime;

      return {
        success: true,
        content: contentResult,
        marketLogic: marketLogicResult,
        timing: timingResult,
        riskAssessment: riskResult,
        errors,
        warnings,
        metadata: {
          totalTime,
          agentsUsed,
          providerUsed: this.providerUsed,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      // Mark current agent as failed
      const currentAgent = Array.from(this.agents.values()).find(
        a => a.status === 'processing'
      );
      if (currentAgent) {
        this.failAgent(currentAgent.type, errorMessage);
      }

      return {
        success: false,
        errors,
        warnings,
        metadata: {
          totalTime: Date.now() - startTime,
          agentsUsed,
          providerUsed: this.providerUsed,
        },
      };
    } finally {
      this.isRunning = false;
      this.currentStep = 0;
      this.notify();
    }
  }

  /**
   * Run specific agent only
   */
  public async runAgent(
    type: AgentType,
    context: AgentContext
  ): Promise<any> {
    this.startAgent(type);

    try {
      let result;
      switch (type) {
        case 'content':
          result = await runContentAgent(context);
          break;
        case 'logic':
          result = await runMarketLogicAgent(context);
          break;
        case 'timing':
          result = await runTimingAgent(context);
          break;
        case 'risk':
          result = await runRiskAgent(context);
          break;
        default:
          throw new Error(`Unknown agent type: ${type}`);
      }

      this.completeAgent(type, result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.failAgent(type, errorMessage);
      throw error;
    }
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

export function resetOrchestrator(): void {
  orchestratorInstance = null;
}
