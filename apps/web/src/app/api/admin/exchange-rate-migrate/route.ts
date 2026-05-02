// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/exchange-rate-migrate
 * Applies the exchange rate system migration using direct pg connection.
 */
export async function POST(request: NextRequest) {
    try {
        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260308000000_exchange_rate_system.sql');

        if (!fs.existsSync(migrationPath)) {
            return NextResponse.json({ error: `Migration file not found: ${migrationPath}` }, { status: 404 });
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        const statements: string[] = [];
        let current = '';
        let inDollarQuote = false;
        let dollarTag = '';
        let parenDepth = 0;
        let i = 0;

        for (i = 0; i < sql.length; i++) {
            const ch = sql[i];
            if (ch === '$' && sql[i + 1] && /[a-zA-Z_]/.test(sql[i + 1])) {
                let j = i + 1;
                while (j < sql.length && /[a-zA-Z_]/.test(sql[j])) j++;
                const tag = sql.substring(i, j);
                if (!inDollarQuote) {
                    inDollarQuote = true;
                    dollarTag = tag;
                } else if (tag === dollarTag) {
                    inDollarQuote = false;
                    dollarTag = '';
                }
                current += ch;
            } else if (ch === "'" && !inDollarQuote) {
                current += ch;
                i++;
                while (i < sql.length && sql[i] === "'") {
                    current += sql[i];
                    i++;
                }
                i--;
            } else if (ch === '(' && !inDollarQuote) {
                parenDepth++;
                current += ch;
            } else if (ch === ')' && !inDollarQuote) {
                parenDepth--;
                current += ch;
            } else if (ch === ';' && parenDepth === 0 && !inDollarQuote) {
                const stmt = current.trim();
                if (stmt.length > 0 && !stmt.startsWith('--')) {
                    statements.push(stmt);
                }
                current = '';
            } else {
                current += ch;
            }
        }

        if (current.trim().length > 0) {
            statements.push(current.trim());
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        const client = await pool.connect();
        try {
            for (const statement of statements) {
                if (!statement.trim() || statement.trim().startsWith('--')) continue;
                try {
                    await client.query(statement);
                    successCount++;
                } catch (err: any) {
                    if (err.message?.includes('already exists') || err.message?.includes('duplicate') || err.message?.includes('nsert')) {
                        continue;
                    }
                    errorCount++;
                    if (errors.length < 5) {
                        errors.push(`${statement.substring(0, 80)}...: ${err.message}`);
                    }
                }
            }

            const funcCheck = await client.query(
                "SELECT 1 FROM pg_proc WHERE proname = 'update_exchange_rate'"
            ).catch(() => ({ rows: [] }));

            const tablesResult = await client.query(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'exchange%'"
            ).catch(() => ({ rows: [] }));

            return NextResponse.json({
                success: true,
                message: `Migration processed: ${successCount} statements succeeded, ${errorCount} errors`,
                statementsRun: successCount,
                errors,
                tables: tablesResult.rows.map((r: any) => r.tablename),
                functionCreated: funcCheck.rows.length > 0
            });
        } finally {
            client.release();
        }

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
