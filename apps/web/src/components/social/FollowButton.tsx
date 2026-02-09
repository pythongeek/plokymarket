'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useStore } from '@/store/useStore';
import { UserPlus, UserCheck, UserX, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetUserId: string;
  targetUserName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showCount?: boolean;
  followersCount?: number;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export function FollowButton({
  targetUserId,
  targetUserName,
  size = 'md',
  variant = 'default',
  showCount = false,
  followersCount,
  onFollowChange,
  className
}: FollowButtonProps) {
  const { currentUser, isAuthenticated } = useStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localFollowersCount, setLocalFollowersCount] = useState(followersCount || 0);

  const isSelf = currentUser?.id === targetUserId;

  // Check follow status on mount
  useEffect(() => {
    if (!isAuthenticated || isSelf) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/follows?type=status&userId=${targetUserId}`);
        if (res.ok) {
          const { data } = await res.json();
          setIsFollowing(data.is_following);
          setHasPendingRequest(data.has_pending_request);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkStatus();
  }, [targetUserId, isAuthenticated, isSelf]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to follow users',
        variant: 'destructive'
      });
      return;
    }

    if (isSelf) {
      toast({
        title: 'Cannot follow yourself',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          action: isFollowing ? 'unfollow' : 'follow'
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process follow action');
      }

      const { data } = await res.json();

      if (data.status === 'pending_approval') {
        setHasPendingRequest(true);
        toast({
          title: 'Follow request sent',
          description: `${targetUserName || 'This user'} needs to approve your follow request`
        });
      } else if (data.success) {
        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);
        setHasPendingRequest(false);
        
        // Update followers count
        setLocalFollowersCount(prev => 
          newFollowingState ? prev + 1 : Math.max(0, prev - 1)
        );

        toast({
          title: newFollowingState ? 'Now following' : 'Unfollowed',
          description: newFollowingState 
            ? `You're now following ${targetUserName || 'this user'}`
            : `You've unfollowed ${targetUserName || 'this user'}`
        });

        onFollowChange?.(newFollowingState);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if viewing own profile
  if (isSelf) return null;

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Pending approval state
  if (hasPendingRequest) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled={true}
        className={cn(sizeClasses[size], 'opacity-70', className)}
      >
        <Clock className={cn(iconSizes[size], 'mr-1.5')} />
        Pending
      </Button>
    );
  }

  // Following state
  if (isFollowing) {
    return (
      <Button
        variant={variant === 'ghost' ? 'ghost' : 'outline'}
        size={size}
        onClick={handleFollow}
        disabled={isLoading}
        className={cn(
          sizeClasses[size],
          'group',
          variant !== 'ghost' && 'hover:border-destructive hover:text-destructive',
          className
        )}
      >
        <UserCheck className={cn(iconSizes[size], 'mr-1.5 group-hover:hidden')} />
        <UserX className={cn(iconSizes[size], 'mr-1.5 hidden group-hover:block')} />
        <span className="group-hover:hidden">Following</span>
        <span className="hidden group-hover:block">Unfollow</span>
        {showCount && localFollowersCount > 0 && (
          <span className="ml-1.5 opacity-60">({localFollowersCount})</span>
        )}
      </Button>
    );
  }

  // Not following state
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(sizeClasses[size], className)}
    >
      <UserPlus className={cn(iconSizes[size], 'mr-1.5')} />
      Follow
      {showCount && localFollowersCount > 0 && (
        <span className="ml-1.5 opacity-60">({localFollowersCount})</span>
      )}
    </Button>
  );
}

// Follow stats display component
interface FollowStatsProps {
  userId: string;
  followersCount?: number;
  followingCount?: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export function FollowStats({
  userId,
  followersCount,
  followingCount,
  onFollowersClick,
  onFollowingClick
}: FollowStatsProps) {
  const [stats, setStats] = useState({
    followers: followersCount || 0,
    following: followingCount || 0
  });

  useEffect(() => {
    if (followersCount !== undefined && followingCount !== undefined) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/follows?userId=${userId}`);
        if (res.ok) {
          const { data } = await res.json();
          setStats({
            followers: data.followers_count,
            following: data.following_count
          });
        }
      } catch (error) {
        console.error('Error fetching follow stats:', error);
      }
    };

    fetchStats();
  }, [userId, followersCount, followingCount]);

  return (
    <div className="flex items-center gap-4 text-sm">
      <button
        onClick={onFollowersClick}
        className="hover:underline"
      >
        <span className="font-semibold">{stats.followers.toLocaleString()}</span>
        <span className="text-muted-foreground ml-1">followers</span>
      </button>
      <button
        onClick={onFollowingClick}
        className="hover:underline"
      >
        <span className="font-semibold">{stats.following.toLocaleString()}</span>
        <span className="text-muted-foreground ml-1">following</span>
      </button>
    </div>
  );
}
