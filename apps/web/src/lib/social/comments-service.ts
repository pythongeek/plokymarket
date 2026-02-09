import { createClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Comment, 
  CommentVote, 
  CommentFlag, 
  PostCommentRequest, 
  VoteCommentRequest,
  FlagCommentRequest,
  GetCommentsResponse,
  SentimentType,
  VoteType,
  UserReputation,
  CommentAttachment
} from '@/types/social';
import { ActivityService } from '@/lib/activity/service';

// ===================================
// AI TOXICITY DETECTION (Simulated)
// ===================================

interface ToxicityResult {
  toxicity_score: number;
  spam_score: number;
  flagged_categories: string[];
  sentiment: SentimentType;
  sentiment_score: number;
}

class ContentModerationService {
  private readonly TOXICITY_THRESHOLD = 0.7;
  private readonly SPAM_THRESHOLD = 0.8;

  async analyzeContent(content: string): Promise<ToxicityResult> {
    // In production, this would call an AI service (Perspective API, Azure Content Safety, etc.)
    // For now, we'll simulate with keyword-based detection
    
    const toxicityKeywords = ['hate', 'kill', 'die', 'stupid idiot', 'scam fraud'];
    const spamKeywords = ['buy now', 'click here', 'free money', 'crypto giveaway', 'telegram dm'];
    const positiveWords = ['agree', 'bullish', 'win', 'good', 'great', 'buy', 'yes', 'correct'];
    const negativeWords = ['disagree', 'bearish', 'lose', 'bad', 'sell', 'no', 'wrong', 'scam'];

    const lowerContent = content.toLowerCase();
    
    // Calculate toxicity
    let toxicityHits = 0;
    toxicityKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) toxicityHits++;
    });
    const toxicityScore = Math.min(toxicityHits / 3, 1);

    // Calculate spam
    let spamHits = 0;
    spamKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) spamHits++;
    });
    const spamScore = Math.min(spamHits / 2, 1);

    // Determine sentiment
    let sentimentScore = 0;
    positiveWords.forEach(w => { if (lowerContent.includes(w)) sentimentScore += 0.2; });
    negativeWords.forEach(w => { if (lowerContent.includes(w)) sentimentScore -= 0.2; });
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

    let sentiment: SentimentType = 'neutral';
    if (sentimentScore > 0.3) sentiment = 'positive';
    else if (sentimentScore < -0.3) sentiment = 'negative';

    const flaggedCategories: string[] = [];
    if (toxicityScore > 0.5) flaggedCategories.push('toxicity');
    if (spamScore > 0.5) flaggedCategories.push('spam');

    return {
      toxicity_score: toxicityScore,
      spam_score: spamScore,
      flagged_categories: flaggedCategories,
      sentiment,
      sentiment_score: sentimentScore
    };
  }

  shouldAutoFlag(result: ToxicityResult): boolean {
    return result.toxicity_score > this.TOXICITY_THRESHOLD || 
           result.spam_score > this.SPAM_THRESHOLD;
  }
}

// ===================================
// MARKDOWN & LINK PROCESSING
// ===================================

class ContentProcessor {
  private readonly URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  private readonly IMAGE_REGEX = /(https?:\/\/[^\s<]+\.(?:jpg|jpeg|png|gif|webp))(?![^<]*<\/a>)/gi;
  private readonly MENTION_REGEX = /@(\w+)/g;

  processContent(content: string): { html: string; attachments: Partial<CommentAttachment>[]; mentions: string[] } {
    let html = this.escapeHtml(content);
    const attachments: Partial<CommentAttachment>[] = [];
    const mentions: string[] = [];

    // Process mentions
    html = html.replace(this.MENTION_REGEX, (match, username) => {
      mentions.push(username);
      return `<span class="mention" data-username="${username}">@${username}</span>`;
    });

    // Process images
    html = html.replace(this.IMAGE_REGEX, (match, url) => {
      attachments.push({
        type: 'image',
        url: url,
        metadata: { mime_type: this.getMimeType(url) }
      });
      return `<div class="image-attachment"><img src="${url}" loading="lazy" alt="Image" /></div>`;
    });

    // Process links (that aren't already processed)
    html = html.replace(this.URL_REGEX, (match, url) => {
      // Skip if already processed as image
      if (attachments.some(a => a.url === url)) return match;
      
      attachments.push({
        type: 'link',
        url: url
      });
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="link-preview">${this.truncateUrl(url)}</a>`;
    });

    // Process markdown
    html = this.processMarkdown(html);

    return { html, attachments, mentions };
  }

  private escapeHtml(text: string): string {
    // Server-side escape
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private processMarkdown(html: string): string {
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // Line breaks
    html = html.replace(/\n/g, '<br />');
    
    return html;
  }

  private truncateUrl(url: string, maxLength: number = 50): string {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  }

  private getMimeType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }
}

// ===================================
// RATE LIMITING
// ===================================

class RateLimiter {
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_POSTS_PER_WINDOW = 10;
  private posts: Map<string, number[]> = new Map();

  isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userPosts = this.posts.get(userId) || [];
    
    // Clean old posts
    const recentPosts = userPosts.filter(time => now - time < this.RATE_LIMIT_WINDOW);
    this.posts.set(userId, recentPosts);
    
    return recentPosts.length >= this.MAX_POSTS_PER_WINDOW;
  }

  recordPost(userId: string): void {
    const userPosts = this.posts.get(userId) || [];
    userPosts.push(Date.now());
    this.posts.set(userId, userPosts);
  }

  getRemainingTime(userId: string): number {
    const userPosts = this.posts.get(userId) || [];
    if (userPosts.length === 0) return 0;
    
    const oldestPost = Math.min(...userPosts);
    const remaining = this.RATE_LIMIT_WINDOW - (Date.now() - oldestPost);
    return Math.max(0, Math.ceil(remaining / 1000));
  }
}

// ===================================
// MAIN COMMENTS SERVICE
// ===================================

export class CommentsService {
  private moderationService: ContentModerationService;
  private contentProcessor: ContentProcessor;
  private rateLimiter: RateLimiter;
  private activityService: ActivityService;

  constructor() {
    this.moderationService = new ContentModerationService();
    this.contentProcessor = new ContentProcessor();
    this.rateLimiter = new RateLimiter();
    this.activityService = new ActivityService();
  }

  // ===================================
  // COMMENT OPERATIONS
  // ===================================

  async postComment(
    marketId: string, 
    userId: string, 
    content: string, 
    parentId?: string,
    marketQuestion?: string
  ): Promise<Comment> {
    const supabase = await createClient();

    // Rate limiting check
    if (this.rateLimiter.isRateLimited(userId)) {
      const waitTime = this.rateLimiter.getRemainingTime(userId);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
    }

    // Get user reputation for quality scoring
    const { data: reputation } = await supabase
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check if user is comment banned
    const { data: modStatus } = await supabase
      .from('user_moderation_status')
      .select('is_comment_banned, comment_ban_until')
      .eq('user_id', userId)
      .single();

    if (modStatus?.is_comment_banned) {
      const banUntil = modStatus.comment_ban_until ? new Date(modStatus.comment_ban_until) : null;
      if (!banUntil || banUntil > new Date()) {
        throw new Error('Your commenting privileges are temporarily suspended.');
      }
    }

    // Content moderation
    const moderationResult = await this.moderationService.analyzeContent(content);
    
    // Process content (markdown, links, mentions)
    const { html, attachments, mentions } = this.contentProcessor.processContent(content);

    // Calculate depth level
    let depthLevel = 0;
    if (parentId) {
      const { data: parent } = await supabase
        .from('market_comments')
        .select('depth_level')
        .eq('id', parentId)
        .single();
      if (parent) {
        depthLevel = parent.depth_level + 1;
      }
    }

    // Auto-collapse if depth > 3
    const isCollapsed = depthLevel >= 3;

    // Insert comment
    const { data: comment, error } = await supabase
      .from('market_comments')
      .insert({
        market_id: marketId,
        user_id: userId,
        parent_id: parentId,
        content,
        content_html: html,
        depth_level: depthLevel,
        is_collapsed: isCollapsed,
        sentiment: moderationResult.sentiment,
        sentiment_score: moderationResult.sentiment_score,
        is_flagged: this.moderationService.shouldAutoFlag(moderationResult),
        score: this.calculateInitialScore(reputation)
      })
      .select('*, users(full_name)')
      .single();

    if (error) throw error;

    // Insert attachments
    if (attachments.length > 0) {
      await supabase
        .from('comment_attachments')
        .insert(
          attachments.map(att => ({
            comment_id: comment.id,
            ...att
          }))
        );
    }

    // Add to moderation queue if flagged
    if (comment.is_flagged) {
      await supabase
        .from('comment_moderation_queue')
        .insert({
          comment_id: comment.id,
          user_id: userId,
          toxicity_score: moderationResult.toxicity_score,
          spam_score: moderationResult.spam_score,
          flagged_categories: moderationResult.flagged_categories,
          ai_confidence: 0.85
        });
    }

    // Record rate limit
    this.rateLimiter.recordPost(userId);

    // Log activity (only for top-level comments)
    if (!parentId) {
      await this.activityService.logActivity(userId, 'COMMENT', {
        marketId,
        marketQuestion: marketQuestion || 'a market',
        commentId: comment.id,
        hasAttachments: attachments.length > 0
      });
    }

    // Notify mentioned users
    if (mentions.length > 0) {
      await this.notifyMentions(mentions, comment.id, marketId, userId);
    }

    return comment as Comment;
  }

  async getMarketComments(
    marketId: string, 
    currentUserId?: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: 'newest' | 'top' | 'controversial';
      includeDeleted?: boolean;
    } = {}
  ): Promise<GetCommentsResponse> {
    const supabase = await createClient();
    const { limit = 50, offset = 0, sortBy = 'newest', includeDeleted = false } = options;

    // Build query
    let query = supabase
      .from('market_comments')
      .select(`
        *,
        users (
          id,
          full_name
        ),
        comment_attachments (*)
      `)
      .eq('market_id', marketId);

    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }

    // Apply sorting
    switch (sortBy) {
      case 'top':
        query = query.order('score', { ascending: false });
        break;
      case 'controversial':
        // Comments with high vote activity but balanced upvotes/downvotes
        query = query.order('flag_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: true });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: rawComments, error, count } = await query;
    if (error) throw error;

    // Get user votes if logged in
    let userVotes: Map<string, VoteType> = new Map();
    if (currentUserId && rawComments?.length) {
      const { data: votes } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .eq('user_id', currentUserId)
        .in('comment_id', rawComments.map(c => c.id));
      
      votes?.forEach(v => userVotes.set(v.comment_id, v.vote_type));
    }

    // Get user reputations for comment authors
    const userIds = [...new Set(rawComments?.map(c => c.user_id) || [])];
    const { data: reputations } = await supabase
      .from('user_reputation')
      .select('*')
      .in('user_id', userIds);

    const reputationMap = new Map(reputations?.map(r => [r.user_id, r]) || []);

    // Get user badges for expert indicators
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('*, badge:expert_badges(*)')
      .in('user_id', userIds)
      .eq('is_displayed', true);

    const badgesMap = new Map<string, typeof userBadges>();
    userBadges?.forEach(ub => {
      if (!badgesMap.has(ub.user_id)) badgesMap.set(ub.user_id, []);
      badgesMap.get(ub.user_id)!.push(ub);
    });

    // Build thread tree
    const comments = this.buildThreadTree(rawComments || [], userVotes, reputationMap, badgesMap);

    // Get current user's reputation
    let userReputation: UserReputation | undefined;
    if (currentUserId) {
      const { data: userRep } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', currentUserId)
        .single();
      userReputation = userRep as UserReputation;
    }

    return {
      comments,
      total_count: count || rawComments?.length || 0,
      has_more: (count || 0) > offset + limit,
      user_reputation: userReputation
    };
  }

  private buildThreadTree(
    rawComments: any[], 
    userVotes: Map<string, VoteType>,
    reputationMap: Map<string, UserReputation>,
    badgesMap: Map<string, any[]>
  ): Comment[] {
    const commentMap = new Map<string, Comment>();
    const roots: Comment[] = [];

    // First pass: Create comment objects
    rawComments.forEach((c: any) => {
      const comment: Comment = {
        ...c,
        user_vote: userVotes.get(c.id) || 'none',
        user: {
          id: c.users?.id,
          full_name: c.users?.full_name,
          username: c.users?.username,
          avatar_url: c.users?.avatar_url,
          reputation: reputationMap.get(c.user_id),
          badges: badgesMap.get(c.user_id) || [],
          is_expert: (badgesMap.get(c.user_id) || []).some((b: any) => b.badge?.category === 'expert')
        },
        replies: [],
        attachments: c.comment_attachments || []
      };
      commentMap.set(c.id, comment);
    });

    // Second pass: Link parents
    rawComments.forEach((c: any) => {
      const comment = commentMap.get(c.id)!;
      if (c.parent_id && commentMap.has(c.parent_id)) {
        const parent = commentMap.get(c.parent_id)!;
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      } else {
        roots.push(comment);
      }
    });

    // Sort replies by score
    const sortReplies = (comments: Comment[]) => {
      comments.sort((a, b) => b.score - a.score);
      comments.forEach(c => {
        if (c.replies?.length) sortReplies(c.replies);
      });
    };
    sortReplies(roots);

    return roots;
  }

  // ===================================
  // VOTING OPERATIONS
  // ===================================

  async voteComment(
    commentId: string, 
    userId: string, 
    voteType: VoteType
  ): Promise<{ success: boolean; newScore: number }> {
    const supabase = await createClient();

    // Get user's reputation for weighted voting
    const { data: reputation } = await supabase
      .from('user_reputation')
      .select('reputation_score')
      .eq('user_id', userId)
      .single();

    const voteWeight = this.calculateVoteWeight(reputation?.reputation_score || 0);

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('comment_votes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote (toggle off)
        await supabase
          .from('comment_votes')
          .delete()
          .eq('id', existingVote.id);
      } else {
        // Change vote
        await supabase
          .from('comment_votes')
          .update({ 
            vote_type: voteType,
            user_reputation_at_vote: reputation?.reputation_score || 0
          })
          .eq('id', existingVote.id);
      }
    } else if (voteType !== 'none') {
      // New vote
      await supabase
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: userId,
          vote_type: voteType,
          user_reputation_at_vote: reputation?.reputation_score || 0
        });
    }

    // Update comment score
    const { data: updatedComment } = await supabase.rpc('update_comment_score', {
      p_comment_id: commentId
    });

    return { 
      success: true, 
      newScore: updatedComment?.[0]?.score || 0 
    };
  }

  // ===================================
  // FLAGGING OPERATIONS
  // ===================================

  async flagComment(
    commentId: string,
    userId: string,
    reason: string,
    details?: string
  ): Promise<boolean> {
    const supabase = await createClient();

    // Check if already flagged by this user
    const { data: existing } = await supabase
      .from('comment_flags')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('You have already flagged this comment');
    }

    // Insert flag
    await supabase
      .from('comment_flags')
      .insert({
        comment_id: commentId,
        user_id: userId,
        reason: reason as any,
        details
      });

    // Check if comment should be auto-hidden (>3 flags)
    const { count: flagCount } = await supabase
      .from('comment_flags')
      .select('id', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('is_resolved', false);

    if ((flagCount || 0) >= 3) {
      await supabase
        .from('market_comments')
        .update({ is_flagged: true, flag_count: flagCount })
        .eq('id', commentId);
    }

    return true;
  }

  // ===================================
  // EDIT & DELETE
  // ===================================

  async editComment(
    commentId: string,
    userId: string,
    newContent: string
  ): Promise<Comment> {
    const supabase = await createClient();

    // Verify ownership
    const { data: comment } = await supabase
      .from('market_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    // Process new content
    const { html } = this.contentProcessor.processContent(newContent);

    const { data: updated, error } = await supabase
      .from('market_comments')
      .update({
        content: newContent,
        content_html: html,
        edited_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('*, users(full_name)')
      .single();

    if (error) throw error;
    return updated as Comment;
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const supabase = await createClient();

    // Verify ownership or admin
    const { data: comment } = await supabase
      .from('market_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment) return false;

    // Check if user is owner or admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (comment.user_id !== userId && !user?.is_admin) {
      throw new Error('Unauthorized');
    }

    // Soft delete
    await supabase
      .from('market_comments')
      .update({
        is_deleted: true,
        content: '[deleted]',
        content_html: '<p class="deleted">[deleted]</p>'
      })
      .eq('id', commentId);

    return true;
  }

  // ===================================
  // REAL-TIME SUBSCRIPTION
  // ===================================

  subscribeToMarketComments(
    marketId: string,
    onUpdate: (payload: any) => void
  ) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    return supabase
      .channel(`market-comments:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_comments',
          filter: `market_id=eq.${marketId}`
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  private calculateInitialScore(reputation: UserReputation | null): number {
    if (!reputation) return 0;
    // Base score from reputation
    return Math.floor(reputation.reputation_score / 100);
  }

  private calculateVoteWeight(reputationScore: number): number {
    // Weight based on reputation tier
    if (reputationScore >= 8000) return 3; // Oracle
    if (reputationScore >= 6000) return 2.5; // Master
    if (reputationScore >= 4000) return 2; // Expert
    if (reputationScore >= 2000) return 1.5; // Analyst
    if (reputationScore >= 500) return 1.2; // Apprentice
    return 1; // Novice
  }

  private async notifyMentions(
    mentions: string[],
    commentId: string,
    marketId: string,
    senderId: string
  ): Promise<void> {
    const supabase = await createClient();

    // Find users by username
    const { data: mentionedUsers } = await supabase
      .from('users')
      .select('id')
      .in('username', mentions);

    if (!mentionedUsers?.length) return;

    // Create notifications
    const notifications = mentionedUsers.map(u => ({
      user_id: u.id,
      sender_id: senderId,
      type: 'mention',
      data: { commentId, marketId }
    }));

    await supabase.from('notifications').insert(notifications);
  }
}

export const commentsService = new CommentsService();
