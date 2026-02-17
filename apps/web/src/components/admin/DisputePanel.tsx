/**
 * Dispute Management Panel
 * Admin interface for handling disputes and manual reviews
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield,
  Gavel,
  RefreshCw,
  Clock,
  DollarSign,
  FileText,
  User,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Dispute {
  id: string;
  market_id: string;
  disputed_by: string;
  dispute_type: string;
  dispute_reason: string;
  evidence_provided: string[];
  bond_amount: number;
  bond_paid: boolean;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'escalated';
  resolution: string | null;
  review_notes: string | null;
  created_at: string;
  markets: {
    question: string;
    status: string;
  };
  user_profiles: {
    full_name: string;
  };
}

interface ManualReview {
  id: string;
  market_id: string;
  review_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  assigned_to: string | null;
  created_at: string;
  markets: {
    question: string;
    category: string;
  };
  ai_trust_scores: {
    trust_score: number;
    ai_confidence: number;
    ai_reasoning: string;
    ai_sources: string[];
  } | null;
}

export function DisputePanel() {
  const { t } = useTranslation();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reviews, setReviews] = useState<ManualReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');
  
  // Dialog states
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [selectedReview, setSelectedReview] = useState<ManualReview | null>(null);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  // Form states
  const [adminNotes, setAdminNotes] = useState('');
  const [adminDecision, setAdminDecision] = useState<'YES' | 'NO' | null>(null);
  const [returnBond, setReturnBond] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from('dispute_records')
        .select(`
          *,
          markets:market_id (question, status),
          user_profiles:disputed_by (full_name)
        `)
        .order('created_at', { ascending: false });

      if (disputesError) throw disputesError;
      setDisputes(disputesData || []);

      // Fetch manual reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('manual_review_queue')
        .select(`
          *,
          markets:market_id (question, category),
          ai_trust_scores:ai_trust_score_id (trust_score, ai_confidence, ai_reasoning, ai_sources)
        `)
        .in('status', ['pending', 'in_review'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveDispute = async () => {
    if (!selectedDispute || !adminDecision) return;
    
    setActionLoading(true);
    try {
      const resolution = adminDecision === 'YES' ? 'upheld' : 'dismissed';
      
      // Call resolve_dispute function
      const { error } = await supabase.rpc('resolve_dispute', {
        p_dispute_id: selectedDispute.id,
        p_reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        p_resolution: resolution,
        p_review_notes: adminNotes,
        p_return_bond: returnBond
      });

      if (error) throw error;

      setDisputeDialogOpen(false);
      setSelectedDispute(null);
      setAdminNotes('');
      setAdminDecision(null);
      fetchData();

    } catch (err) {
      console.error('Failed to resolve dispute:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualResolve = async () => {
    if (!selectedReview || !adminDecision) return;
    
    setActionLoading(true);
    try {
      const outcome = adminDecision === 'YES' ? 1 : 2;
      
      // Call admin_manual_resolve function
      const { error } = await supabase.rpc('admin_manual_resolve', {
        p_market_id: selectedReview.market_id,
        p_admin_id: (await supabase.auth.getUser()).data.user?.id,
        p_outcome: outcome,
        p_reasoning: adminNotes,
        p_confidence: 95.0
      });

      if (error) throw error;

      setReviewDialogOpen(false);
      setSelectedReview(null);
      setAdminNotes('');
      setAdminDecision(null);
      fetchData();

    } catch (err) {
      console.error('Failed to resolve:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100';
  };

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const inReview = reviews.filter(r => r.status === 'in_review');
  const pendingDisputes = disputes.filter(d => d.status === 'pending');

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
          <h2 className="text-2xl font-bold">Dispute & Review Management</h2>
          <p className="text-muted-foreground">Handle disputes and manual market resolutions</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{pendingReviews.length}</div>
            <p className="text-sm text-muted-foreground">Pending Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{inReview.length}</div>
            <p className="text-sm text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{pendingDisputes.length}</div>
            <p className="text-sm text-muted-foreground">Pending Disputes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{disputes.length}</div>
            <p className="text-sm text-muted-foreground">Total Disputes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reviews">
            Manual Reviews ({pendingReviews.length + inReview.length})
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Disputes ({pendingDisputes.length})
          </TabsTrigger>
          <TabsTrigger value="all-disputes">
            All Disputes ({disputes.length})
          </TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No markets pending review</p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card 
                  key={review.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedReview(review);
                    setReviewDialogOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{review.markets?.question}</CardTitle>
                          <Badge className={getPriorityColor(review.priority)}>
                            {review.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription>
                          {review.review_type.replace('_', ' ').toUpperCase()} • {review.markets?.category}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(review.status)}>
                        {review.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {review.ai_trust_scores && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span>Trust: {review.ai_trust_scores.trust_score}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <span>AI Confidence: {review.ai_trust_scores.ai_confidence}%</span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="mt-6">
          <div className="space-y-4">
            {pendingDisputes.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No pending disputes</p>
                </CardContent>
              </Card>
            ) : (
              pendingDisputes.map((dispute) => (
                <Card 
                  key={dispute.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedDispute(dispute);
                    setDisputeDialogOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <CardTitle className="text-lg">{dispute.markets?.question}</CardTitle>
                        </div>
                        <CardDescription>
                          {dispute.dispute_type.replace('_', ' ').toUpperCase()} • By {dispute.user_profiles?.full_name}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={getStatusColor(dispute.status)}>
                          {dispute.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Bond: ${dispute.bond_amount}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dispute.dispute_reason}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* All Disputes Tab */}
        <TabsContent value="all-disputes" className="mt-6">
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Card key={dispute.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{dispute.markets?.question}</CardTitle>
                      <CardDescription>
                        {dispute.dispute_type.replace('_', ' ').toUpperCase()} • {new Date(dispute.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle>Manual Market Resolution</DialogTitle>
                <DialogDescription>
                  Review AI analysis and make final decision
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 py-4">
                  {/* Market Question */}
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">{selectedReview.markets?.question}</p>
                  </div>

                  {/* AI Analysis */}
                  {selectedReview.ai_trust_scores && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        AI Analysis
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded">
                          <div className="text-sm text-muted-foreground">Trust Score</div>
                          <div className="text-xl font-bold">{selectedReview.ai_trust_scores.trust_score}%</div>
                        </div>
                        <div className="p-3 bg-muted rounded">
                          <div className="text-sm text-muted-foreground">AI Confidence</div>
                          <div className="text-xl font-bold">{selectedReview.ai_trust_scores.ai_confidence}%</div>
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="text-sm text-muted-foreground mb-1">AI Reasoning</div>
                        <p className="text-sm">{selectedReview.ai_trust_scores.ai_reasoning}</p>
                      </div>
                    </div>
                  )}

                  {/* Admin Decision */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Your Decision</h4>
                    <div className="flex gap-2">
                      <Button
                        variant={adminDecision === 'YES' ? 'default' : 'outline'}
                        onClick={() => setAdminDecision('YES')}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve YES
                      </Button>
                      <Button
                        variant={adminDecision === 'NO' ? 'default' : 'outline'}
                        onClick={() => setAdminDecision('NO')}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Resolve NO
                      </Button>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Explain your decision..."
                      rows={4}
                    />
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualResolve}
                  disabled={!adminDecision || actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Gavel className="w-4 h-4 mr-2" />
                  )}
                  Final Resolve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {selectedDispute && (
            <>
              <DialogHeader>
                <DialogTitle>Resolve Dispute</DialogTitle>
                <DialogDescription>
                  Review dispute and make decision
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 py-4">
                  {/* Dispute Info */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-red-800">Dispute Details</span>
                    </div>
                    <p className="text-sm text-red-700">{selectedDispute.dispute_reason}</p>
                  </div>

                  {/* Market Info */}
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">{selectedDispute.markets?.question}</p>
                  </div>

                  {/* Bond Info */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Bond Amount: ${selectedDispute.bond_amount}</span>
                    </div>
                    <Badge variant={selectedDispute.bond_paid ? 'default' : 'secondary'}>
                      {selectedDispute.bond_paid ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>

                  {/* Decision */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Your Decision</h4>
                    <div className="flex gap-2">
                      <Button
                        variant={adminDecision === 'YES' ? 'default' : 'outline'}
                        onClick={() => setAdminDecision('YES')}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Uphold Dispute
                      </Button>
                      <Button
                        variant={adminDecision === 'NO' ? 'default' : 'outline'}
                        onClick={() => setAdminDecision('NO')}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Dismiss Dispute
                      </Button>
                    </div>
                  </div>

                  {/* Bond Return */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="returnBond"
                      checked={returnBond}
                      onChange={(e) => setReturnBond(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="returnBond" className="text-sm">
                      Return bond to disputant
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Review Notes</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Explain your decision..."
                      rows={4}
                    />
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleResolveDispute}
                  disabled={!adminDecision || actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Gavel className="w-4 h-4 mr-2" />
                  )}
                  Resolve Dispute
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
