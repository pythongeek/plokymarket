/**
 * Admin Resolution Panel
 * Manual review and resolution interface for markets
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ExternalLink,
  Brain,
  Users,
  Shield,
  Clock,
  Search,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ResolutionSystem {
  id: string;
  event_id: string;
  primary_method: string;
  resolution_status: 'pending' | 'in_progress' | 'resolved' | 'disputed' | 'failed';
  proposed_outcome: number | null;
  confidence_level: number | null;
  evidence: any[];
  ai_oracle_config: any;
  expert_votes: any[];
  dispute_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  markets: {
    question: string;
    category: string;
    trading_closes_at: string;
    status: string;
  };
}

export function ResolutionPanel() {
  const { t } = useTranslation();
  const [resolutions, setResolutions] = useState<ResolutionSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionSystem | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingOutcome, setResolvingOutcome] = useState<'YES' | 'NO' | null>(null);
  const [adminReasoning, setAdminReasoning] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchResolutions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('resolution_systems')
        .select(`
          *,
          markets:event_id (
            question,
            category,
            trading_closes_at,
            status
          )
        `)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setResolutions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch resolutions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolutions();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('resolution_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'resolution_systems' },
        () => fetchResolutions()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResolve = async () => {
    if (!selectedResolution || !resolvingOutcome) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      const finalOutcome = resolvingOutcome === 'YES' ? 1 : 2;
      const now = new Date().toISOString();
      
      // Update resolution system
      const { error: resolutionError } = await supabase
        .from('resolution_systems')
        .update({
          resolution_status: 'resolved',
          proposed_outcome: finalOutcome,
          resolved_at: now,
          updated_at: now,
          evidence: [
            ...(selectedResolution.evidence || []),
            {
              type: 'manual_admin',
              outcome: resolvingOutcome,
              reasoning: adminReasoning,
              timestamp: now,
            }
          ]
        })
        .eq('id', selectedResolution.id);

      if (resolutionError) throw resolutionError;

      // Update market
      const { error: marketError } = await supabase
        .from('markets')
        .update({
          status: 'resolved',
          outcome: finalOutcome,
          resolved_at: now,
          resolution_source_type: 'MANUAL',
          resolution_details: {
            admin_reasoning: adminReasoning,
            resolved_by: 'admin',
          },
          updated_at: now,
        })
        .eq('id', selectedResolution.event_id);

      if (marketError) throw marketError;

      // Trigger settlement using settle_market_v2
      const winningOutcome = resolvingOutcome === 'YES' ? 'YES' : 'NO';
      const { error: settlementError } = await supabase.rpc('settle_market_v2', {
        p_market_id: selectedResolution.event_id,
        p_winning_outcome: winningOutcome,
      });

      if (settlementError) {
        console.error('Settlement error:', settlementError);
        throw new Error(`Settlement failed: ${settlementError.message}`);
      }

      setSuccess(`Market resolved as ${resolvingOutcome}`);
      setResolveDialogOpen(false);
      setSelectedResolution(null);
      setResolvingOutcome(null);
      setAdminReasoning('');
      fetchResolutions();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve market');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      disputed: 'bg-red-100 text-red-800 border-red-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || styles.pending}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'ai_oracle': return <Brain className="w-4 h-4" />;
      case 'expert_panel': return <Users className="w-4 h-4" />;
      case 'manual_admin': return <Shield className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredResolutions = resolutions.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'proposed') {
      // Show resolutions where AI proposed an outcome but confidence < 90%
      return r.resolution_status === 'in_progress' && 
             r.proposed_outcome !== null && 
             r.confidence_level !== null && 
             r.confidence_level < 90;
    }
    return r.resolution_status === activeTab;
  });

  const pendingCount = resolutions.filter(r => r.resolution_status === 'pending').length;
  const inProgressCount = resolutions.filter(r => r.resolution_status === 'in_progress').length;
  const disputedCount = resolutions.filter(r => r.resolution_status === 'disputed').length;
  
  // Proposed resolutions: AI suggested but needs admin approval (confidence < 90%)
  const proposedCount = resolutions.filter(r => 
    r.resolution_status === 'in_progress' && 
    r.proposed_outcome !== null && 
    r.confidence_level !== null && 
    r.confidence_level < 90
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resolution Management</h2>
          <p className="text-muted-foreground">Review and resolve prediction markets</p>
        </div>
        <Button variant="outline" onClick={fetchResolutions}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{proposedCount}</div>
            <p className="text-sm text-muted-foreground">Proposed (AI)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{disputedCount}</div>
            <p className="text-sm text-muted-foreground">Disputed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {resolutions.filter(r => r.resolution_status === 'resolved').length}
            </div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="proposed">
            Proposed ({proposedCount})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressCount})
          </TabsTrigger>
          <TabsTrigger value="disputed">
            Disputed ({disputedCount})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({resolutions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredResolutions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No markets found in this category
                </CardContent>
              </Card>
            ) : (
              filteredResolutions.map((resolution) => (
                <Card key={resolution.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight mb-2">
                          {resolution.markets?.question}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            {getMethodIcon(resolution.primary_method)}
                            {resolution.primary_method.replace('_', ' ')}
                          </span>
                          <span>•</span>
                          <span>{resolution.markets?.category}</span>
                          <span>•</span>
                          <span>Closed: {new Date(resolution.markets?.trading_closes_at).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(resolution.resolution_status)}
                        {resolution.confidence_level && (
                          <Badge variant="outline" className={
                            resolution.confidence_level >= 90 
                              ? 'bg-green-50 text-green-700' 
                              : resolution.confidence_level >= 70
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-red-50 text-red-700'
                          }>
                            {resolution.confidence_level}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* AI Evidence */}
                    {resolution.evidence && resolution.evidence.length > 0 && (
                      <div className="mb-4 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          AI Analysis
                        </h4>
                        {resolution.evidence.map((evidence: any, idx: number) => (
                          <div key={idx} className="space-y-2">
                            {evidence.reasoning && (
                              <p className="text-sm text-muted-foreground">
                                {evidence.reasoning}
                              </p>
                            )}
                            {evidence.sources && evidence.sources.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {evidence.sources.map((source: any, sidx: number) => (
                                  <a
                                    key={sidx}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {source.title || `Source ${sidx + 1}`}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Proposed Outcome Alert - For AI suggestions with low confidence */}
                    {resolution.proposed_outcome !== null && resolution.confidence_level !== null && resolution.confidence_level < 90 && (
                      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-purple-800">AI Proposed Resolution</span>
                        </div>
                        <p className="text-sm text-purple-700 mb-2">
                          AI suggests: <strong>{resolution.proposed_outcome === 1 ? 'YES' : 'NO'}</strong> 
                          {' '}with {resolution.confidence_level}% confidence
                        </p>
                        <p className="text-xs text-purple-600">
                          Confidence is below 90%. Manual approval required.
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {resolution.resolution_status !== 'resolved' && (
                      <div className="flex gap-2">
                        {/* Approve AI Proposal Button - Only show if AI proposed */}
                        {resolution.proposed_outcome !== null && resolution.confidence_level !== null && resolution.confidence_level < 90 && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedResolution(resolution);
                              setResolvingOutcome(resolution.proposed_outcome === 1 ? 'YES' : 'NO');
                              setResolveDialogOpen(true);
                            }}
                            className="flex-1 bg-purple-50 hover:bg-purple-100 border-purple-200"
                          >
                            <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                            Approve AI ({resolution.proposed_outcome === 1 ? 'YES' : 'NO'})
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedResolution(resolution);
                            setResolvingOutcome('YES');
                            setResolveDialogOpen(true);
                          }}
                          className="flex-1 bg-green-50 hover:bg-green-100 border-green-200"
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          Resolve YES
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedResolution(resolution);
                            setResolvingOutcome('NO');
                            setResolveDialogOpen(true);
                          }}
                          className="flex-1 bg-red-50 hover:bg-red-100 border-red-200"
                        >
                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                          Resolve NO
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Market</DialogTitle>
            <DialogDescription>
              You are about to resolve this market as <strong>{resolvingOutcome}</strong>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedResolution?.markets?.question}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Reasoning (Optional)</label>
              <Textarea
                placeholder="Explain your decision..."
                value={adminReasoning}
                onChange={(e) => setAdminReasoning(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={actionLoading}
              className={resolvingOutcome === 'YES' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Resolve {resolvingOutcome}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
