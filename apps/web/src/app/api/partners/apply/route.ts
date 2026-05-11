import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, telegram, whatsapp, phone, location, website, facebook_page } = body;
    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'নাম ও ফোন নম্বর প্রয়োজন' }, { status: 400 });
    }
    await query(
      `INSERT INTO partner_exchangers (name, telegram, whatsapp, phone, location, website, facebook_page, status, trust_score, commission_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',50,0.01)`,
      [name, telegram||null, whatsapp||null, phone, location||null, website||null, facebook_page||null]
    );
    return NextResponse.json({ success: true, message: 'আবেদন সফল। অ্যাডমিন যাচাই করে অনুমোদন দেবে।' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
