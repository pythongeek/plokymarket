import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import crypto from 'crypto';

function generateVoucherCode(prefix: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 15; i++) {
        code += chars[crypto.randomInt(chars.length)];
        if (i === 4 || i === 9) code += '-';
    }
    return `${prefix}-${code}`;
}

/**
 * POST /api/admin/vouchers/generate
 * ভাউচার কোড বাল্ক তৈরি করুন
 * Body: { count: number, usdt_value: number, prefix: string, expires_days?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;

    const body = await req.json();
    const count = Math.min(parseInt(body.count) || 10, 500);
    const usdtValue = parseFloat(body.usdt_value) || 10;
    const prefix = (body.prefix || 'POLY').toUpperCase().slice(0, 8);
    const expiresDays = body.expires_days ? parseInt(body.expires_days) : null;

    const batchId = `BATCH-${Date.now()}`;
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
        let code: string;
        let attempts = 0;
        do {
            code = generateVoucherCode(prefix);
            attempts++;
        } while (attempts < 10 && (await query('SELECT 1 FROM voucher_codes WHERE code = $1', [code])).length > 0);

        codes.push(code);
        const expiresAt = expiresDays
            ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
            : null;

        await query(
            `INSERT INTO voucher_codes (code, usdt_value, status, batch_id, expires_at, created_at)
             VALUES ($1, $2, 'active', $3, $4, NOW())`,
            [code, usdtValue, batchId, expiresAt]
        );
    }

    return NextResponse.json({
        success: true,
        generated: count,
        batch_id: batchId,
        usdt_value: usdtValue,
        codes,
    });

  } catch (err: any) {
    console.error('Voucher generation error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
