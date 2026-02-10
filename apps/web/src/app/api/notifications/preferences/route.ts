import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Return defaults if not found
    const defaults = {
      user_id: user.id,
      notifications_enabled: true,
      do_not_disturb: false,
      timezone: 'Asia/Dhaka',
      order_fills_enabled: true,
      order_fills_min_amount: 1000,
      order_fills_channels: ['websocket', 'push', 'email'],
      market_resolution_enabled: true,
      market_resolution_advance_warning: true,
      market_resolution_channels: ['websocket', 'push', 'email', 'in_app'],
      price_alerts_enabled: true,
      price_alerts_threshold: 5.0,
      price_alerts_cooldown_minutes: 60,
      price_alerts_channels: ['push', 'email'],
      position_risk_enabled: true,
      position_risk_margin_threshold: 80.0,
      position_risk_channels: ['websocket', 'push'],
      social_notifications_enabled: true,
      social_digest_frequency: 'hourly',
      social_channels: ['in_app', 'email'],
      system_maintenance_enabled: true,
      system_maintenance_advance_hours: 24,
      system_maintenance_channels: ['email', 'in_app'],
      volatility_adjusted_thresholds: true,
      ml_relevance_filtering: true,
      snooze_enabled: true,
      batch_non_urgent: true,
      batch_interval_minutes: 5
    };
    
    return NextResponse.json({ data: data || defaults });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update preferences
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate channels
    const validChannels = ['websocket', 'push', 'email', 'webhook', 'in_app', 'sms'];
    
    const validateChannels = (channels: string[]) => {
      return channels.filter(c => validChannels.includes(c));
    };
    
    // Build update object
    const updates: any = {
      user_id: user.id,
      updated_at: new Date().toISOString()
    };
    
    // Global settings
    if (body.notifications_enabled !== undefined) updates.notifications_enabled = body.notifications_enabled;
    if (body.do_not_disturb !== undefined) updates.do_not_disturb = body.do_not_disturb;
    if (body.do_not_disturb_until !== undefined) updates.do_not_disturb_until = body.do_not_disturb_until;
    if (body.timezone !== undefined) updates.timezone = body.timezone;
    
    // Order fills
    if (body.order_fills_enabled !== undefined) updates.order_fills_enabled = body.order_fills_enabled;
    if (body.order_fills_min_amount !== undefined) updates.order_fills_min_amount = body.order_fills_min_amount;
    if (body.order_fills_channels !== undefined) updates.order_fills_channels = validateChannels(body.order_fills_channels);
    
    // Market resolutions
    if (body.market_resolution_enabled !== undefined) updates.market_resolution_enabled = body.market_resolution_enabled;
    if (body.market_resolution_advance_warning !== undefined) updates.market_resolution_advance_warning = body.market_resolution_advance_warning;
    if (body.market_resolution_channels !== undefined) updates.market_resolution_channels = validateChannels(body.market_resolution_channels);
    
    // Price alerts
    if (body.price_alerts_enabled !== undefined) updates.price_alerts_enabled = body.price_alerts_enabled;
    if (body.price_alerts_threshold !== undefined) updates.price_alerts_threshold = body.price_alerts_threshold;
    if (body.price_alerts_cooldown_minutes !== undefined) updates.price_alerts_cooldown_minutes = body.price_alerts_cooldown_minutes;
    if (body.price_alerts_channels !== undefined) updates.price_alerts_channels = validateChannels(body.price_alerts_channels);
    
    // Position risk
    if (body.position_risk_enabled !== undefined) updates.position_risk_enabled = body.position_risk_enabled;
    if (body.position_risk_margin_threshold !== undefined) updates.position_risk_margin_threshold = body.position_risk_margin_threshold;
    if (body.position_risk_channels !== undefined) updates.position_risk_channels = validateChannels(body.position_risk_channels);
    
    // Social
    if (body.social_notifications_enabled !== undefined) updates.social_notifications_enabled = body.social_notifications_enabled;
    if (body.social_digest_frequency !== undefined) updates.social_digest_frequency = body.social_digest_frequency;
    if (body.social_channels !== undefined) updates.social_channels = validateChannels(body.social_channels);
    
    // System
    if (body.system_maintenance_enabled !== undefined) updates.system_maintenance_enabled = body.system_maintenance_enabled;
    if (body.system_maintenance_advance_hours !== undefined) updates.system_maintenance_advance_hours = body.system_maintenance_advance_hours;
    if (body.system_maintenance_channels !== undefined) updates.system_maintenance_channels = validateChannels(body.system_maintenance_channels);
    
    // Smart features
    if (body.volatility_adjusted_thresholds !== undefined) updates.volatility_adjusted_thresholds = body.volatility_adjusted_thresholds;
    if (body.ml_relevance_filtering !== undefined) updates.ml_relevance_filtering = body.ml_relevance_filtering;
    if (body.snooze_enabled !== undefined) updates.snooze_enabled = body.snooze_enabled;
    
    // Batching
    if (body.batch_non_urgent !== undefined) updates.batch_non_urgent = body.batch_non_urgent;
    if (body.batch_interval_minutes !== undefined) updates.batch_interval_minutes = body.batch_interval_minutes;
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(updates)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
