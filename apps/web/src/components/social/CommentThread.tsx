'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  Flag,
  Edit2,
  Trash2,
  Award,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { useStore } from '@/store/useStore';
import { Comment, VoteType, UserReputation, UserBadge } from '@/types/social';
import { commentsService } from '@/lib/social/comments-service';
import { FollowButton } from './FollowButton';
import { cn } from '@/lib/utils';

// ===================================
// REPUTATION BADGE COMPONENT
// ===================================

interface ReputationBadgeProps {
  reputation: UserReputation;
  size?: 'sm' | 'md' | 'lg';
}

function ReputationBadge({ reputation, size = 'sm' }: ReputationBadgeProps) {
  const tierColors = {
    novice: 'bg-slate-500',
    apprentice: 'bg-blue-500',
    analyst: 'bg-cyan-500',
    expert: 'bg-purple-500',
    master: 'bg-amber-500',
    oracle: 'bg-red-500'
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn(
              'rounded-full text-white font-medium uppercase tracking-wider',
              tierColors[reputation.accuracy_tier],
              sizeClasses[size]
            )}
          >
            {reputation.accuracy_tier}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{reputation.accuracy_tier.toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">
              Accuracy: {reputation.prediction_accuracy.toFixed(1)}%<br />
              Predictions: {reputation.total_predictions}<br />
              Streak: {reputation.current_streak} (Best: {reputation.best_streak})
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ===================================
// EXPERT BADGES DISPLAY
// ===================================

interface ExpertBadgesDisplayProps {
  badges: UserBadge[];
  maxDisplayed?: number;
}

function ExpertBadgesDisplay({ badges, maxDisplayed = 3 }: ExpertBadgesDisplayProps) {
  const displayedBadges = badges.slice(0, maxDisplayed);
  const remainingCount = badges.length - maxDisplayed;

  const rarityColors = {
    common: 'text-slate-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-amber-400'
  };

  return (
    <div className="flex items-center gap-1">
      {displayedBadges.map((userBadge) => (
        <TooltipProvider key={userBadge.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('text-xs', rarityColors[userBadge.badge?.rarity || 'common'])}>
                <Award className="w-4 h-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="space-y-1">
                <p className="font-semibold">{userBadge.badge?.name}</p>
                <p className="text-xs text-muted-foreground">{userBadge.badge?.description}</p>
                <Badge variant="outline" className="text-[10px]">
                  {userBadge.badge?.rarity}
                </Badge>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">+{remainingCount}</span>
      )}
    </div>
  );
}

// ===================================
// VOTE BUTTONS
// ===================================

interface VoteButtonsProps {
  commentId: string;
  upvotes: number;
  downvotes: number;
  userVote: VoteType;
  onVote: (voteType: VoteType) => Promise<void>;
  disabled?: boolean;
}

function VoteButtons({ 
  commentId, 
  upvotes, 
  downvotes, 
  userVote, 
  onVote,
  disabled 
}: VoteButtonsProps) {
  const [isVoting, setIsVoting] = useState(false);
  const score = upvotes - downvotes;

  const handleVote = async (voteType: VoteType) => {
    if (isVoting || disabled) return;
    setIsVoting(true);
    try {
      await onVote(voteType);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
      <button
        onClick={() => handleVote(userVote === 'upvote' ? 'none' : 'upvote')}
        disabled={isVoting}
        className={cn(
          'p-1 rounded transition-colors',
          userVote === 'upvote' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-green-500'
        )}
      >
        <TrendingUp className="w-3.5 h-3.5" />
      </button>
      <span className={cn(
        'text-xs font-bold min-w-[20px] text-center',
        score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-muted-foreground'
      )}>
        {score > 0 ? `+${score}` : score}
      </span>
      <button
        onClick={() => handleVote(userVote === 'downvote' ? 'none' : 'downvote')}
        disabled={isVoting}
        className={cn(
          'p-1 rounded transition-colors',
          userVote === 'downvote' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500'
        )}
      >
        <TrendingUp className="w-3.5 h-3.5 rotate-180" />
      </button>
    </div>
  );
}

// ===================================
// COMMENT COMPOSER
// ===================================

interface CommentComposerProps {
  marketId: string;
  parentId?: string;
  placeholder?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  isReply?: boolean;
  maxLength?: number;
}

function CommentComposer({
  marketId,
  parentId,
  placeholder = 'Share your thoughts...',
  onSubmit,
  onCancel,
  isReply = false,
  maxLength = 2000
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel on Escape
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selected + after + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <div className="space-y-3">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder + ' (Press Enter to post, Shift+Enter for new line)'}
        className="min-h-[100px] resize-none"
        disabled={isSubmitting}
      />
      
      {/* Markdown Toolbar */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('**', '**')}
          className="h-8 px-2 text-xs font-bold"
        >
          B
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('*', '*')}
          className="h-8 px-2 text-xs italic"
        >
          I
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('`', '`')}
          className="h-8 px-2 text-xs font-mono"
        >
          Code
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('> ')}
          className="h-8 px-2 text-xs"
        >
          Quote
        </Button>
        
        <div className="flex-1" />
        
        <span className={cn(
          'text-xs',
          content.length > maxLength * 0.9 ? 'text-amber-500' : 'text-muted-foreground'
        )}>
          {content.length}/{maxLength}
        </span>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || isSubmitting}
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          {isReply ? 'Reply' : 'Post Comment'}
        </Button>
      </div>
    </div>
  );
}

// ===================================
// SINGLE COMMENT ITEM
// ===================================

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  maxDepth?: number;
  defaultCollapsedDepth?: number;
  replyingToId: string | null;
  onReply: (parentId: string, content: string) => Promise<void>;
  onVote: (commentId: string, voteType: VoteType) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onFlag: (commentId: string, reason: string) => Promise<void>;
  onToggleReply: (commentId: string | null) => void;
  currentUserId?: string;
}

function CommentItem({
  comment,
  depth = 0,
  maxDepth = 10,
  defaultCollapsedDepth = 3,
  replyingToId,
  onReply,
  onVote,
  onEdit,
  onDelete,
  onFlag,
  onToggleReply,
  currentUserId
}: CommentItemProps) {
  const isReplying = replyingToId === comment.id;
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(depth < defaultCollapsedDepth);
  const [showReplies, setShowReplies] = useState(true);
  const isOwner = currentUserId === comment.user_id;
  const isDeleted = comment.is_deleted;

  const handleVote = async (voteType: VoteType) => {
    await onVote(comment.id, voteType);
  };

  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    onToggleReply(null);
  };

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await onDelete(comment.id);
    }
  };

  const handleFlag = async () => {
    const reason = prompt('Please select a reason:\n1. Spam\n2. Harassment\n3. Misinformation\n4. Off-topic');
    if (reason) {
      const reasons = ['spam', 'harassment', 'misinformation', 'off_topic'];
      await onFlag(comment.id, reasons[parseInt(reason) - 1] || 'other');
    }
  };

  // Collapsed view for deep threads
  if (!isExpanded && depth >= defaultCollapsedDepth && !isDeleted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="ml-12 pl-4 border-l-2 border-border"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
          <span>Continue thread ({1 + (comment.replies?.length || 0)} replies)</span>
        </button>
      </motion.div>
    );
  }

  return (
    <div className={cn(
      'relative',
      depth > 0 && 'ml-12 pl-4 border-l-2 border-border'
    )}>
      {/* Main Comment */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'group p-4 rounded-lg transition-colors',
          comment.is_new && 'bg-primary/5',
          !comment.is_new && 'hover:bg-muted/50'
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.user?.avatar_url} />
            <AvatarFallback>{comment.user?.full_name?.[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{comment.user?.full_name}</span>
              
              {/* Follow Button */}
              {comment.user_id !== currentUserId && comment.user?.id && (
                <FollowButton
                  targetUserId={comment.user_id}
                  targetUserName={comment.user?.full_name}
                  size="sm"
                  variant="ghost"
                />
              )}
              
              {comment.user?.is_expert && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Shield className="w-4 h-4 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>Verified Expert</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {comment.user?.reputation && (
                <ReputationBadge reputation={comment.user.reputation} size="sm" />
              )}

              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(comment.created_at).toLocaleDateString()}
                {comment.edited_at && ' (edited)'}
              </span>

              {comment.is_flagged && (
                <Badge variant="destructive" className="text-[10px]">
                  Flagged
                </Badge>
              )}
            </div>

            {/* Expert Badges */}
            {comment.user?.badges && comment.user.badges.length > 0 && (
              <ExpertBadgesDisplay badges={comment.user.badges} maxDisplayed={2} />
            )}

            {/* Content */}
            {isEditing ? (
              <div className="mt-2">
                <CommentComposer
                  marketId={comment.market_id}
                  placeholder="Edit your comment..."
                  onSubmit={handleEdit}
                  onCancel={() => setIsEditing(false)}
                  maxLength={2000}
                />
              </div>
            ) : (
              <div 
                className="mt-2 text-sm prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: comment.content_html || comment.content 
                }}
              />
            )}

            {/* Attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {comment.attachments.map((att) => (
                  att.type === 'image' ? (
                    <a 
                      key={att.id} 
                      href={att.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    >
                      <img 
                        src={att.thumbnail_url || att.url} 
                        alt="Attachment" 
                        className="max-h-32 w-auto object-cover"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm hover:bg-muted/80 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {att.title || 'Link'}
                    </a>
                  )
                ))}
              </div>
            )}

            {/* Actions */}
            {!isEditing && !isDeleted && (
              <div className="mt-3 flex items-center gap-4">
                <VoteButtons
                  commentId={comment.id}
                  upvotes={comment.upvotes}
                  downvotes={comment.downvotes}
                  userVote={comment.user_vote || 'none'}
                  onVote={handleVote}
                  disabled={!currentUserId}
                />

                <button
                  onClick={() => onToggleReply(isReplying ? null : comment.id)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors",
                    isReplying 
                      ? "text-primary font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isReplying ? 'Cancel' : 'Reply'}
                </button>

                {/* More Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isOwner && (
                      <DropdownMenuItem onClick={handleFlag}>
                        <Flag className="w-4 h-4 mr-2" />
                        Flag
                      </DropdownMenuItem>
                    )}
                    {isOwner && (
                      <>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Collapse/Expand for deep threads */}
                {depth >= defaultCollapsedDepth && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Collapse
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Reply Composer */}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-12 pl-4 border-l-2 border-border mt-2"
          >
            <CommentComposer
              marketId={comment.market_id}
              parentId={comment.id}
              placeholder="Write a reply..."
              onSubmit={handleReply}
              onCancel={() => onToggleReply(null)}
              isReply
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {depth >= maxDepth ? (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="ml-12 pl-4 text-sm text-primary hover:underline flex items-center gap-1"
            >
              {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} replies
            </button>
          ) : null}

          <AnimatePresence>
            {(depth < maxDepth || showReplies) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    defaultCollapsedDepth={defaultCollapsedDepth}
                    replyingToId={replyingToId}
                    onReply={onReply}
                    onVote={onVote}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onFlag={onFlag}
                    onToggleReply={onToggleReply}
                    currentUserId={currentUserId}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ===================================
// MAIN COMMENT THREAD COMPONENT
// ===================================

interface CommentThreadProps {
  marketId: string;
  marketQuestion: string;
  initialComments?: Comment[];
  maxDepth?: number;
  defaultCollapsedDepth?: number;
  enableRealtime?: boolean;
  className?: string;
}

export function CommentThread({
  marketId,
  marketQuestion,
  initialComments = [],
  maxDepth = 10,
  defaultCollapsedDepth = 3,
  enableRealtime = true,
  className
}: CommentThreadProps) {
  const { currentUser, isAuthenticated } = useStore();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(!initialComments.length);
  const [sortBy, setSortBy] = useState<'newest' | 'top' | 'controversial'>('newest');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  
  // Prevent polling from interrupting reply
  const isReplyingRef = useRef(false);
  useEffect(() => {
    isReplyingRef.current = replyingToId !== null;
  }, [replyingToId]);

  // Load comments
  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/comments?marketId=${marketId}&sortBy=${sortBy}`
      );
      const data = await response.json();
      if (data.data) {
        setComments(data.data.comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [marketId, sortBy]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    // Subscribe to real-time updates
    const setupSubscription = async () => {
      const res = await fetch('/api/comments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId })
      });
      
      // Poll for updates every 10 seconds as fallback, but skip if user is replying
      const interval = setInterval(() => {
        if (!isReplyingRef.current) {
          loadComments();
        }
      }, 10000);
      return () => clearInterval(interval);
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then(fn => fn());
    };
  }, [marketId, enableRealtime, loadComments]);

  // Handle new comment
  const handlePostComment = async (content: string, parentId?: string) => {
    if (!isAuthenticated) {
      toast({ title: 'Please login to comment', variant: 'destructive' });
      return;
    }

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId, content, parentId, marketQuestion })
    });

    if (res.ok) {
      setReplyingToId(null); // Clear reply state
      await loadComments();
      toast({ title: parentId ? 'Reply posted!' : 'Comment posted!' });
    } else {
      const error = await res.json();
      toast({ 
        title: 'Error', 
        description: error.error || 'Failed to post comment',
        variant: 'destructive' 
      });
    }
  };

  // Handle vote
  const handleVote = async (commentId: string, voteType: VoteType) => {
    if (!isAuthenticated) {
      toast({ title: 'Please login to vote', variant: 'destructive' });
      return;
    }

    const res = await fetch('/api/comments/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, voteType })
    });

    if (res.ok) {
      await loadComments();
    }
  };

  // Handle edit
  const handleEdit = async (commentId: string, content: string) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (res.ok) {
      await loadComments();
      toast({ title: 'Comment updated' });
    }
  };

  // Handle delete
  const handleDelete = async (commentId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      await loadComments();
      toast({ title: 'Comment deleted' });
    }
  };

  // Handle flag
  const handleFlag = async (commentId: string, reason: string) => {
    const res = await fetch('/api/comments/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, reason })
    });

    if (res.ok) {
      toast({ title: 'Comment flagged for review' });
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Discussion
          <span className="text-sm font-normal text-muted-foreground">
            ({comments.length} comments)
          </span>
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm bg-muted rounded px-2 py-1 border-0"
          >
            <option value="newest">Newest</option>
            <option value="top">Top</option>
            <option value="controversial">Controversial</option>
          </select>
        </div>
      </div>

      {/* New Comment */}
      {isAuthenticated && (
        <CommentComposer
          marketId={marketId}
          onSubmit={(content) => handlePostComment(content)}
          placeholder="What are your thoughts?"
        />
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading discussion...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No comments yet.</p>
          <p className="text-sm text-muted-foreground/70">
            Be the first to share your insight!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              maxDepth={maxDepth}
              defaultCollapsedDepth={defaultCollapsedDepth}
              replyingToId={replyingToId}
              onReply={(parentId, content) => handlePostComment(content, parentId)}
              onVote={handleVote}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onFlag={handleFlag}
              onToggleReply={setReplyingToId}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
