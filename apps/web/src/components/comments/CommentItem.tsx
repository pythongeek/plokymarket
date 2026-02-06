'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, ThumbsUp, ThumbsDown, Smile, Frown, Meh } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface CommentItemProps {
    comment: any;
    onReply: (parentId: string, content: string) => Promise<void>;
    depth?: number;
}

export function CommentItem({ comment, onReply, depth = 0 }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [upvotes, setUpvotes] = useState(comment.upvotes || 0);

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return <Smile className="w-3 h-3 text-green-500" />;
            case 'negative': return <Frown className="w-3 h-3 text-red-500" />;
            default: return null;
        }
    };

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;
        await onReply(comment.id, replyText);
        setIsReplying(false);
        setReplyText('');
    };

    return (
        <div className={`flex gap-3 mb-6 ${depth > 0 ? 'ml-12 border-l-2 pl-4 border-slate-700' : ''}`}>
            <Avatar className="w-8 h-8">
                <AvatarImage src={comment.users?.avatar_url} />
                <AvatarFallback>{comment.users?.username?.[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.users?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                    {getSentimentIcon(comment.sentiment)}
                </div>

                <p className="text-sm text-slate-200 mb-2">{comment.content}</p>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-0.5 rounded-full">
                        <button
                            onClick={() => setUpvotes((v: number) => v + 1)}
                            className="text-muted-foreground hover:text-green-500 transition-colors"
                            title="Upvote"
                        >
                            <ThumbsUp className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] font-bold min-w-[12px] text-center">{upvotes}</span>
                        <button
                            onClick={() => setUpvotes((v: number) => v - 1)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                            title="Downvote"
                        >
                            <ThumbsDown className="w-3 h-3" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                        <MessageSquare className="w-3 h-3" /> Reply
                    </button>
                </div>

                {isReplying && (
                    <div className="mt-3 space-y-2">
                        <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="min-h-[60px]"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleSubmitReply}>Post Reply</Button>
                        </div>
                    </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4">
                        {comment.replies.map((reply: any) => (
                            <CommentItem key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
