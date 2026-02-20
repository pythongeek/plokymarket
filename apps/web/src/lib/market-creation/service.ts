// ============================================
// MARKET CREATION WORKFLOW SERVICE
// ============================================

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

class MarketCreationService {
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
  ): Promise<{ market_id: string; deployed_at: string }> {
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
