import { NextRequest, NextResponse } from 'next/server';
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { marketService } from '@/lib/services/MarketService';


// POST /api/admin/market-creation/deploy - Deploy market to production
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;


    const profileResult = await pool.query(
      'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { draft_id } = body;
    if (!draft_id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    // Fetch and validate draft
    const draftResult = await pool.query(
      'SELECT * FROM market_creation_drafts WHERE id = $1',
      [draft_id]
    );
    const draft = draftResult.rows[0];
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    if (!draft.question || draft.question.trim() === '') {
      return NextResponse.json({ error: 'Market question is required' }, { status: 400 });
    }

    const bypassLiquidity = draft.admin_bypass_liquidity === true;
    const bypassLegal = draft.admin_bypass_legal_review === true;

    const requiredStages = ['template_selection', 'parameter_configuration'];
    if (!bypassLiquidity) requiredStages.push('liquidity_commitment');
    if (!bypassLegal) requiredStages.push('legal_review');

    const completedStages = draft.stages_completed || [];
    const missingStages = requiredStages.filter((s: string) => !completedStages.includes(s));
    if (missingStages.length > 0) {
      return NextResponse.json({ error: `Missing required stages: ${missingStages.join(', ')}` }, { status: 400 });
    }

    if (!bypassLiquidity && !draft.liquidity_deposited) {
      return NextResponse.json({ error: 'Liquidity deposit required before deployment' }, { status: 400 });
    }
    if (!bypassLegal && draft.legal_review_status !== 'approved') {
      return NextResponse.json({ error: 'Legal review approval required before deployment' }, { status: 400 });
    }

    const steps: any[] = [];

    // STEP 1: EVENT LOGIC
    steps.push({ status: 'PENDING', stage: 'EVENT_CREATED' });
    if (draft.event_id && draft.resolution_deadline) {
      try {
        await pool.query(
          'UPDATE events SET ends_at = $1 WHERE id = $2',
          [draft.resolution_deadline, draft.event_id]
        );
        steps[steps.length - 1] = { status: 'SUCCESS', stage: 'EVENT_CREATED', data: { event_id: draft.event_id } };
      } catch (syncError: any) {
        console.warn('Failed to sync events.ends_at with market creation:', syncError);
        steps[steps.length - 1] = { status: 'SUCCESS', stage: 'EVENT_CREATED', data: { status: 'skipped' } };
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
      await pool.query(
        `INSERT INTO categorical_markets (market_id, outcomes, outcome_count) VALUES ($1, $2, $3)`,
        [market.id, JSON.stringify(draft.outcomes), Array.isArray(draft.outcomes) ? draft.outcomes.length : 0]
      );
    }

    if (draft.market_type === 'scalar' && draft.min_value != null) {
      await pool.query(
        `INSERT INTO scalar_markets (market_id, min_value, max_value, unit) VALUES ($1, $2, $3, $4)`,
        [market.id, draft.min_value, draft.max_value, draft.unit || 'USD']
      );
    }

    steps[steps.length - 1] = { status: 'SUCCESS', stage: 'MARKET_DEPLOYED', data: { market_id: market.id } };

    // Record deployment in drafts table
    const finalDeploymentConfig = {
      deployer_id: userId,
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
      },
      ...body.deployment_config
    };

    await pool.query(
      `UPDATE market_creation_drafts SET status = 'deployed', deployed_market_id = $1, deployed_at = $2, completed_at = $3, deployment_config = $4 WHERE id = $5`,
      [market.id, new Date().toISOString(), new Date().toISOString(), JSON.stringify(finalDeploymentConfig), draft_id]
    );

    // STEP 3: LIQUIDITY ADD LOGIC
    steps.push({ status: 'SUCCESS', stage: 'LIQUIDITY_ADDED', data: { added: initialLiquidity } });

    const hasError = steps.some((s: any) => s.status === 'FAILED');
    if (hasError) {
      const errorStep = steps.find((s: any) => s.status === 'FAILED');
      return NextResponse.json(
        { error: errorStep?.error || 'Deployment failed' },
        { status: 500 }
      );
    }

    const marketDeployedStep = steps.find((s: any) => s.stage === 'MARKET_DEPLOYED' && s.status === 'SUCCESS');
    if (!marketDeployedStep) {
      return NextResponse.json(
        { error: 'Market deployment step missing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      market_id: marketDeployedStep.data.market_id,
      deployed_at: new Date().toISOString(),
      steps
    });
  } catch (error: any) {
    console.error('Error deploying market:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deploy market' },
      { status: 500 }
    );
  }
}
