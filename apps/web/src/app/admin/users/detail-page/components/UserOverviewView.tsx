'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  FileText,
  Lock,
  Unlock,
  Save,
  X,
  Loader2,
  Plus
} from 'lucide-react';
import { userManagementService } from '@/lib/user-management/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

interface UserOverviewViewProps {
  userId: string;
  userData: any;
  onUpdate: () => void;
}

export function UserOverviewView({ userId, userData, onUpdate }: UserOverviewViewProps) {
  const { profile, status, notes } = userData;
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDualAuthModal, setShowDualAuthModal] = useState(false);
  const [statusChanges, setStatusChanges] = useState<any>({});
  const [statusReason, setStatusReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const result = await userManagementService.updateUserStatus(
        userId,
        statusChanges,
        statusReason
      );

      if (result.requires_dual_auth) {
        setShowStatusModal(false);
        setShowDualAuthModal(true);
        return;
      }

      setShowStatusModal(false);
      onUpdate();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setUpdating(true);
    try {
      await userManagementService.addInternalNote({
        user_id: userId,
        note: newNote,
        note_type: noteType
      });
      setShowNoteModal(false);
      setNewNote('');
      onUpdate();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Account Status
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowStatusModal(true)}>
              Modify
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Can Trade</span>
              <Switch checked={profile.can_trade} disabled />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Can Deposit</span>
              <Switch checked={profile.can_deposit} disabled />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Can Withdraw</span>
              <Switch checked={profile.can_withdraw} disabled />
            </div>
            {status?.restriction_reason && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Restriction Reason
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {status.restriction_reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Joined</span>
              <span className="text-sm">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Login</span>
              <span className="text-sm">
                {profile.last_sign_in_at 
                  ? new Date(profile.last_sign_in_at).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Volume</span>
              <span className="text-sm">${profile.total_volume?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Realized P&L</span>
              <span className={cn(
                "text-sm font-medium",
                profile.total_realized_pnl >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                ${profile.total_realized_pnl?.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Internal Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Internal Notes</CardTitle>
          <Button size="sm" onClick={() => setShowNoteModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No internal notes
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((note: any) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{note.created_by.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className="text-xs">{note.note_type}</Badge>
                    {note.is_escalation && (
                      <Badge variant="destructive" className="text-xs">Escalation</Badge>
                    )}
                  </div>
                  <p className="text-sm">{note.note}</p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modify User Status</DialogTitle>
            <DialogDescription>
              Changes to critical settings require dual authorization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Account Status</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={statusChanges.account_status || profile.account_status}
                onChange={(e) => setStatusChanges(prev => ({ ...prev, account_status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
                <option value="dormant">Dormant</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Trading Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Can Trade</span>
                  <Switch
                    checked={statusChanges.can_trade ?? profile.can_trade}
                    onCheckedChange={(v) => setStatusChanges(prev => ({ ...prev, can_trade: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Can Deposit</span>
                  <Switch
                    checked={statusChanges.can_deposit ?? profile.can_deposit}
                    onCheckedChange={(v) => setStatusChanges(prev => ({ ...prev, can_deposit: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Can Withdraw</span>
                  <Switch
                    checked={statusChanges.can_withdraw ?? profile.can_withdraw}
                    onCheckedChange={(v) => setStatusChanges(prev => ({ ...prev, can_withdraw: v }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <Textarea
                placeholder="Enter reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updating || !statusReason}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
              >
                <option value="general">General</option>
                <option value="kyc">KYC</option>
                <option value="risk">Risk</option>
                <option value="support">Support</option>
                <option value="trading">Trading</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                placeholder="Enter note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={updating || !newNote.trim()}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dual Auth Modal */}
      <Dialog open={showDualAuthModal} onOpenChange={setShowDualAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dual Authorization Required</DialogTitle>
            <DialogDescription>
              This action requires approval from a second administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                The status change has been queued for dual authorization. 
                Another admin must approve this action before it takes effect.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDualAuthModal(false)}>
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
