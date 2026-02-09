import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/rebates - Get user's rebate status and history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'current'; // 'current', 'history', 'tiers'
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    switch (type) {
      case 'current': {
        // Get current month rebate status
        const { data, error } = await supabase
          .from('user_current_rebate_status')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        // Get tier configurations for comparison
        const { data: tiers } = await supabase
          .from('rebate_tiers_config')
          .select('*')
          .eq('is_active', true)
          .order('id');
        
        return NextResponse.json({
          data: {
            current: data || {
              user_id: user.id,
              year_month: new Date().toISOString().slice(0, 7),
              maker_volume: 0,
              qualifying_volume: 0,
              rebate_tier: 1,
              tier_name: 'Standard',
              rebate_rate_percent: 0.02,
              estimated_rebate: 0,
              claimed_rebate: 0,
              available_to_claim: 0
            },
            tiers: tiers || []
          }
        });
      }
      
      case 'history': {
        // Get rebate history
        const { data, error } = await supabase
          .from('user_rebate_history')
          .select('*')
          .eq('user_id', user.id)
          .order('rebate_period_start', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        return NextResponse.json({ data: data || [] });
      }
      
      case 'tiers': {
        // Get all tier configurations
        const { data: tiers, error } = await supabase
          .from('rebate_tiers_config')
          .select('*')
          .eq('is_active', true)
          .order('id');
        
        if (error) throw error;
        
        const { data: spreadMultipliers } = await supabase
          .from('spread_multiplier_config')
          .select('*')
          .eq('is_active', true)
          .order('id');
        
        return NextResponse.json({
          data: {
            tiers: tiers || [],
            spreadMultipliers: spreadMultipliers || []
          }
        });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in rebates API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rebate data' },
      { status: 500 }
    );
  }
}

// POST /api/rebates/claim - Claim a rebate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rebateId, paymentMethod = 'USDC' } = body;
    
    if (!rebateId) {
      return NextResponse.json({ error: 'Missing rebateId' }, { status: 400 });
    }
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Call the claim function
    const { data, error } = await supabase.rpc('claim_rebate', {
      p_rebate_id: rebateId,
      p_user_id: user.id,
      p_payment_method: paymentMethod
    });
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error claiming rebate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to claim rebate' },
      { status: 500 }
    );
  }
}
