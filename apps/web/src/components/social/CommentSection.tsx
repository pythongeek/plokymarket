'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, MoreVertical, Reply, Trash2, Edit2, CornerDownRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { socialService, type Comment } from '@/lib/social/service';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useComments } from '@/hooks/social/useComments';

interface CommentSectionProps {
    eventId: string;
}

export function CommentSection({ eventId }: CommentSectionProps) {
    const { comments, loading, fetchComments, addOptimisticComment } = useComments(eventId);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }: any) => setUser(data.user));
    }, [supabase.auth]);

    const handlePost = async (parentId: string | null = null) => {
        const content = parentId ? editContent : newComment;
        if (!content.trim() || content.length < 10) {
            toast({ title: 'ত্রুটি', description: 'কমেন্ট অন্তত ১০ অক্ষরের হতে হবে।', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            // Optimistic addition before the server roundtrip
            const optimisticTempId = `temp-${Date.now()}`;
            const optimisticComment: Comment = {
                id: optimisticTempId,
                event_id: eventId,
                user_id: user?.id || '',
                content,
                parent_id: parentId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false,
                user: {
                    full_name: user?.user_metadata?.full_name || user?.email || 'You',
                    avatar_url: user?.user_metadata?.avatar_url
                },
                replies: []
            };

            addOptimisticComment(optimisticComment);
            setNewComment('');
            setReplyTo(null);
            setEditContent('');

            // Send to DB
            await socialService.postComment(eventId, content, parentId);
            toast({ title: 'সাফল্য', description: 'আপনার কমেন্ট যোগ করা হয়েছে।' });

            // Channel handles the refetch normally, but just to be safe
            fetchComments();
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editContent.trim()) return;
        try {
            await socialService.updateComment(id, editContent);
            setEditingId(null);
            fetchComments();
            toast({ title: 'আপডেট হয়েছে', description: 'আপনার কমেন্ট আপডেট করা হয়েছে।' });
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await socialService.deleteComment(id);
            fetchComments();
            toast({ title: 'মুছে ফেলা হয়েছে', description: 'কমেন্টটি সফলভাবে মুছে ফেলা হয়েছে।' });
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        }
    };

    const formatTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
        if (diff < 1) return 'এখনই';
        if (diff < 60) return `${diff} মিনিট আগে`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `${hours} ঘণ্টা আগে`;
        return d.toLocaleDateString('bn-BD');
    };

    const CommentItem = ({ comment, isReply = false, level = 0 }: { comment: Comment; isReply?: boolean; level?: number }) => {
        const isOwner = user?.id === comment.user_id;
        const canEdit = isOwner && (new Date().getTime() - new Date(comment.created_at).getTime() < 5 * 60 * 1000);

        return (
            <div className={cn("group flex gap-3", isReply ? "ml-10 mt-3" : "mt-6")}>
                <Avatar className="h-8 w-8 border border-slate-700 bg-slate-800">
                    <AvatarImage src={comment.user?.avatar_url} />
                    <AvatarFallback className="bg-slate-800 text-slate-400 text-xs">
                        {comment.user?.full_name?.slice(0, 2) || 'U'}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white capitalize">
                                {comment.user?.full_name || 'Anonymous User'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                                {formatTime(comment.created_at)}
                            </span>
                        </div>

                        {isOwner && !comment.is_deleted && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-white">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-300">
                                    {canEdit && (
                                        <DropdownMenuItem onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} className="hover:bg-slate-800 focus:bg-slate-800">
                                            <Edit2 className="mr-2 h-4 w-4" /> এডিট করুন
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleDelete(comment.id)} className="text-red-400 hover:bg-slate-800 focus:bg-slate-800">
                                        <Trash2 className="mr-2 h-4 w-4" /> ডিলিট করুন
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <div className="relative">
                        {editingId === comment.id ? (
                            <div className="space-y-2">
                                <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-slate-950 border-slate-700 text-white text-sm"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleUpdate(comment.id)}>আপডেট</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>বাতিল</Button>
                                </div>
                            </div>
                        ) : (
                            <p className={cn(
                                "text-sm leading-relaxed",
                                comment.is_deleted ? "text-slate-600 italic" : "text-slate-300"
                            )}>
                                {comment.is_deleted ? 'এই কমেন্টটি মুছে ফেলা হয়েছে।' : comment.content}
                            </p>
                        )}
                    </div>

                    {!comment.is_deleted && level < 2 && (
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={() => { setReplyTo(comment.id); setEditContent(''); }}
                                className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                            >
                                <Reply className="h-3 w-3" /> রিপ্লাই
                            </button>
                        </div>
                    )}

                    {replyTo === comment.id && (
                        <div className="mt-3 space-y-2">
                            <Textarea
                                placeholder="আপনার রিপ্লাই লিখুন..."
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handlePost(comment.id)} disabled={submitting}>
                                    {submitting ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>বাতিল</Button>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 space-y-3">
                            {comment.replies.map(reply => (
                                <CommentItem key={reply.id} comment={reply} isReply level={level + 1} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 mt-12 pt-8 border-t border-slate-800">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    সামাজিক আলোচনা (Social Comments)
                    <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full ml-2">
                        {comments.length}
                    </span>
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> SECURE COMMUNITY
                </div>
            </div>

            {/* Post Box */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
                <Textarea
                    placeholder="আপনার মতামত আমাদের জানান... (ন্যূনতম ১০ অক্ষর)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white min-h-[100px] rounded-xl focus:border-blue-500/50 transition-all resize-none"
                />
                <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-600">
                        ৫ মিনিট এডিট উইন্ডো • ১ কমেন্ট/মিনিট
                    </div>
                    <Button
                        onClick={() => handlePost()}
                        disabled={submitting || newComment.length < 10}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 h-9 px-6"
                    >
                        {submitting ? 'পাঠানো হচ্ছে...' : <><Send className="w-3.5 h-3.5 mr-2" /> কমেন্ট করুন</>}
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="py-12 flex justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                </div>
            ) : comments.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                    <div className="p-4 rounded-full bg-slate-800/50 w-fit mx-auto">
                        <MessageSquare className="w-10 h-10 text-slate-700" />
                    </div>
                    <p className="text-slate-500">এখনো কোনো আলোচনা শুরু হয়নি। প্রথম কমেন্টটি আপনিই করুন!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            )}
        </div>
    );
}
