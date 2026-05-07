import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


// GET /api/admin/market-creation/templates - List all templates
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminUser(req);


    const result = await pool.query(
      'SELECT * FROM market_templates WHERE is_active = true ORDER BY category ASC'
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
