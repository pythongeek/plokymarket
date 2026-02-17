/**
 * Expert Panel Management Component
 * Admin interface for managing experts and viewing reputation
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Award,
  Brain,
  Users,
  Shield,
  Search,
  RefreshCw,
  UserPlus,
  BarChart3,
  Medal
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Expert {
  id: string;
  expert_name: string;
  credentials: string;
  specializations: string[];
  bio: string;
  avatar_url: string;
  reputation_score: number;
  accuracy_rate: number;
  expert_rating: number;
  rank_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  total_votes: number;
  correct_votes: number;
  is_verified: boolean;
  is_active: boolean;
  availability_status: string;
  created_at: string;
  last_vote_at: string;
}

interface ExpertVote {
  id: string;
  expert_id: string;
  event_id: string;
  vote_outcome: number;
  confidence_level: number;
  reasoning: string;
  ai_relevance_score: number;
  ai_verification_status: string;
  is_correct: boolean;
  points_earned: number;
  created_at: string;
  markets: {
    question: string;
    outcome: number;
  };
}

const RANK_COLORS = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-white',
  gold: 'bg-yellow-500 text-white',
  platinum: 'bg-cyan-500 text-white',
  diamond: 'bg-purple-500 text-white'
};

const RANK_ICONS = {
  bronze: Medal,
  silver: Medal,
  gold: Award,
  platinum: Award,
  diamond: Star
};

export function ExpertPanel() {
  const { t } = useTranslation();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [votes, setVotes] = useState<ExpertVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [expertDetailOpen, setExpertDetailOpen] = useState(false);
  const [addExpertOpen, setAddExpertOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('verified');

  // Form state for new expert
  const [newExpert, setNewExpert] = useState({
    expert_name: '',
    email: '',
    credentials: '',
    specializations: '',
    bio: ''
  });

  const fetchExperts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expert_panel')
        .select('*')
        .order('reputation_score', { ascending: false });

      if (error) throw error;
      setExperts(data || []);
    } catch (err) {
      console.error('Failed to fetch experts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async (expertId: string) => {
    try {
      const { data, error } = await supabase
        .from('expert_votes')
        .select(`
          *,
          markets:event_id (
            question,
            outcome
          )
        `)
        .eq('expert_id', expertId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVotes(data || []);
    } catch (err) {
      console.error('Failed to fetch votes:', err);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, []);

  const handleVerifyExpert = async (expertId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('expert_panel')
        .update({ 
          is_verified: verified,
          verified_at: verified ? new Date().toISOString() : null,
          verified_by: verified ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', expertId);

      if (error) throw error;
      fetchExperts();
    } catch (err) {
      console.error('Failed to verify expert:', err);
    }
  };

  const handleAddExpert = async () => {
    try {
      // Create user first (simplified - in production you'd send invitation)
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: newExpert.email,
        password: Math.random().toString(36).slice(-8), // Random temp password
      });

      if (userError) throw userError;

      // Create expert profile
      const { error } = await supabase
        .from('expert_panel')
        .insert({
          user_id: userData.user?.id,
          expert_name: newExpert.expert_name,
          credentials: newExpert.credentials,
          specializations: newExpert.specializations.split(',').map(s => s.trim()),
          bio: newExpert.bio,
          is_verified: false,
          is_active: true
        });

      if (error) throw error;

      setAddExpertOpen(false);
      setNewExpert({ expert_name: '', email: '', credentials: '', specializations: '', bio: '' });
      fetchExperts();
    } catch (err) {
      console.error('Failed to add expert:', err);
    }
  };

  const openExpertDetail = (expert: Expert) => {
    setSelectedExpert(expert);
    fetchVotes(expert.id);
    setExpertDetailOpen(true);
  };

  const filteredExperts = experts.filter(e => {
    const matchesSearch = e.expert_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'verified') return matchesSearch && e.is_verified;
    if (activeTab === 'pending') return matchesSearch && !e.is_verified;
    if (activeTab === 'active') return matchesSearch && e.is_active;
    return matchesSearch;
  });

  const stats = {
    total: experts.length,
    verified: experts.filter(e => e.is_verified).length,
    pending: experts.filter(e => !e.is_verified).length,
    topTier: experts.filter(e => ['platinum', 'diamond'].includes(e.rank_tier)).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expert Panel Management</h2>
          <p className="text-muted-foreground">Manage expert panel and reputation system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchExperts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setAddExpertOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Expert
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Experts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.topTier}</div>
            <p className="text-sm text-muted-foreground">Platinum+</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search experts by name or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExperts.map((expert) => {
              const RankIcon = RANK_ICONS[expert.rank_tier];
              return (
                <Card 
                  key={expert.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openExpertDetail(expert)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={expert.avatar_url} />
                        <AvatarFallback>{expert.expert_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base truncate">{expert.expert_name}</CardTitle>
                          {expert.is_verified && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <CardDescription className="text-xs truncate">
                          {expert.credentials || 'No credentials'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={RANK_COLORS[expert.rank_tier]}>
                        <RankIcon className="w-3 h-3 mr-1" />
                        {expert.rank_tier.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        <Star className="w-3 h-3 mr-1" />
                        {expert.reputation_score.toFixed(2)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <span>{expert.accuracy_rate.toFixed(1)}% accuracy</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span>{expert.correct_votes}/{expert.total_votes} votes</span>
                      </div>
                    </div>

                    {expert.specializations && expert.specializations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {expert.specializations.slice(0, 3).map((spec, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {expert.specializations.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{expert.specializations.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Expert Detail Dialog */}
      <Dialog open={expertDetailOpen} onOpenChange={setExpertDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          {selectedExpert && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedExpert.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {selectedExpert.expert_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedExpert.expert_name}
                      {selectedExpert.is_verified && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </DialogTitle>
                    <DialogDescription>{selectedExpert.credentials}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{selectedExpert.reputation_score.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Reputation</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{selectedExpert.accuracy_rate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{selectedExpert.total_votes}</div>
                      <div className="text-xs text-muted-foreground">Total Votes</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{selectedExpert.expert_rating || '-'}</div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedExpert.bio && (
                    <div>
                      <h4 className="font-semibold mb-2">Bio</h4>
                      <p className="text-sm text-muted-foreground">{selectedExpert.bio}</p>
                    </div>
                  )}

                  {/* Recent Votes */}
                  <div>
                    <h4 className="font-semibold mb-3">Recent Votes ({votes.length})</h4>
                    <div className="space-y-3">
                      {votes.map((vote) => (
                        <Card key={vote.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">
                                  {vote.markets?.question}
                                </p>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {vote.reasoning?.substring(0, 100)}...
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge variant={vote.vote_outcome === 1 ? 'default' : 'secondary'}>
                                    Voted: {vote.vote_outcome === 1 ? 'YES' : 'NO'}
                                  </Badge>
                                  {vote.is_correct !== null && (
                                    <Badge variant={vote.is_correct ? 'outline' : 'destructive'}>
                                      {vote.is_correct ? (
                                        <><CheckCircle className="w-3 h-3 mr-1" /> Correct</>
                                      ) : (
                                        <><XCircle className="w-3 h-3 mr-1" /> Wrong</>
                                      )}
                                    </Badge>
                                  )}
                                  {vote.ai_relevance_score && (
                                    <Badge variant="outline">
                                      AI Score: {vote.ai_relevance_score}/10
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                {!selectedExpert.is_verified ? (
                  <Button onClick={() => handleVerifyExpert(selectedExpert.id, true)}>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Expert
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => handleVerifyExpert(selectedExpert.id, false)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Revoke Verification
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Expert Dialog */}
      <Dialog open={addExpertOpen} onOpenChange={setAddExpertOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Expert</DialogTitle>
            <DialogDescription>
              Create a new expert account. They will receive an email invitation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={newExpert.expert_name}
                onChange={(e) => setNewExpert({ ...newExpert, expert_name: e.target.value })}
                placeholder="Dr. John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newExpert.email}
                onChange={(e) => setNewExpert({ ...newExpert, email: e.target.value })}
                placeholder="expert@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Credentials</label>
              <Input
                value={newExpert.credentials}
                onChange={(e) => setNewExpert({ ...newExpert, credentials: e.target.value })}
                placeholder="PhD in Economics, Harvard"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Specializations (comma separated)</label>
              <Input
                value={newExpert.specializations}
                onChange={(e) => setNewExpert({ ...newExpert, specializations: e.target.value })}
                placeholder="Economics, Politics, Crypto"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                value={newExpert.bio}
                onChange={(e) => setNewExpert({ ...newExpert, bio: e.target.value })}
                placeholder="Brief bio of the expert..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExpertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpert}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Expert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
