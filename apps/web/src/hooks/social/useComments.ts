import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { socialService, type Comment } from '@/lib/social/service';

export function useComments(eventId: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchComments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await socialService.getComments(eventId);
            setComments(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch comments', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchComments();

        // Subscribe to realtime changes
        const channel = supabase
            .channel(`public:comments:event_id=eq.${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'comments',
                    filter: `event_id=eq.${eventId}`
                },
                async (payload: any) => {
                    console.log('Realtime comment payload:', payload);
                    // Instead of manually patching the local state which can be complex with nested replies,
                    // the safest way to ensure avatars/usernames are attached (which requires a join) 
                    // is to refetch the threaded comment list, or at least optimistically update the state.
                    // For now, simpler approach: trigger a debounced refetch or just refetch immediately.
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, fetchComments, supabase]);

    const addOptimisticComment = (newComment: Comment) => {
        setComments((prev) => {
            // If it's a top-level comment
            if (!newComment.parent_id) {
                return [newComment, ...prev];
            }
            // If it's a reply, we need to nest it
            return prev.map((comment) => {
                if (comment.id === newComment.parent_id) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), newComment]
                    };
                }
                return comment;
            });
        });
    };

    return {
        comments,
        loading,
        error,
        fetchComments,
        addOptimisticComment
    };
}
