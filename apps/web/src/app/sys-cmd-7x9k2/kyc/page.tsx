'use client'

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface KYCSubmission {
    id: string;
    user_id: string;
    nid_number: string;
    date_of_birth: string;
    nid_front_url: string;
    nid_back_url: string;
    selfie_url: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    reviewed_at?: string;
    created_at: string;
    user?: { email: string } | { email: string }[] | null;
}

function getUserEmail(sub: KYCSubmission): string {
    if (!sub.user) return sub.user_id.substring(0, 8) + '...';
    if (Array.isArray(sub.user)) return sub.user[0]?.email || sub.user_id.substring(0, 8) + '...';
    return (sub.user as { email?: string }).email || sub.user_id.substring(0, 8) + '...';
}

export default function KYCAdminPage() {
    const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);

    const supabase = createClient();

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('kyc_submissions')
                .select('*, user:user_profiles(email)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching KYC:', error);
                toast.error('Failed to load KYC Submissions');
                setSubmissions([]);
            } else {
                setSubmissions(data as KYCSubmission[] || []);
            }
        } catch (err: any) {
            console.error('Network error fetching KYC:', err);
            toast.error('Network error loading KYC Submissions');
            setSubmissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const { error: kycError } = await supabase
                .from('kyc_submissions')
                .update({ status: 'approved', reviewed_at: new Date().toISOString() })
                .eq('id', id);

            if (kycError) {
                toast.error('Failed to approve KYC: ' + kycError.message);
                return;
            }

            if (selectedSubmission) {
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .update({ kyc_verified: true, kyc_level: 1 })
                    .eq('id', selectedSubmission.user_id);

                if (profileError) {
                    toast.error('Approved KYC but failed to update profile tier');
                    console.error(profileError);
                    return;
                }
            }

            toast.success('KYC approved successfully');
            fetchSubmissions();
            setSelectedSubmission(null);
        } catch (err: any) {
            console.error('Approve error:', err);
            toast.error('Unexpected error during approval: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string, reason: string) => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('kyc_submissions')
                .update({
                    status: 'rejected',
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: reason
                })
                .eq('id', id);

            if (error) {
                toast.error('Failed to reject KYC: ' + error.message);
                return;
            }

            toast.success('KYC rejected');
            fetchSubmissions();
            setSelectedSubmission(null);
        } catch (err: any) {
            console.error('Reject error:', err);
            toast.error('Unexpected error during rejection: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const getImageUrl = (path: string) => {
        return supabase.storage.from('kyc-documents').getPublicUrl(path).data.publicUrl;
    };

    if (loading) {
        return <div className="p-8 text-center">Loading KYC Submissions...</div>;
    }

    const pending = submissions.filter(s => s.status === 'pending');

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">KYC Administration</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Pending List */}
                <div className="border rounded-lg p-4 h-[calc(100vh-140px)] overflow-y-auto bg-card">
                    <h2 className="font-semibold text-lg mb-4">Pending Submissions ({pending.length})</h2>

                    {pending.length === 0 ? (
                        <p className="text-muted-foreground">No pending submissions.</p>
                    ) : (
                        <div className="space-y-3">
                            {pending.map((sub) => (
                                <div
                                    key={sub.id}
                                    className={`p-3 border rounded cursor-pointer transition-colors ${selectedSubmission?.id === sub.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'}`}
                                    onClick={() => setSelectedSubmission(sub)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {getUserEmail(sub)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Submitted: {new Date(sub.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                                            {sub.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Review Detail Panel */}
                <div className="border rounded-lg p-6 bg-card">
                    {selectedSubmission ? (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-2">Review Target</h2>
                                <p className="text-sm text-muted-foreground">User ID: {selectedSubmission.user_id}</p>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="p-3 bg-muted rounded">
                                        <div className="text-xs text-muted-foreground">NID Number</div>
                                        <div className="font-mono">{selectedSubmission.nid_number}</div>
                                    </div>
                                    <div className="p-3 bg-muted rounded">
                                        <div className="text-xs text-muted-foreground">Date of Birth</div>
                                        <div>{selectedSubmission.date_of_birth}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold border-b pb-2">Documents</h3>

                                <div className="space-y-2">
                                    <span className="text-sm text-bold">NID Front</span>
                                    <img src={getImageUrl(selectedSubmission.nid_front_url)} alt="NID Front" className="w-full max-w-[400px] border rounded object-contain bg-black/5" />
                                </div>

                                <div className="space-y-2">
                                    <span className="text-sm text-bold">NID Back</span>
                                    <img src={getImageUrl(selectedSubmission.nid_back_url)} alt="NID Back" className="w-full max-w-[400px] border rounded object-contain bg-black/5" />
                                </div>

                                <div className="space-y-2">
                                    <span className="text-sm text-bold">Selfie Match</span>
                                    <img src={getImageUrl(selectedSubmission.selfie_url)} alt="Selfie" className="w-full max-w-[400px] border rounded object-contain bg-black/5" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t">
                                <Button
                                    className="w-full"
                                    onClick={() => handleApprove(selectedSubmission.id)}
                                    disabled={processingId === selectedSubmission.id}
                                >
                                    {processingId === selectedSubmission.id ? 'Processing...' : 'Approve and Verify'}
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleReject(selectedSubmission.id, 'Documents unclear')}
                                    disabled={processingId === selectedSubmission.id}
                                >
                                    {processingId === selectedSubmission.id ? 'Processing...' : 'Reject (Unclear)'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Select a submission from the list to review documents.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
