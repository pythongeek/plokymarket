'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Shield,
    User,
    FileText,
    Camera,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Clock,
    XCircle,
    ChevronRight,
    ChevronLeft,
    Upload,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/use-toast';

// Step definitions with bilingual labels
const STEPS = [
    { id: 'personal', icon: User, label: 'ব্যক্তিগত তথ্য / Personal Info' },
    { id: 'document', icon: FileText, label: 'পরিচয়পত্র / ID Document' },
    { id: 'selfie', icon: Camera, label: 'সেলফি / Selfie' },
    { id: 'address', icon: MapPin, label: 'ঠিকানা / Address' },
    { id: 'review', icon: CheckCircle2, label: 'পর্যালোচনা / Review' },
];

const ID_TYPES = [
    { value: 'national_id', label: 'জাতীয় পরিচয়পত্র / National ID (NID)' },
    { value: 'passport', label: 'পাসপোর্ট / Passport' },
    { value: 'driving_license', label: 'ড্রাইভিং লাইসেন্স / Driving License' },
];

const STATUS_CONFIG = {
    unverified: { label: 'অযাচাইকৃত / Unverified', color: 'text-muted-foreground', bg: 'bg-muted', icon: AlertCircle },
    pending: { label: 'অপেক্ষমান / Pending Review', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: Clock },
    verified: { label: 'যাচাইকৃত / Verified', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', icon: CheckCircle2 },
    rejected: { label: 'প্রত্যাখ্যাত / Rejected', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', icon: XCircle },
};

interface KycFormData {
    full_name: string;
    date_of_birth: string;
    nationality: string;
    phone_number: string;
    id_type: string;
    id_number: string;
    id_expiry: string;
    id_document_front_url: string;
    id_document_back_url: string;
    selfie_url: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
    proof_of_address_url: string;
}

export default function KycPage() {
    const router = useRouter();
    const { isAuthenticated } = useStore();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [kycStatus, setKycStatus] = useState<string>('unverified');
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [formData, setFormData] = useState<KycFormData>({
        full_name: '',
        date_of_birth: '',
        nationality: 'Bangladesh',
        phone_number: '',
        id_type: '',
        id_number: '',
        id_expiry: '',
        id_document_front_url: '',
        id_document_back_url: '',
        selfie_url: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'Bangladesh',
        proof_of_address_url: '',
    });
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof KycFormData) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'File too large. Max 5MB.' });
            return;
        }

        setUploadingField(fieldName);
        try {
            // Lazy load supabase client to avoid issues during SSR if any
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('User not found');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${fieldName}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('kyc-documents')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL (or signed URL depending on bucket setting, assuming private bucket so we need signed URL)
            // But for simplicity in this demo, let's use createSignedUrl
            const { data: { signedUrl } } = await supabase.storage
                .from('kyc-documents')
                .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry for now

            if (signedUrl) {
                updateField(fieldName, signedUrl);
                toast({ title: 'Upload successful!' });
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
        } finally {
            setUploadingField(null);
        }
    };

    // Fetch existing KYC profile
    useEffect(() => {
        async function fetchKyc() {
            try {
                const res = await fetch('/api/kyc');
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile) {
                        setKycStatus(data.profile.verification_status || 'unverified');
                        setRejectionReason(data.profile.rejection_reason || '');
                        // Pre-fill if data exists
                        if (data.profile.full_name) {
                            setFormData(prev => ({
                                ...prev,
                                full_name: data.profile.full_name || '',
                                date_of_birth: data.profile.date_of_birth || '',
                                nationality: data.profile.nationality || 'বাংলাদেশ / Bangladesh',
                                phone_number: data.profile.phone_number || '',
                                id_type: data.profile.id_type || '',
                                id_number: data.profile.id_number || '',
                                id_expiry: data.profile.id_expiry || '',
                                id_document_front_url: data.profile.id_document_front_url || '',
                                id_document_back_url: data.profile.id_document_back_url || '',
                                selfie_url: data.profile.selfie_url || '',
                                address_line1: data.profile.address_line1 || '',
                                address_line2: data.profile.address_line2 || '',
                                city: data.profile.city || '',
                                state_province: data.profile.state_province || '',
                                postal_code: data.profile.postal_code || '',
                                country: data.profile.country || 'বাংলাদেশ / Bangladesh',
                                proof_of_address_url: data.profile.proof_of_address_url || '',
                            }));
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch KYC:', err);
            } finally {
                setLoading(false);
            }
        }
        if (isAuthenticated) fetchKyc();
        else setLoading(false);
    }, [isAuthenticated]);

    const updateField = (field: keyof KycFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 0: // Personal
                return !!(formData.full_name && formData.date_of_birth && formData.nationality && formData.phone_number);
            case 1: // Document
                return !!(formData.id_type && formData.id_number);
            case 2: // Selfie
                return true; // Optional for now (file upload not enforced)
            case 3: // Address
                return !!(formData.address_line1 && formData.city && formData.country);
            case 4: // Review
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) {
            toast({ variant: 'destructive', title: 'অনুগ্রহ করে সব প্রয়োজনীয় ক্ষেত্র পূরণ করুন / Please fill all required fields' });
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/kyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Submission failed');
            }

            setKycStatus('pending');
            toast({ title: 'KYC জমা দেওয়া হয়েছে! পর্যালোচনার জন্য অপেক্ষা করুন / KYC submitted! Awaiting review.' });
        } catch (err: any) {
            toast({ variant: 'destructive', title: err.message || 'জমা দিতে ব্যর্থ / Failed to submit' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">লগইন প্রয়োজন / Login Required</h2>
                <p className="text-muted-foreground mb-6">KYC সম্পন্ন করতে লগইন করুন / Login to complete KYC</p>
                <Button onClick={() => router.push('/login')}>লগইন / Login</Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // If already verified or pending, show status
    if (kycStatus === 'verified') {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/40 mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">KYC যাচাইকৃত / KYC Verified ✓</h1>
                    <p className="text-muted-foreground text-lg">
                        আপনার পরিচয় সফলভাবে যাচাই করা হয়েছে।
                        <br />
                        Your identity has been successfully verified.
                    </p>
                    <div className="mt-8 flex gap-4 justify-center">
                        <Button onClick={() => router.push('/wallet')} variant="outline">
                            ওয়ালেট দেখুন / View Wallet
                        </Button>
                        <Button onClick={() => router.push('/markets')}>
                            মার্কেটে যান / Go to Markets
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (kycStatus === 'pending') {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-950/40 mb-6 animate-pulse">
                        <Clock className="h-10 w-10 text-amber-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">KYC পর্যালোচনাধীন / KYC Under Review</h1>
                    <p className="text-muted-foreground text-lg">
                        আপনার KYC আবেদন জমা দেওয়া হয়েছে এবং পর্যালোচনাধীন রয়েছে।
                        <br />
                        Your KYC application has been submitted and is under review.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        সাধারণত ২৪-৪৮ ঘণ্টার মধ্যে পর্যালোচনা সম্পন্ন হয়।
                        <br />
                        Reviews are typically completed within 24-48 hours.
                    </p>
                </div>
            </div>
        );
    }

    // Show rejection reason if rejected
    const showRejectionBanner = kycStatus === 'rejected' && rejectionReason;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    KYC যাচাইকরণ / KYC Verification
                </h1>
                <p className="text-muted-foreground mt-1">
                    আপনার পরিচয় যাচাই করুন উত্তোলন সীমা বাড়াতে / Verify your identity to increase withdrawal limits
                </p>
            </div>

            {/* Rejection Banner */}
            {showRejectionBanner && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                    <CardContent className="p-4 flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold text-red-700 dark:text-red-400">
                                আপনার আগের আবেদন প্রত্যাখ্যাত হয়েছে / Your previous application was rejected
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                কারণ / Reason: {rejectionReason}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                অনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় জমা দিন / Please resubmit with correct information.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step Indicator */}
            <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    return (
                        <div key={step.id} className="flex items-center">
                            <button
                                onClick={() => index <= currentStep && setCurrentStep(index)}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 transition-all',
                                    isActive && 'scale-110',
                                    index > currentStep && 'opacity-40 cursor-not-allowed'
                                )}
                                disabled={index > currentStep}
                            >
                                <div className={cn(
                                    'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                                    isCompleted && 'bg-green-500 text-white',
                                    isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                                )}>
                                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                </div>
                                <span className="text-[10px] font-medium text-center leading-tight max-w-[80px]">
                                    {step.label.split(' / ')[0]}
                                </span>
                            </button>
                            {index < STEPS.length - 1 && (
                                <div className={cn(
                                    'h-0.5 w-8 mx-1 transition-colors',
                                    index < currentStep ? 'bg-green-500' : 'bg-muted'
                                )} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {(() => {
                            const Icon = STEPS[currentStep].icon;
                            return <Icon className="h-5 w-5 text-primary" />;
                        })()}
                        {STEPS[currentStep].label}
                    </CardTitle>
                    <CardDescription>
                        {currentStep === 0 && 'আপনার ব্যক্তিগত তথ্য প্রদান করুন / Provide your personal details'}
                        {currentStep === 1 && 'আপনার পরিচয়পত্রের তথ্য দিন / Enter your ID document information'}
                        {currentStep === 2 && 'পরিচয়পত্র সহ একটি সেলফি তুলুন / Take a selfie with your ID document'}
                        {currentStep === 3 && 'আপনার বর্তমান ঠিকানা দিন / Provide your current address'}
                        {currentStep === 4 && 'আপনার তথ্য পর্যালোচনা করুন / Review your submitted information'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Step 0: Personal Info */}
                    {currentStep === 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>পূর্ণ নাম / Full Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={e => updateField('full_name', e.target.value)}
                                        placeholder="আপনার পূর্ণ নাম লিখুন"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>জন্ম তারিখ / Date of Birth <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={e => updateField('date_of_birth', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>জাতীয়তা / Nationality <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.nationality}
                                        onChange={e => updateField('nationality', e.target.value)}
                                        placeholder="বাংলাদেশ"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ফোন নম্বর / Phone Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.phone_number}
                                        onChange={e => updateField('phone_number', e.target.value)}
                                        placeholder="+880 1XXXXXXXXX"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step 1: ID Document */}
                    {currentStep === 1 && (
                        <>
                            <div className="space-y-2">
                                <Label>পরিচয়পত্রের ধরন / ID Type <span className="text-red-500">*</span></Label>
                                <Select value={formData.id_type} onValueChange={v => updateField('id_type', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="পরিচয়পত্র নির্বাচন করুন / Select ID type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ID_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>পরিচয়পত্র নম্বর / ID Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.id_number}
                                        onChange={e => updateField('id_number', e.target.value)}
                                        placeholder="আপনার পরিচয়পত্র নম্বর"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>মেয়াদ উত্তীর্ণের তারিখ / Expiry Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.id_expiry}
                                        onChange={e => updateField('id_expiry', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Document Upload Placeholders */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'id_document_front_url')}
                                        disabled={uploadingField === 'id_document_front_url'}
                                    />
                                    {uploadingField === 'id_document_front_url' ? (
                                        <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
                                    ) : (
                                        <Upload className={cn("h-8 w-8 mx-auto mb-2", formData.id_document_front_url ? "text-green-500" : "text-muted-foreground")} />
                                    )}
                                    <p className="text-sm font-medium">পরিচয়পত্রের সামনের দিক / ID Front</p>
                                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG (Max 5MB)</p>
                                    {formData.id_document_front_url && (
                                        <p className="text-xs text-green-600 mt-2 font-medium">✓ আপলোড করা হয়েছে / Uploaded</p>
                                    )}
                                </div>

                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileUpload(e, 'id_document_back_url')}
                                        disabled={uploadingField === 'id_document_back_url'}
                                    />
                                    {uploadingField === 'id_document_back_url' ? (
                                        <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
                                    ) : (
                                        <Upload className={cn("h-8 w-8 mx-auto mb-2", formData.id_document_back_url ? "text-green-500" : "text-muted-foreground")} />
                                    )}
                                    <p className="text-sm font-medium">পরিচয়পত্রের পেছনের দিক / ID Back</p>
                                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG (Max 5MB)</p>
                                    {formData.id_document_back_url && (
                                        <p className="text-xs text-green-600 mt-2 font-medium">✓ আপলোড করা হয়েছে / Uploaded</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step 2: Selfie */}
                    {currentStep === 2 && (
                        <div className="text-center space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-12 hover:border-primary transition-colors relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => handleFileUpload(e, 'selfie_url')}
                                    disabled={uploadingField === 'selfie_url'}
                                />
                                {uploadingField === 'selfie_url' ? (
                                    <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
                                ) : (
                                    <Camera className={cn("h-16 w-16 mx-auto mb-4", formData.selfie_url ? "text-green-500" : "text-muted-foreground")} />
                                )}
                                <p className="font-medium">পরিচয়পত্র ধরে সেলফি তুলুন / Take a selfie holding your ID</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    আপনার মুখ ও পরিচয়পত্র পরিষ্কারভাবে দৃশ্যমান হতে হবে
                                    <br />
                                    Your face and ID must be clearly visible
                                </p>
                                <p className="text-xs text-muted-foreground mt-4">JPG, PNG (সর্বোচ্চ 5MB / max 5MB)</p>
                                {formData.selfie_url && (
                                    <p className="text-sm text-green-600 mt-4 font-medium">✓ আপলোড করা হয়েছে / Uploaded</p>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                ঐচ্ছিক — তবে দ্রুত যাচাইয়ের জন্য সুপারিশ করা হচ্ছে
                                <br />
                                Optional — but recommended for faster verification
                            </p>
                        </div>
                    )}

                    {/* Step 3: Address */}
                    {currentStep === 3 && (
                        <>
                            <div className="space-y-2">
                                <Label>ঠিকানা লাইন ১ / Address Line 1 <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.address_line1}
                                    onChange={e => updateField('address_line1', e.target.value)}
                                    placeholder="বাড়ি নং, রাস্তা, এলাকা"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ঠিকানা লাইন ২ / Address Line 2</Label>
                                <Input
                                    value={formData.address_line2}
                                    onChange={e => updateField('address_line2', e.target.value)}
                                    placeholder="অ্যাপার্টমেন্ট, ফ্লোর (ঐচ্ছিক)"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>শহর / City <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.city}
                                        onChange={e => updateField('city', e.target.value)}
                                        placeholder="ঢাকা"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>বিভাগ / Division</Label>
                                    <Input
                                        value={formData.state_province}
                                        onChange={e => updateField('state_province', e.target.value)}
                                        placeholder="ঢাকা বিভাগ"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>পোস্ট কোড / Postal Code</Label>
                                    <Input
                                        value={formData.postal_code}
                                        onChange={e => updateField('postal_code', e.target.value)}
                                        placeholder="1200"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>দেশ / Country <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.country}
                                    onChange={e => updateField('country', e.target.value)}
                                    placeholder="বাংলাদেশ"
                                />
                            </div>

                            {/* Proof of Address Upload */}
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors mt-4 relative">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => handleFileUpload(e, 'proof_of_address_url')}
                                    disabled={uploadingField === 'proof_of_address_url'}
                                />
                                {uploadingField === 'proof_of_address_url' ? (
                                    <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
                                ) : (
                                    <Upload className={cn("h-8 w-8 mx-auto mb-2", formData.proof_of_address_url ? "text-green-500" : "text-muted-foreground")} />
                                )}
                                <p className="text-sm font-medium">ঠিকানার প্রমাণপত্র / Proof of Address</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    ইউটিলিটি বিল, ব্যাংক স্টেটমেন্ট (সর্বোচ্চ 5MB)
                                    <br />
                                    Utility bill, bank statement (max 5MB)
                                </p>
                                {formData.proof_of_address_url && (
                                    <p className="text-xs text-green-600 mt-2 font-medium">✓ আপলোড করা হয়েছে / Uploaded</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Step 4: Review */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-4 space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                    ব্যক্তিগত তথ্য / Personal Info
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">নাম / Name:</div>
                                    <div className="font-medium">{formData.full_name}</div>
                                    <div className="text-muted-foreground">জন্ম তারিখ / DOB:</div>
                                    <div className="font-medium">{formData.date_of_birth}</div>
                                    <div className="text-muted-foreground">জাতীয়তা / Nationality:</div>
                                    <div className="font-medium">{formData.nationality}</div>
                                    <div className="text-muted-foreground">ফোন / Phone:</div>
                                    <div className="font-medium">{formData.phone_number}</div>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4 space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                    পরিচয়পত্র / ID Document
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">ধরন / Type:</div>
                                    <div className="font-medium">
                                        {ID_TYPES.find(t => t.value === formData.id_type)?.label || formData.id_type}
                                    </div>
                                    <div className="text-muted-foreground">নম্বর / Number:</div>
                                    <div className="font-medium">{formData.id_number}</div>
                                    {formData.id_expiry && (
                                        <>
                                            <div className="text-muted-foreground">মেয়াদ / Expiry:</div>
                                            <div className="font-medium">{formData.id_expiry}</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border p-4 space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                    ঠিকানা / Address
                                </h3>
                                <div className="text-sm">
                                    <p className="font-medium">{formData.address_line1}</p>
                                    {formData.address_line2 && <p>{formData.address_line2}</p>}
                                    <p>{formData.city}{formData.state_province ? `, ${formData.state_province}` : ''} {formData.postal_code}</p>
                                    <p>{formData.country}</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    ⚠️ জমা দেওয়ার পর তথ্য পরিবর্তন করা যাবে না। সব তথ্য সঠিক কিনা নিশ্চিত করুন।
                                    <br />
                                    ⚠️ Information cannot be changed after submission. Please ensure all details are correct.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            পেছনে / Back
                        </Button>

                        {currentStep < STEPS.length - 1 ? (
                            <Button onClick={handleNext} className="gap-2">
                                পরবর্তী / Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !validateStep(0) || !validateStep(1) || !validateStep(3)}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                {submitting ? 'জমা হচ্ছে... / Submitting...' : 'KYC জমা দিন / Submit KYC'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
