import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/market-creation/deploy - Deploy market to production
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { draft_id } = body;

    if (!draft_id) {
      return NextResponse.json(
        { error: 'Draft ID required' },
        { status: 400 }
      );
    }

    // Get draft details
    const { data: draft } = await supabase
      .from('market_creation_drafts')
      .select('*')
      .eq('id', draft_id)
      .single();

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Validate question exists
    if (!draft.question || draft.question.trim() === '') {
      return NextResponse.json(
        { error: 'Market question is required' },
        { status: 400 }
      );
    }

    // Check bypass flags
    const bypassLiquidity = draft.admin_bypass_liquidity === true;
    const bypassLegal = draft.admin_bypass_legal_review === true;

    // Validate required stages (respecting bypass flags)
    const requiredStages = ['template_selection', 'parameter_configuration'];

    if (!bypassLiquidity) {
      requiredStages.push('liquidity_commitment');
    }
    if (!bypassLegal) {
      requiredStages.push('legal_review');
    }

    const completedStages = draft.stages_completed || [];
    const missingStages = requiredStages.filter((s: string) => !completedStages.includes(s));

    if (missingStages.length > 0) {
      return NextResponse.json(
        { error: `Missing required stages: ${missingStages.join(', ')}` },
        { status: 400 }
      );
    }

    // Check liquidity (unless bypassed)
    if (!bypassLiquidity && !draft.liquidity_deposited) {
      return NextResponse.json(
        { error: 'Liquidity deposit required before deployment (or enable admin bypass)' },
        { status: 400 }
      );
    }

    // Check legal review (unless bypassed)
    if (!bypassLegal && draft.legal_review_status !== 'approved') {
      return NextResponse.json(
        { error: 'Legal review approval required before deployment (or enable admin bypass)' },
        { status: 400 }
      );
    }

    // Create the actual market
    const marketData: Record<string, any> = {
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
        trading_end_type: draft.trading_end_type || 'date'
      },
      status: 'active',
      creator_id: draft.creator_id
    };

    const { data: market, error: marketError } = await supabase
      .from('markets')
      .insert(marketData)
      .select()
      .single();

    if (marketError) throw marketError;

    // Create categorical/scalar market entries if applicable
    if (draft.market_type === 'categorical' && draft.outcomes) {
      try {
        await supabase
          .from('categorical_markets')
          .insert({
            market_id: market.id,
            outcomes: draft.outcomes,
            outcome_count: Array.isArray(draft.outcomes) ? draft.outcomes.length : 0
          });
      } catch {
        // categorical_markets table may not exist
      }
    }

    if (draft.market_type === 'scalar' && draft.min_value != null) {
      try {
        await supabase
          .from('scalar_markets')
          .insert({
            market_id: market.id,
            min_value: draft.min_value,
            max_value: draft.max_value,
            unit: draft.unit || 'USD'
          });
      } catch {
        // scalar_markets table may not exist
      }
    }

    // Record deployment in drafts table
    const deploymentConfig = {
      deployer_id: user.id,
      is_super_admin: profile.is_super_admin,
      verification_method: draft.verification_method,
      required_confirmations: draft.required_confirmations,
      confidence_threshold: draft.confidence_threshold,
      trading_fee_percent: draft.trading_fee_percent,
      trading_end_type: draft.trading_end_type,
      admin_bypasses: {
        liquidity: bypassLiquidity,
        legal_review: bypassLegal,
        simulation: draft.admin_bypass_simulation === true
      }
    };

    await supabase
      .from('market_creation_drafts')
      .update({
        status: 'deployed',
        deployed_market_id: market.id,
        deployed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        deployment_config: deploymentConfig
      })
      .eq('id', draft_id);

    return NextResponse.json({
      success: true,
      market_id: market.id,
      deployed_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error deploying market:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deploy market' },
      { status: 500 }
    );
  }
}
