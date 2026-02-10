import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/market-creation/deploy - Deploy market
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
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { draft_id, deployment_config } = body;

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

    // Validate all stages are complete
    const requiredStages = [
      'template_selection',
      'parameter_configuration',
      'liquidity_commitment',
      'legal_review'
    ];

    const completedStages = draft.stages_completed || [];
    const missingStages = requiredStages.filter(s => !completedStages.includes(s));

    if (missingStages.length > 0) {
      return NextResponse.json(
        { error: `Missing required stages: ${missingStages.join(', ')}` },
        { status: 400 }
      );
    }

    // Check liquidity deposited
    if (!draft.liquidity_deposited) {
      return NextResponse.json(
        { error: 'Liquidity deposit required before deployment' },
        { status: 400 }
      );
    }

    // Check legal review approved
    if (draft.legal_review_status !== 'approved') {
      return NextResponse.json(
        { error: 'Legal review approval required before deployment' },
        { status: 400 }
      );
    }

    // Create the actual market
    const marketData = {
      question: draft.question,
      description: draft.description,
      category: draft.category,
      image_url: draft.image_url,
      trading_closes_at: draft.resolution_deadline,
      event_date: draft.resolution_deadline,
      resolution_source: draft.resolution_source,
      resolution_source_type: draft.oracle_type || 'MANUAL',
      resolution_data: {
        oracle_config: draft.oracle_config,
        uma_bond: draft.liquidity_commitment >= 10000 ? 500 : 100,
        initial_liquidity: draft.liquidity_commitment,
        fee_percent: 2.0,
        maker_rebate_percent: 0.05
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

    // Record deployment
    const { data, error } = await supabase.rpc('record_market_deployment', {
      p_draft_id: draft_id,
      p_market_id: market.id,
      p_tx_hash: deployment_config?.tx_hash || null,
      p_deployment_config: deployment_config || {}
    });

    if (error) throw error;

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
