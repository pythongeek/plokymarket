import { createClient } from '@/lib/supabase/client';

export interface Comment {
    id: string;
    event_id: string;
    user_id: string;
    content: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    user?: {
        full_name: string;
        avatar_url: string;
    };
    replies?: Comment[];
}

class SocialService {
    private supabase = createClient();

    async getComments(eventId: string): Promise<Comment[]> {
        const { data, error } = await this.supabase
            .from('comments')
            .select(`
        *,
        user:user_profiles (
          full_name,
          avatar_url
        )
      `)
            .eq('event_id', eventId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Organize into threads (2-level)
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        data?.forEach((c: any) => {
            commentMap.set(c.id, { ...c, replies: [] });
        });
        commentMap.forEach((c: Comment) => {
            if (c.parent_id && commentMap.has(c.parent_id)) {
                commentMap.get(c.parent_id)!.replies!.push(c);
            } else {
                rootComments.push(c);
            }
        });

        return rootComments;
    }

    async postComment(eventId: string, content: string, parentId: string | null = null): Promise<Comment> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('Authentication required');

        const { data, error } = await this.supabase
            .from('comments')
            .insert({
                event_id: eventId,
                user_id: user.id,
                content,
                parent_id: parentId
            })
            .select(`
        *,
        user:user_profiles (
          full_name,
          avatar_url
        )
      `)
            .single();

        if (error) {
            if (error.message.includes('Rate limit')) {
                throw new Error('এক মিনিটে একাধিক কমেন্ট করা অসম্ভব। দয়া করে অপেক্ষা করুন। (Rate limit exceeded)');
            }
            throw error;
        }

        return data;
    }

    async updateComment(commentId: string, content: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('comments')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', commentId);

        if (error) {
            if (error.message.includes('Edit window')) {
                throw new Error('৫ মিনিটের এডিট উইন্ডো শেষ হয়ে গেছে। (Edit window expired)');
            }
            throw error;
        }

        return true;
    }

    async deleteComment(commentId: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('comments')
            .update({ is_deleted: true })
            .eq('id', commentId);

        if (error) throw error;
        return true;
    }
}

export const socialService = new SocialService();
