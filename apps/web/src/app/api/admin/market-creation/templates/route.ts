import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MarketCreationService } from '@/lib/market-creation/service';

// GET /api/admin/market-creation/templates - List all templates
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await MarketCreationService.getTemplates(supabase);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
