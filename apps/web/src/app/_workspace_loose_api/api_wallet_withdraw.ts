// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}

const VALID_CRYPTO_NETWORKS = ['bep20', 'trc20', 'ton', 'erc20'];
const VALID_MFS_PROVIDERS = ['bkash', 'nagad', 'rocket', 'upay'];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'অনুমোদন ব্যর্থ' }, { status: 401 });
    }

    const body = await req.json();
    const {
      withdrawal_method,
      usdt_amount,
      mfs_provider,
      recipient_number,
      recipient_name,
      crypto_network,
      wallet_address,
      bank_name,
      account_number,
      account_holder_name,
      branch_name
    } = body;

    // Validation
    if (!usdt_amount || usdt_amount < 5) {
      return NextResponse.json({ error: 'সর্বনিম্ন উইথড্রয়াল ৫ USDT' }, { status: 400 });
    }

    if (!withdrawal_method || !['mfs', 'crypto', 'bank'].includes(withdrawal_method)) {
      return NextResponse.json({ error: 'ভুল উইথড্রয়াল পদ্ধতি' }, { status: 400 });
    }

    // Method-specific validation
    if (withdrawal_method === 'mfs') {
      if (!mfs_provider || !VALID_MFS_PROVIDERS.includes(mfs_provider)) {
        return NextResponse.json({ error: 'bKash/Nagad/Rocket/Upay নির্বাচন করুন' }, { status: 400 });
      }
      if (!recipient_number || !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(recipient_number)) {
        return NextResponse.json({ error: 'বৈধ বাংলাদেশি মোবাইল নম্বর দিন' }, { status: 400 });
      }
    } else if (withdrawal_method === 'crypto') {
      if (!crypto_network || !VALID_CRYPTO_NETWORKS.includes(crypto_network)) {
        return NextResponse.json({ error: 'BEP20/TRC20/TON নির্বাচন করুন' }, { status: 400 });
      }
      if (!wallet_address || wallet_address.length < 10) {
        return NextResponse.json({ error: 'বৈধ ওয়ালেট ঠিকানা দিন' }, { status: 400 });
      }
    } else if (withdrawal_method === 'bank') {
      if (!bank_name || !account_number || !account_holder_name) {
        return NextResponse.json({ error: 'ব্যাংকের নাম, অ্যাকাউন্ট নম্বর ও ধারকের নাম প্রয়োজন' }, { status: 400 });
      }
    }

    // Get fee
    const { data: feeData } = await supabase.rpc('get_withdrawal_fee', {
      p_method: withdrawal_method,
      p_network: crypto_network || null
    });
    const fee = feeData?.[0] || { fee_usdt: 2, fee_percent: 0, min_amount: 10, max_amount: 50000 };

    if (usdt_amount < fee.min_amount) {
      return NextResponse.json({ error: `সর্বনিম্ন ${fee.min_amount} USDT` }, { status: 400 });
    }
    if (usdt_amount > fee.max_amount) {
      return NextResponse.json({ error: `সর্বোচ্চ ${fee.max_amount} USDT` }, { status: 400 });
    }

    const totalFee = fee.fee_usdt + (usdt_amount * fee.fee_percent / 100);
    const netUsdt = usdt_amount - totalFee;

    // Get exchange rate
    const { data: rateRow } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('pair', 'USDTBDT')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    const rate = rateRow?.rate || 119.5;
    const bdtAmount = netUsdt * rate;

    // Check balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (!wallet || wallet.balance < usdt_amount) {
      return NextResponse.json({ error: 'অপর্যাপ্ত ব্যালেন্স' }, { status: 400 });
    }

    // KYC limit check
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('kyc_verified')
      .eq('id', user.id)
      .single();

    const dailyLimit = profile?.kyc_verified ? 50000 : 10000;
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReqs } = await supabase
      .from('withdrawal_requests')
      .select('usdt_amount')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .in('status', ['pending', 'processing']);

    const todayTotal = (todayReqs || []).reduce((s, r) => s + Number(r.usdt_amount || 0), 0);
    if (todayTotal + usdt_amount > dailyLimit) {
      return NextResponse.json({ error: `দৈনিক সীমা ৳${dailyLimit} অতিক্রম` }, { status: 400 });
    }

    // Lock funds via RPC
    const { error: lockErr } = await supabase.rpc('lock_withdrawal_funds', {
      p_user_id: user.id,
      p_amount: usdt_amount
    });
    if (lockErr) {
      return NextResponse.json({ error: 'তহবিল লক ব্যর্থ: ' + lockErr.message }, { status: 500 });
    }

    // Insert withdrawal
    const insertData: any = {
      user_id: user.id,
      withdrawal_method,
      usdt_amount,
      bdt_amount: bdtAmount,
      exchange_rate: rate,
      withdrawal_fee_usdt: totalFee,
      status: 'pending'
    };

    if (withdrawal_method === 'mfs') {
      insertData.mfs_provider = mfs_provider;
      insertData.recipient_number = recipient_number.replace(/^\+?88/, '');
      insertData.recipient_name = recipient_name || null;
    } else if (withdrawal_method === 'crypto') {
      insertData.crypto_network = crypto_network;
      insertData.wallet_address = wallet_address;
    } else if (withdrawal_method === 'bank') {
      insertData.bank_name = bank_name;
      insertData.account_number = account_number;
      insertData.account_holder_name = account_holder_name;
      insertData.branch_name = branch_name || null;
    }

    const { data: withdrawal, error: insertErr } = await supabase
      .from('withdrawal_requests')
      .insert(insertData)
      .select()
      .single();

    if (insertErr) {
      await supabase.rpc('unlock_withdrawal_funds', { p_user_id: user.id, p_amount: usdt_amount });
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      withdrawal,
      message: 'উইথড্রয়াল রিকোয়েস্ট জমা হয়েছে। ২৪ ঘণ্টার মধ্যে প্রসেস করা হবে।'
    });

  } catch (err: any) {
    console.error('Withdrawal error:', err);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
