'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle, Eye, ZoomIn, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

interface KycDocument {
    id: string;
    user_id: string;
    document_type: string;
    document_front_url: string;
    document_back_url: string | null;
    selfie_url: string | null;
    status: string;
    created_at: string;
    user_profiles: {
        email: string;
        full_name: string;
    };
}

export default function AdminKycPage() {
    const { currentUser } = useStore();
    const [documents, setDocuments] = useState<KycDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('kyc_documents')
            .select(`
                *,
                user_profiles:user_id (email, full_name)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            toast.error('Failed to load documents');
        } else {
            setDocuments(data as any || []);
        }
        setIsLoading(false);
    };

    const handleReview = async (status: 'approved' | 'rejected') => {
        if (!selectedDoc || !currentUser) return;

        if (status === 'rejected' && !rejectReason) {
            toast.error('Please provide a rejection reason');
            return;
        }

        setIsReviewing(true);
        try {
            const { error } = await supabase.rpc('review_kyc_document', {
                p_admin_id: currentUser.id,
                p_document_id: selectedDoc.id,
                p_status: status,
                p_reason: status === 'rejected' ? rejectReason : null
            });

            if (error) throw error;

            toast.success(`Document ${status} successfully`);
            setSelectedDoc(null);
            setRejectReason('');
            fetchDocuments(); // Refresh list
        } catch (error: any) {
            console.error('Review Error:', error);
            toast.error(error.message || 'Review failed');
        }
        setIsReviewing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">KYC Verification</h2>
                    <p className="text-muted-foreground">Manage user identity verifications.</p>
                </div>
                <Button onClick={fetchDocuments} variant="outline" size="sm">
                    <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests ({documents.length})</CardTitle>
                    <CardDescription>Review and approve user documents.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No pending documents found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-900/50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                            {doc.user_profiles?.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold">{doc.user_profiles?.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{doc.user_profiles?.email}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="outline">{doc.document_type}</Badge>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(doc.created_at), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={() => setSelectedDoc(doc)}>Review</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Review Modal */}
            <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
                <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Review Document</DialogTitle>
                        <DialogDescription>
                            Verify details match the provided information.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDoc && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold mb-2">User Details</h4>
                                    <p className="text-sm">Name: {selectedDoc.user_profiles?.full_name}</p>
                                    <p className="text-sm">Email: {selectedDoc.user_profiles?.email}</p>
                                    <p className="text-sm">Document: {selectedDoc.document_type}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <h4 className="font-bold mb-2">Review Actions</h4>
                                    <div className="space-y-3">
                                        <Button
                                            className="w-full bg-emerald-600 hover:bg-emerald-500"
                                            onClick={() => handleReview('approved')}
                                            disabled={isReviewing}
                                        >
                                            {isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                            Approve Verification
                                        </Button>

                                        <div className="pt-2">
                                            <input
                                                type="text"
                                                placeholder="Rejection reason..."
                                                className="w-full p-2 text-sm bg-slate-900 border rounded mb-2"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                            />
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => handleReview('rejected')}
                                                disabled={isReviewing}
                                            >
                                                {isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                                Reject Verification
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        Front Side <ZoomIn className="h-4 w-4 text-slate-500" />
                                    </h4>
                                    <div className="border rounded-lg overflow-hidden bg-black/50">
                                        <Zoom>
                                            <img src={selectedDoc.document_front_url} alt="Front" className="w-full object-contain max-h-64" />
                                        </Zoom>
                                    </div>
                                </div>

                                {selectedDoc.document_back_url && (
                                    <div>
                                        <h4 className="font-bold mb-2 flex items-center gap-2">
                                            Back Side <ZoomIn className="h-4 w-4 text-slate-500" />
                                        </h4>
                                        <div className="border rounded-lg overflow-hidden bg-black/50">
                                            <Zoom>
                                                <img src={selectedDoc.document_back_url} alt="Back" className="w-full object-contain max-h-64" />
                                            </Zoom>
                                        </div>
                                    </div>
                                )}

                                {selectedDoc.selfie_url && (
                                    <div>
                                        <h4 className="font-bold mb-2 flex items-center gap-2">
                                            Selfie <ZoomIn className="h-4 w-4 text-slate-500" />
                                        </h4>
                                        <div className="border rounded-lg overflow-hidden bg-black/50">
                                            <Zoom>
                                                <img src={selectedDoc.selfie_url} alt="Selfie" className="w-full object-contain max-h-64" />
                                            </Zoom>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
