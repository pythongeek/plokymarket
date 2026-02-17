'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  MapPin,
  Phone,
  Shield,
  AlertTriangle,
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

interface UserKYCViewProps {
  userId: string;
  kyc: any;
}

export function UserKYCView({ userId, kyc }: UserKYCViewProps) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleVerify = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to verify KYC');
      }

      setShowVerifyModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error verifying KYC:', error);
      alert(error instanceof Error ? error.message : 'Error verifying KYC');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectionReason
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reject KYC');
      }

      setShowRejectModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      alert(error instanceof Error ? error.message : 'Error rejecting KYC');
    } finally {
      setProcessing(false);
    }
  };

  if (!kyc || kyc.verification_status === 'unverified') {
    return (
      <Card className="p-8 text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <h3 className="text-lg font-medium mb-2">No KYC Submitted</h3>
        <p className="text-sm text-muted-foreground">
          This user has not submitted KYC documentation yet.
        </p>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (kyc.verification_status) {
      case 'verified':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-blue-500" />;
      default:
        return <Shield className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card className={cn(
        "border-l-4",
        kyc.verification_status === 'verified' ? 'border-l-green-500' :
          kyc.verification_status === 'rejected' ? 'border-l-red-500' :
            'border-l-blue-500'
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h3 className="text-lg font-medium capitalize">
                  {kyc.verification_status}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Verification Tier: <span className="font-medium capitalize">{kyc.verification_tier}</span>
                </p>
              </div>
            </div>
            {kyc.verification_status === 'pending' && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRejectModal(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => setShowVerifyModal(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="text-sm font-medium">{kyc.full_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date of Birth</span>
              <span className="text-sm">{kyc.date_of_birth || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nationality</span>
              <span className="text-sm">{kyc.nationality || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ID Type</span>
              <span className="text-sm capitalize">{kyc.id_type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ID Number</span>
              <span className="text-sm font-mono">{kyc.id_number || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Phone Number</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{kyc.phone_number || 'N/A'}</span>
                {kyc.phone_verified && (
                  <Badge variant="default" className="bg-green-500 text-xs">Verified</Badge>
                )}
              </div>
            </div>
            <div className="pt-2 border-t">
              <span className="text-sm text-muted-foreground">Address</span>
              <p className="text-sm mt-1">
                {kyc.address_line1 || 'N/A'}
              </p>
              {kyc.address_line2 && (
                <p className="text-sm">{kyc.address_line2}</p>
              )}
              <p className="text-sm">
                {kyc.city}{kyc.city && kyc.state_province ? ', ' : ''}{kyc.state_province}
              </p>
              <p className="text-sm">
                {kyc.postal_code}{kyc.postal_code && kyc.country ? ' ' : ''}{kyc.country}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'ID Front', url: kyc.id_document_front_url },
              { label: 'ID Back', url: kyc.id_document_back_url },
              { label: 'Selfie', url: kyc.selfie_url },
              { label: 'Proof of Address', url: kyc.proof_of_address_url },
            ].map((doc) => (
              <div
                key={doc.label}
                className={cn(
                  "aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                  doc.url ? "border-green-300" : "border-gray-300"
                )}
                onClick={() => doc.url && window.open(doc.url, '_blank')}
              >
                {doc.url ? (
                  <>
                    <FileText className="h-8 w-8 text-green-500" />
                    <span className="text-xs text-center px-2">{doc.label}</span>
                    <span className="text-xs text-green-600">View</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-8 w-8 text-gray-300" />
                    <span className="text-xs text-center px-2 text-muted-foreground">{doc.label}</span>
                    <span className="text-xs text-muted-foreground">Not provided</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold",
              kyc.risk_score >= 80 ? 'bg-red-100 text-red-700' :
                kyc.risk_score >= 60 ? 'bg-orange-100 text-orange-700' :
                  kyc.risk_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
            )}>
              {kyc.risk_score}
            </div>
            <div>
              <p className="font-medium">Risk Score</p>
              <p className="text-sm text-muted-foreground">
                {kyc.risk_score >= 80 ? 'Critical Risk' :
                  kyc.risk_score >= 60 ? 'High Risk' :
                    kyc.risk_score >= 40 ? 'Medium Risk' :
                      'Low Risk'}
              </p>
            </div>
          </div>
          {kyc.risk_factors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Risk Factors:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {kyc.risk_factors.map((factor: string, i: number) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify KYC</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this KYC verification?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC verification.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Rejection Reason</Label>
            <Textarea
              placeholder="Enter reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
