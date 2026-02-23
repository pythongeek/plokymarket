import { createClient } from '@/lib/supabase/server';

/**
 * @class FeedService
 * Handles social interactions with optimized Supabase queries.
 */
export class FeedService {
    // ১. ফলো স্ট্যাটাস চেক (Optimization: Only selecting ID)
    async getFollowStatus(followerId: string, followingId: string): Promise<boolean> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .maybeSingle(); // Use maybeSingle to avoid 406 errors on empty results

        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    }

    // ২. ফলোয়ার লিস্ট রিটার্ন করা
    async getFollowers(userId: string): Promise<string[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('user_follows')
            .select('follower_id')
            .eq('following_id', userId);

        if (error) throw new Error(`Failed to fetch followers: ${error.message}`);
        return data?.map(f => f.follower_id) || [];
    }

    // ৩. ফলোয়িং লিস্ট রিটার্ন করা
    async getFollowing(userId: string): Promise<string[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', userId);

        if (error) throw new Error(`Failed to fetch following: ${error.message}`);
        return data?.map(f => f.following_id) || [];
    }

    // ৪. ফলো অপারেশন (Atomic Insert)
    async followUser(followerId: string, followingId: string): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('user_follows')
            .insert({ follower_id: followerId, following_id: followingId });

        if (error) {
            if (error.code === '23505') return; // Ignore if already following (Unique constraint)
            throw new Error(`Follow failed: ${error.message}`);
        }
    }

    // ৫. আনফলো অপারেশন (Targeted Delete)
    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);

        if (error) throw new Error(`Unfollow failed: ${error.message}`);
    }
}

export const feedService = new FeedService();
