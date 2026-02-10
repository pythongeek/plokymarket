'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  AlertTriangle,
  Scissors,
  Loader2
} from 'lucide-react';
import { userManagementService } from '@/lib/user-management/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface UserTradingViewProps {
  userId: string;
  profile: any;
}

export function UserTradingView({ userId, profile }: UserTradingViewProps) {
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [interventionType, setInterventionType] = useState<'liquidation' | 'forced_closure'>('liquidation');
  const [interventionReason, setInterventionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleIntervention = async () => {
    if (!interventionReason.trim()) return;
    
    setProcessing(true);
    try {
      await userManagementService.performIntervention({
        user_id: userId,
        intervention_type: interventionType,
        reason: interventionReason,
        send_notification: true
      });
      setShowInterventionModal(false);
      setInterventionReason('');
      alert('Intervention performed successfully');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Trading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-2xl font-bold">{profile.total_trades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Volume</p>
            <p className="text-2xl font-bold">${profile.total_volume?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Realized P&L</p>
            <p className={cn(
              "text-2xl font-bold",
              profile.total_realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              ${profile.total_realized_pnl?.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Open Positions</p>
            <p className="text-2xl font-bold">{profile.open_positions_count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Position Intervention */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Position Intervention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Perform liquidation or forced closure on user positions for risk management.
            This action will be logged and the user will be notified.
          </p>
          <Button variant="outline" onClick={() => setShowInterventionModal(true)}>
            <Scissors className="h-4 w-4 mr-2" />
            Perform Intervention
          </Button>
        </CardContent>
      </Card>

      {/* Mock Trading History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Trading Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { market: 'Will BTC hit $100k?', type: 'buy', amount: 500, pnl: 45, date: '2 hours ago' },
              { market: 'Bangladesh vs India', type: 'sell', amount: 200, pnl: -30, date: '5 hours ago' },
              { market: 'Ethereum ETF Approval', type: 'buy', amount: 1000, pnl: 120, date: '1 day ago' },
            ].map((trade, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{trade.market}</p>
                  <p className="text-xs text-muted-foreground">{trade.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'}>
                    {trade.type.toUpperCase()}
                  </Badge>
                  <span className="text-sm">${trade.amount}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intervention Modal */}
      <Dialog open={showInterventionModal} onOpenChange={setShowInterventionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Position Intervention</DialogTitle>
            <DialogDescription>
              This action will close the user's positions. They will be notified immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Intervention Type</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value as any)}
              >
                <option value="liquidation">Liquidation</option>
                <option value="forced_closure">Forced Closure</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Enter reason for intervention..."
                value={interventionReason}
                onChange={(e) => setInterventionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInterventionModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleIntervention} 
              disabled={processing || !interventionReason.trim()}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Perform Intervention
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
