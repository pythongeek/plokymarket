import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// Note: We use the class directly to call the static method
import { MarketCreationService } from '@/lib/market-creation/service';
import { marketService } from '@/lib/services/MarketService';
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

    const steps = await MarketCreationService.createMarketFlow(
      supabase,
      marketService,
      {
        draft_id,
        deployment_config: body.deployment_config,
        user_id: user.id,
        is_super_admin: profile.is_super_admin
      }
    );

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

