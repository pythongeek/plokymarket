import { NextRequest, NextResponse } from 'next/server';
import { CommentsService } from '@/lib/comments/service';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const marketId = searchParams.get('marketId');

    if (!marketId) return NextResponse.json({ error: 'Missing marketId' }, { status: 400 });

    const service = new CommentsService();
    try {
        const comments = await service.getMarketComments(marketId);
        return NextResponse.json({ data: comments });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { marketId, content, parentId, marketQuestion } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new CommentsService();
    try {
        const comment = await service.postComment(marketId, user.id, content, parentId, marketQuestion);
        return NextResponse.json({ data: comment });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
