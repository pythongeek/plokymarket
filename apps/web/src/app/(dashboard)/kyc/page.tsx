'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Loader2, Upload, CheckCircle, AlertCircle, XCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function KYCPage() {
    const { currentUser, uploadKycDocuments } = useStore();
    const [status, setStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [docType, setDocType] = useState('NID');

    // File states
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);

    // Previews
    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [backPreview, setBackPreview] = useState<string | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

    useEffect(() => {
        checkStatus();
    }, [currentUser]);

    const checkStatus = async () => {
        if (!currentUser) return;

        // Fetch latest status
        const { data, error } = await supabase
            .from('kyc_documents')
            .select('status, rejection_reason')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setStatus(data.status as any);
            setRejectionReason(data.rejection_reason);
        } else if (currentUser.kyc_verified) {
            setStatus('verified');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'front') {
                setFrontFile(file);
                setFrontPreview(reader.result as string);
            } else if (type === 'back') {
                setBackFile(file);
                setBackPreview(reader.result as string);
            } else if (type === 'selfie') {
                setSelfieFile(file);
                setSelfiePreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!frontFile || !selfieFile) {
            toast.error('Please upload Front ID and Selfie');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('type', docType);
        formData.append('front', frontFile);
        if (backFile) formData.append('back', backFile);
        formData.append('selfie', selfieFile);

        const result = await uploadKycDocuments(formData);

        if (result.success) {
            toast.success(result.message);
            setStatus('pending');
        } else {
            toast.error(result.message);
        }
        setIsLoading(false);
    };

    if (status === 'verified') {
        return (
            <div className="container max-w-2xl py-10">
                <Card className="bg-emerald-900/10 border-emerald-900/20">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-500">Identity Verified</h2>
                        <p className="text-slate-400">
                            Your identity has been verified. You have full access to all platform features, including unlimited withdrawals.
                        </p>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-500">Tier 2 Verified</Badge>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="container max-w-2xl py-10">
                <Card className="bg-amber-900/10 border-amber-900/20">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-amber-500">Verification Pending</h2>
                        <p className="text-slate-400">
                            Your documents are currently under review. This usually takes less than 24 hours.
                            You will be notified once the review is complete.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl py-10">
            <h1 className="text-3xl font-bold mb-2">Identity Verification</h1>
            <p className="text-slate-400 mb-8">Verify your identity to unlock higher withdrawal limits and advanced features.</p>

            <div className="grid gap-6">
                {status === 'rejected' && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Verification Rejected</AlertTitle>
                        <AlertDescription>{rejectionReason || 'Please verify your documents and try again.'}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Document Upload</CardTitle>
                        <CardDescription>Please upload a clear photo of your government-issued ID.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <Label>Document Type</Label>
                                <Select value={docType} onValueChange={setDocType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NID">National ID (NID)</SelectItem>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="Driving License">Driving License</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Front Side */}
                                <div className="space-y-4">
                                    <Label>Front Side *</Label>
                                    <div
                                        className="border-2 border-dashed border-slate-700 rounded-lg p-4 h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition relative overflow-hidden group"
                                        onClick={() => document.getElementById('front-upload')?.click()}
                                    >
                                        {frontPreview ? (
                                            <img src={frontPreview} alt="Front" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <p className="text-sm text-slate-400">Click to upload front side</p>
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <Input
                                        id="front-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'front')}
                                    />
                                </div>

                                {/* Back Side */}
                                <div className="space-y-4">
                                    <Label>Back Side (Optional for Passport)</Label>
                                    <div
                                        className="border-2 border-dashed border-slate-700 rounded-lg p-4 h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition relative overflow-hidden group"
                                        onClick={() => document.getElementById('back-upload')?.click()}
                                    >
                                        {backPreview ? (
                                            <img src={backPreview} alt="Back" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <p className="text-sm text-slate-400">Click to upload back side</p>
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <Input
                                        id="back-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'back')}
                                    />
                                </div>
                            </div>

                            {/* Selfie */}
                            <div className="space-y-4">
                                <Label>Selfie with ID *</Label>
                                <div
                                    className="border-2 border-dashed border-slate-700 rounded-lg p-4 h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition relative overflow-hidden group max-w-md mx-auto"
                                    onClick={() => document.getElementById('selfie-upload')?.click()}
                                >
                                    {selfiePreview ? (
                                        <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                                <Camera className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-sm text-slate-400 text-center">
                                                Take a selfie holding your ID card.<br />
                                                Ensure your face and details are clear.
                                            </p>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <Input
                                    id="selfie-upload"
                                    type="file"
                                    accept="image/*"
                                    capture="user"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'selfie')}
                                />
                            </div>

                            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading Documents...
                                    </>
                                ) : (
                                    'Submit Verification'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
