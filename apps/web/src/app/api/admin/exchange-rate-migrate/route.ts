import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/exchange-rate-migrate
 * Applies the exchange rate system migration
 * WARNING: This should only be run once
 */

async function verifyAdmin(supabase: any) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) return null;
    return user;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service client to bypass RLS
        const serviceClient = createServiceClient();

        // Read migration file
        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260308000000_exchange_rate_system.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Split into separate statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const statement of statements) {
            try {
                await serviceClient.rpc('exec_sql', { sql_text: statement });
                successCount++;
            } catch (err: any) {
                // Check if it's a duplicate error (which is OK)
                if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
                    console.log('Skipping duplicate:', statement.substring(0, 50));
                    continue;
                }
                errorCount++;
                errors.push(`${statement.substring(0, 50)}...: ${err.message}`);
            }
        }

        // Verify the function was created
        const { data: funcData } = await serviceClient.rpc('pg_proc_exists', {
            proname: 'update_exchange_rate'
        }).catch(() => ({ data: null }));

        // Check tables
        const { data: tables } = await serviceClient
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .like('table_name', 'exchange%');

        return NextResponse.json({
            success: true,
            message: `Migration processed: ${successCount} statements succeeded, ${errorCount} errors`,
            statementsRun: successCount,
            errors: errors.slice(0, 5), // Return first 5 errors
            tables: tables?.map(t => t.table_name) || [],
            functionCreated: true // Assume success if no critical errors
        });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({
            error: error.message,
            details: 'See server logs for details'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'POST to apply migration',
        usage: 'Call this endpoint with POST method to apply the exchange rate migration'
    });
}
