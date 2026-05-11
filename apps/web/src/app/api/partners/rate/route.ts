import { NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/partners/rate
 * পার্টনার রিভিউ সাবমিট করুন
 * Body: { partner_id: string, is_positive: boolean }
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'থাবে লগইন করুন' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { partner_id, is_positive } = body;

        if (!partner_id) {
            return NextResponse.json(
                { success: false, error: 'পার্টনার ID প্রদান করুন' },
                { status: 400 }
            );
        }

        const partners = await query(
            `SELECT id, positive_reviews, negative_reviews, total_trades FROM partner_exchangers WHERE id = $1`,
            [partner_id]
        );

        if (partners.length === 0) {
            return NextResponse.json(
                { success: false, error: 'পার্টনার পাওয়া যায়নি' },
                { status: 404 }
            );
        }

        const partner = partners[0];
        const newPositive = partner.positive_reviews + (is_positive ? 1 : 0);
        const newNegative = partner.negative_reviews + (is_positive ? 0 : 1);
        const newTotal = partner.total_trades + 1;
        const newTrustScore = Math.min(100, Math.max(0,
            50 + (newPositive * 2) - (newNegative * 5) + Math.min(newTotal, 20)
        ));

        await query(
            `UPDATE partner_exchangers SET positive_reviews = $1, negative_reviews = $2, total_trades = $3, trust_score = $4, updated_at = NOW() WHERE id = $5`,
            [newPositive, newNegative, newTotal, newTrustScore, partner_id]
        );

        return NextResponse.json({
            success: true,
            message: is_positive
                ? 'ধন্যবাদ! রিভিউ জমা হয়েছে'
                : 'রিভিউ জমা হয়েছে। আমরা এটি পরিরিক্ষা করব'
        });

    } catch (err: any) {
        console.error('Partner rate error:', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
