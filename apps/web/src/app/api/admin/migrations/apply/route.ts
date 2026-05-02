// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import fs from 'fs';
import path from 'path';

async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const migration = searchParams.get('migration');

        if (!migration) {
            return NextResponse.json({ error: 'Migration name required' }, { status: 400 });
        }

        const migrationPath = path.join(process.cwd(), '..', 'supabase', 'migrations', migration);

        if (!fs.existsSync(migrationPath)) {
            return NextResponse.json({ error: `Migration file not found: ${migration}` }, { status: 404 });
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        const statements: string[] = [];
        let current = '';
        let inDollarQuote = false;
        let dollarTag = '';
        let parenDepth = 0;

        for (let i = 0; i < sql.length; i++) {
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
                    if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
                        continue;
                    }
                    errorCount++;
                    if (errors.length < 5) {
                        errors.push(`${statement.substring(0, 80)}...: ${err.message}`);
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: `Migration ${migration} applied: ${successCount} statements succeeded, ${errorCount} errors`,
                statementsRun: successCount,
                errors
            });
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({
            error: error.message || 'Migration failed'
        }, { status: 500 });
    }
}
