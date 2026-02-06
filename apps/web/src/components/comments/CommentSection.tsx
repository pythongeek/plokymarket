'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CommentItem } from './CommentItem';
import { useStore } from '@/store/useStore';
import { toast } from '@/components/ui/use-toast';

interface CommentSectionProps {
    marketId: string;
    marketQuestion: string;
}

export function CommentSection({ marketId, marketQuestion }: CommentSectionProps) {
    const { isAuthenticated } = useStore();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments?marketId=${marketId}`);
            const data = await res.json();
            if (data.data) setComments(data.data);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [marketId]);

    const handlePostComment = async (parentId: string | null = null, content: string = newComment) => {
        if (!isAuthenticated) {
            toast({ title: "Please login to comment", variant: "destructive" });
            return;
        }

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                body: JSON.stringify({ marketId, content, parentId, marketQuestion }),
            });

            if (res.ok) {
                setNewComment('');
                fetchComments(); // Refresh to see new comment
                toast({ title: "Comment posted!" });
            }
        } catch (error) {
            toast({ title: "Failed to post comment", variant: "destructive" });
        }
    };

    return (
        <div className="mt-10 pt-10 border-t border-slate-800">
            <h3 className="text-xl font-bold mb-6">Discussion</h3>

            {/* New Comment Input */}
            <div className="mb-8">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isAuthenticated ? "What are your thoughts?" : "Login to join the discussion"}
                    disabled={!isAuthenticated}
                    className="mb-2"
                />
                <div className="flex justify-end">
                    <Button onClick={() => handlePostComment()} disabled={!isAuthenticated || !newComment.trim()}>
                        Post Comment
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading discussion...</div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                    No comments yet. Be the first to share your insight!
                </div>
            ) : (
                <div>
                    {comments.map((comment: any) => (
                        <CommentItem key={comment.id} comment={comment} onReply={async (pId, txt) => handlePostComment(pId, txt)} />
                    ))}
                </div>
            )}
        </div>
    );
}
