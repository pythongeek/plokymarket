import { createClient } from '@/lib/supabase/server';
import { ActivityService } from '@/lib/activity/service';

export interface Comment {
    id: string;
    market_id: string;
    user_id: string;
    parent_id?: string;
    content: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    upvotes: number;
    likes_count: number;
    created_at: string;
    users?: {
        full_name: string;
        username: string;
        avatar_url: string;
    };
    replies?: Comment[];
}

export class CommentsService {

    async postComment(marketId: string, userId: string, content: string, parentId?: string, marketQuestion?: string) {
        const supabase = await createClient();

        // 1. Insert Comment
        const { data, error } = await supabase
            .from('market_comments')
            .insert({
                market_id: marketId,
                user_id: userId,
                content,
                parent_id: parentId,
                sentiment: this.analyzeSentiment(content)
            })
            .select('*, users(full_name, username, avatar_url)')
            .single();

        if (error) throw error;

        // 2. Log to Activity Feed (Fire and forget)
        // Only log top-level comments to avoid spamming feed
        if (!parentId) {
            const activityService = new ActivityService();
            await activityService.logActivity(userId, 'COMMENT', {
                marketId,
                marketQuestion: marketQuestion || 'a market',
                commentId: data.id
            });
        }

        return data;
    }

    private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
        const positiveWords = ['yes', 'agree', 'bullish', 'win', 'good', 'great', 'buy'];
        const negativeWords = ['no', 'disagree', 'bearish', 'lose', 'bad', 'sell', 'scam'];

        const lower = content.toLowerCase();
        let score = 0;
        positiveWords.forEach(w => { if (lower.includes(w)) score++; });
        negativeWords.forEach(w => { if (lower.includes(w)) score--; });

        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    async getMarketComments(marketId: string): Promise<Comment[]> {
        const supabase = await createClient();

        const { data: rawComments, error } = await supabase
            .from('market_comments')
            .select(`
        *,
        users (
          full_name,
          username,
          avatar_url
        )
      `)
            .eq('market_id', marketId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true }); // Oldest first for discussion flow

        if (error) throw error;

        // Build Thread Tree
        const commentMap = new Map<string, Comment>();
        const roots: Comment[] = [];

        // First pass: Create objects
        rawComments.forEach((c: any) => {
            c.replies = [];
            commentMap.set(c.id, c);
        });

        // Second pass: Link parents
        rawComments.forEach((c: any) => {
            if (c.parent_id && commentMap.has(c.parent_id)) {
                commentMap.get(c.parent_id)?.replies?.push(c);
            } else {
                roots.push(c);
            }
        });

        return roots;
    }
}
