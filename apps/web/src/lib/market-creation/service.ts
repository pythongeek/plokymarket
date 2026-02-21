// ============================================
// MARKET CREATION WORKFLOW SERVICE
// ============================================

export type CreationStatus = 'EVENT_CREATED' | 'MARKET_DEPLOYED' | 'LIQUIDITY_ADDED' | 'ERROR';

export interface MarketCreationStep {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  stage: 'EVENT_CREATED' | 'MARKET_DEPLOYED' | 'LIQUIDITY_ADDED';
  data?: any;
  error?: string;
}

export interface MarketTemplate {
  id: string;
  name: string;
  description: string;
  market_type: 'binary' | 'categorical' | 'scalar' | 'custom';
  category: string;
  is_premium?: boolean;
  is_active?: boolean;
  default_params?: Record<string, any>;
  validation_rules?: Record<string, any>;
  ui_config?: Record<string, any>;
}

export interface MarketDraft {
  id: string;
  creator_id: string;
  current_stage: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected' | 'deployed';
  stages_completed: string[];

  // Stage 1
  market_type?: string;
  template_id?: string;
  event_id?: string;

  // Stage 2
  question?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  min_value?: number;
  max_value?: number;
  unit?: string;
  outcomes?: Array<{ id: string; label: string }>;
  resolution_source?: string;
  resolution_source_url?: string;
  resolution_criteria?: string;
  resolution_deadline?: string;
  oracle_type?: string;
  oracle_config?: Record<string, any>;
  resolver_reference?: string;
  resolution_config?: Record<string, any>;
  image_url?: string;

  // Stage 3
  liquidity_commitment: number;
  liquidity_amount?: number;
  liquidity_deposited: boolean;
  liquidity_tx_hash?: string;

  // Stage 4
  sensitive_topics?: string[];
  regulatory_risk_level?: 'low' | 'medium' | 'high';
  legal_review_status?: 'pending' | 'approved' | 'rejected' | 'escalated';
  legal_review_notes?: string;
  requires_senior_counsel: boolean;

  // Stage 5
  simulation_config?: Record<string, any>;
  simulation_results?: Record<string, any>;

  // Stage 6
  deployment_config?: Record<string, any>;
  deployment_tx_hash?: string;
  deployed_market_id?: string;
  deployed_at?: string;

  // Verification & Oracle Config
  verification_method?: {
    type: string;
    sources: string[];
  };
  required_confirmations?: number;
  confidence_threshold?: number;

  // Trading Config
  trading_fee_percent?: number;
  trading_end_type?: 'date' | 'manual' | 'event_triggered';

  // Admin Bypass
  admin_bypass_liquidity?: boolean;
  admin_bypass_legal_review?: boolean;
  admin_bypass_simulation?: boolean;

  created_at: string;
  updated_at: string;
}

export interface LegalReviewItem {
  draft_id: string;
  question: string;
  category: string;
  risk_level: 'low' | 'medium' | 'high';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requires_senior_counsel: boolean;
  sensitive_topics: string[];
  submitted_at: string;
}

export class MarketCreationService {
  // ============================================
  // SERVER-SIDE LOGIC (Centralized Backend Workflow)
  // ============================================

  static async getTemplates(supabase: any): Promise<MarketTemplate[]> {
    const { data, error } = await supabase
      .from('market_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getLegalReviewQueue(supabase: any, user_id: string): Promise<LegalReviewItem[]> {
    const { data, error } = await supabase.rpc('get_legal_review_queue', {
      p_assignee_id: user_id
    });

    if (error) throw error;
    return data;
  }

  static async submitForLegalReview(supabase: any, draft_id: string, notes?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('submit_for_legal_review', {
      p_draft_id: draft_id,
      p_submitter_notes: notes
    });

    if (error) throw error;
    return data;
  }

  static async completeLegalReview(
    supabase: any,
    user_id: string,
    payload: { draft_id: string; status: string; notes?: string; is_senior_counsel: boolean }
  ): Promise<boolean> {
    const { draft_id, status, notes, is_senior_counsel } = payload;

    if (status === 'escalated' && !is_senior_counsel) {
      throw new Error('Senior counsel required for escalation');
    }

    const { data, error } = await supabase.rpc('complete_legal_review', {
      p_draft_id: draft_id,
      p_reviewer_id: user_id,
      p_status: status,
      p_notes: notes
    });

    if (error) throw error;
    return data;
  }

  static async recordLiquidityDeposit(
    supabase: any,
    user_id: string,
    payload: { draft_id: string; tx_hash: string; amount: number; is_admin: boolean }
  ): Promise<boolean> {
    const { draft_id, tx_hash, amount, is_admin } = payload;

    // Verify draft ownership/permissions
    const { data: draft } = await supabase
      .from('market_creation_drafts')
      .select('creator_id')
      .eq('id', draft_id)
      .single();

    if (!draft) throw new Error('Draft not found');

    if (draft.creator_id !== user_id && !is_admin) {
      throw new Error('Forbidden');
    }

    if (amount < 1000) {
      throw new Error('Minimum liquidity commitment is $1,000');
    }

    const { data, error } = await supabase.rpc('record_liquidity_deposit', {
      p_draft_id: draft_id,
      p_tx_hash: tx_hash,
      p_amount: amount
    });

    if (error) throw error;
    return data;
  }

  static async getDrafts(supabase: any, user_id: string, status?: string): Promise<MarketDraft[]> {
    let query = supabase
      .from('market_creation_drafts')
      .select('*')
      .eq('creator_id', user_id)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getDraft(supabase: any, user_id: string, draft_id: string, is_admin: boolean = false): Promise<MarketDraft> {
    const { data, error } = await supabase
      .from('market_creation_drafts')
      .select('*')
      .eq('id', draft_id)
      .single();

    if (error) throw error;

    if (data.creator_id !== user_id && !is_admin) {
      throw new Error('Forbidden');
    }

    return data;
  }

  static async createDraft(supabase: any, payload: { user_id: string; market_type: string; template_id?: string; event_id?: string }): Promise<string> {
    const { data, error } = await supabase.rpc('create_market_draft', {
      p_creator_id: payload.user_id,
      p_market_type: payload.market_type,
      p_template_id: payload.template_id,
      p_event_id: payload.event_id
    });

    if (error) throw error;
    return data;
  }

  static async updateDraftStage(supabase: any, payload: { draft_id: string; stage: string; stage_data: any }): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_draft_stage', {
      p_draft_id: payload.draft_id,
      p_stage: payload.stage,
      p_stage_data: payload.stage_data || {}
    });

    if (error) throw error;
    return data;
  }

  static async deleteDraft(supabase: any, draft_id: string, user_id: string, is_admin: boolean = false): Promise<boolean> {
    const { data: draft } = await supabase
      .from('market_creation_drafts')
      .select('creator_id')
      .eq('id', draft_id)
      .single();

    if (!draft) throw new Error('Draft not found');

    if (draft.creator_id !== user_id && !is_admin) {
      throw new Error('Forbidden');
    }

    const { error } = await supabase
      .from('market_creation_drafts')
      .delete()
      .eq('id', draft_id);

    if (error) throw error;
    return true;
  }

  static async createMarketFlow(
    supabase: any,
    marketService: any,
    payload: { draft_id: string; deployment_config?: any; user_id?: string; is_super_admin?: boolean }
  ): Promise<MarketCreationStep[]> {
    const steps: MarketCreationStep[] = [];

    try {
      const { draft_id, deployment_config, user_id, is_super_admin } = payload;

      // 1. Fetch and Validate Draft
      const { data: draft } = await supabase
        .from('market_creation_drafts')
        .select('*')
        .eq('id', draft_id)
        .single();

      if (!draft) throw new Error('Draft not found');
      if (!draft.question || draft.question.trim() === '') throw new Error('Market question is required');

      const bypassLiquidity = draft.admin_bypass_liquidity === true;
      const bypassLegal = draft.admin_bypass_legal_review === true;

      const requiredStages = ['template_selection', 'parameter_configuration'];
      if (!bypassLiquidity) requiredStages.push('liquidity_commitment');
      if (!bypassLegal) requiredStages.push('legal_review');

      const completedStages = draft.stages_completed || [];
      const missingStages = requiredStages.filter((s: string) => !completedStages.includes(s));
      if (missingStages.length > 0) throw new Error(`Missing required stages: ${missingStages.join(', ')}`);

      if (!bypassLiquidity && !draft.liquidity_deposited) {
        throw new Error('Liquidity deposit required before deployment');
      }
      if (!bypassLegal && draft.legal_review_status !== 'approved') {
        throw new Error('Legal review approval required before deployment');
      }

      // STEP 1: EVENT LOGIC
      steps.push({ status: 'PENDING', stage: 'EVENT_CREATED' });
      if (draft.event_id && draft.resolution_deadline) {
        try {
          await supabase.from('events').update({ ends_at: draft.resolution_deadline }).eq('id', draft.event_id);
          steps[steps.length - 1] = { status: 'SUCCESS', stage: 'EVENT_CREATED', data: { event_id: draft.event_id } };
        } catch (syncError: any) {
          console.warn('Failed to sync events.ends_at with market creation:', syncError);
        }
      } else {
        steps[steps.length - 1] = { status: 'SUCCESS', stage: 'EVENT_CREATED', data: { status: 'skipped' } };
      }

      // STEP 2: MARKET DEPLOY LOGIC
      steps.push({ status: 'PENDING', stage: 'MARKET_DEPLOYED' });
      const marketData = {
        question: draft.question,
        description: draft.description,
        category: draft.category || 'General',
        image_url: draft.image_url,
        trading_closes_at: draft.resolution_deadline,
        event_date: draft.resolution_deadline,
        resolution_source: draft.resolution_source,
        resolution_source_type: draft.oracle_type || 'MANUAL',
        resolution_data: {
          oracle_config: draft.oracle_config,
          verification_method: draft.verification_method || { type: 'MANUAL', sources: [] },
          required_confirmations: draft.required_confirmations || 1,
          confidence_threshold: draft.confidence_threshold || 80,
          uma_bond: (draft.liquidity_amount || draft.liquidity_commitment) >= 10000 ? 500 : 100,
          initial_liquidity: draft.liquidity_amount || draft.liquidity_commitment || 0,
          fee_percent: draft.trading_fee_percent || 2.0,
          maker_rebate_percent: 0.05,
          trading_end_type: draft.trading_end_type || 'date',
          resolution_config: draft.resolution_config
        },
        status: 'active',
        creator_id: draft.creator_id
      };

      const initialLiquidity = draft.liquidity_amount || draft.liquidity_commitment || 1000;
      const market = await marketService.createMarketWithLiquidity(
        draft.event_id,
        marketData as any,
        initialLiquidity
      );

      // Create categorical/scalar dependencies if applicable
      if (draft.market_type === 'categorical' && draft.outcomes) {
        await supabase.from('categorical_markets').insert({
          market_id: market.id, outcomes: draft.outcomes, outcome_count: Array.isArray(draft.outcomes) ? draft.outcomes.length : 0
        });
      }

      if (draft.market_type === 'scalar' && draft.min_value != null) {
        await supabase.from('scalar_markets').insert({
          market_id: market.id, min_value: draft.min_value, max_value: draft.max_value, unit: draft.unit || 'USD'
        });
      }

      steps[steps.length - 1] = { status: 'SUCCESS', stage: 'MARKET_DEPLOYED', data: { market_id: market.id } };

      // Record deployment in drafts table
      const finalDeploymentConfig = {
        deployer_id: user_id,
        is_super_admin: is_super_admin,
        verification_method: draft.verification_method,
        required_confirmations: draft.required_confirmations,
        confidence_threshold: draft.confidence_threshold,
        trading_fee_percent: draft.trading_fee_percent,
        trading_end_type: draft.trading_end_type,
        admin_bypasses: {
          liquidity: bypassLiquidity,
          legal_review: bypassLegal,
          simulation: draft.admin_bypass_simulation === true
        },
        ...deployment_config
      };

      await supabase.from('market_creation_drafts').update({
        status: 'deployed',
        deployed_market_id: market.id,
        deployed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        deployment_config: finalDeploymentConfig
      }).eq('id', draft_id);

      // STEP 3: LIQUIDITY ADD LOGIC
      steps.push({ status: 'PENDING', stage: 'LIQUIDITY_ADDED' });
      // Logic for adding liquidity via bot is handled in MarketService already but tracked here
      steps[steps.length - 1] = { status: 'SUCCESS', stage: 'LIQUIDITY_ADDED', data: { added: initialLiquidity } };

      return steps;
    } catch (error: any) {
      console.error("Error in createMarketFlow:", error);
      steps.push({ status: 'FAILED', stage: 'MARKET_DEPLOYED', error: error.message });
      return steps;
    }
  }

  // ============================================
  // CLIENT API WRAPPERS
  // ============================================
  // DRAFTS
  // ============================================

  async createDraft(marketType: string, templateId?: string, eventId?: string): Promise<string> {
    const res = await fetch('/api/admin/market-creation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market_type: marketType, template_id: templateId, event_id: eventId })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create draft');
    }

    const { data } = await res.json();
    return data;
  }

  async getDrafts(status?: string): Promise<MarketDraft[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);

    const res = await fetch(`/api/admin/market-creation?${params}`);
    if (!res.ok) throw new Error('Failed to fetch drafts');

    const { data } = await res.json();
    return data;
  }

  async getDraft(draftId: string): Promise<MarketDraft> {
    const res = await fetch(`/api/admin/market-creation?id=${draftId}`);
    if (!res.ok) throw new Error('Failed to fetch draft');

    const { data } = await res.json();
    return data;
  }

  async updateStage(
    draftId: string,
    stage: string,
    stageData: Record<string, any>
  ): Promise<boolean> {
    const res = await fetch('/api/admin/market-creation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId, stage, stage_data: stageData })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update stage');
    }

    const { success } = await res.json();
    return success;
  }

  async deleteDraft(draftId: string): Promise<boolean> {
    const res = await fetch(`/api/admin/market-creation?id=${draftId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete draft');
    }

    return true;
  }

  // ============================================
  // TEMPLATES
  // ============================================

  async getTemplates(): Promise<MarketTemplate[]> {
    const res = await fetch('/api/admin/market-creation/templates');
    if (!res.ok) throw new Error('Failed to fetch templates');

    const { data } = await res.json();
    return data;
  }

  // ============================================
  // LEGAL REVIEW
  // ============================================

  async getLegalReviewQueue(): Promise<LegalReviewItem[]> {
    const res = await fetch('/api/admin/market-creation/legal-review');
    if (!res.ok) throw new Error('Failed to fetch review queue');

    const { data } = await res.json();
    return data;
  }

  async submitForLegalReview(draftId: string, notes?: string): Promise<boolean> {
    const res = await fetch('/api/admin/market-creation/legal-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId, notes })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit for review');
    }

    const { success } = await res.json();
    return success;
  }

  async completeLegalReview(
    draftId: string,
    status: 'approved' | 'rejected' | 'escalated',
    notes?: string
  ): Promise<boolean> {
    const res = await fetch('/api/admin/market-creation/legal-review', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId, status, notes })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete review');
    }

    const { success } = await res.json();
    return success;
  }

  // ============================================
  // LIQUIDITY
  // ============================================

  async recordLiquidityDeposit(
    draftId: string,
    txHash: string,
    amount: number
  ): Promise<boolean> {
    const res = await fetch('/api/admin/market-creation/liquidity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId, tx_hash: txHash, amount })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record deposit');
    }

    const { success } = await res.json();
    return success;
  }

  // ============================================
  // DEPLOYMENT
  // ============================================

  async deployMarket(
    draftId: string,
    deploymentConfig?: Record<string, any>
  ): Promise<{ market_id: string; deployed_at: string; steps: MarketCreationStep[] }> {
    const res = await fetch('/api/admin/market-creation/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: draftId, deployment_config: deploymentConfig })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to deploy market');
    }

    return res.json();
  }

  // ============================================
  // VALIDATION
  // ============================================

  validateStage(stage: string, data: Record<string, any>): string[] {
    const errors: string[] = [];
    const isBypassed = (flag: string) => data[flag] === true;

    switch (stage) {
      case 'template_selection':
        if (!data.market_type) errors.push('Market type is required');
        break;

      case 'parameter_configuration':
        if (!data.question?.trim()) errors.push('Question is required');
        if (data.question && data.question.length < 10) errors.push('Question must be at least 10 characters');
        if (!data.category) errors.push('Category is required');
        if (!data.resolution_deadline) errors.push('Resolution deadline is required');
        if (!data.resolution_criteria?.trim()) errors.push('Resolution criteria is required');

        // Scalar market validation
        if (data.market_type === 'scalar') {
          if (data.min_value === undefined) errors.push('Minimum value is required for scalar markets');
          if (data.max_value === undefined) errors.push('Maximum value is required for scalar markets');
          if (data.min_value >= data.max_value) errors.push('Minimum must be less than maximum');
        }

        // Categorical market validation
        if (data.market_type === 'categorical') {
          if (!data.outcomes || data.outcomes.length < 2) {
            errors.push('At least 2 outcomes are required for categorical markets');
          }
        }
        break;

      case 'liquidity_commitment':
        if (!isBypassed('admin_bypass_liquidity')) {
          if (!data.liquidity_amount || data.liquidity_amount < 1000) {
            errors.push('Minimum liquidity commitment is $1,000 (or enable admin bypass)');
          }
        }
        break;

      // Legal review and simulation bypassed via admin flags — no hard validation
    }

    return errors;
  }

  // ============================================
  // STAGE HELPERS
  // ============================================

  getStageName(stage: string): string {
    const names: Record<string, string> = {
      'template_selection': 'Template Selection',
      'parameter_configuration': 'Parameter Configuration',
      'liquidity_commitment': 'Liquidity Commitment',
      'legal_review': 'Legal Review',
      'preview_simulation': 'Preview & Simulation',
      'deployment': 'Deployment'
    };
    return names[stage] || stage;
  }

  getStageDescription(stage: string): string {
    const descriptions: Record<string, string> = {
      'template_selection': 'Choose a market template or start from scratch',
      'parameter_configuration': 'Define market parameters and resolution criteria',
      'liquidity_commitment': 'Commit minimum $1,000 in liquidity',
      'legal_review': 'Review by legal team for sensitive topics',
      'preview_simulation': 'Test market with virtual trading',
      'deployment': 'Deploy market to the platform'
    };
    return descriptions[stage] || '';
  }

  // ============================================
  // EVENTS SYSTEM (New)
  // ============================================

  async getEvents(): Promise<any[]> {
    const res = await fetch('/api/admin/events');
    if (!res.ok) throw new Error('Failed to fetch events');
    const { data } = await res.json();
    return data;
  }

  async getEvent(id: string): Promise<any> {
    const res = await fetch(`/api/admin/events/${id}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    const { data } = await res.json();
    return data;
  }

  async createEvent(eventData: any): Promise<string> {
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create event');
    }

    const { data } = await res.json();
    return data.id;
  }

  async updateEvent(id: string, eventData: any): Promise<boolean> {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update event');
    }

    return true;
  }
}

export const marketCreationService = new MarketCreationService();
