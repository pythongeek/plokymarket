'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Save,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Circle,
    AlertCircle,
    Clock,
    Coins,
    Image as ImageIcon,
    Tag,
    HelpCircle,
    FileText,
    Calendar,
    Settings,
    ShieldCheck,
    Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useMarketStore } from '@/store/marketStore';
import { marketSchema, type MarketFormData } from '@/lib/validations/market';

// --- Helpers ---

/**
 * Unicode-aware slug generation (Bengali to Latin equivalents)
 */
const generateUnicodeAwareSlug = (text: string): string => {
    const malayalamMap: Record<string, string> = {
        'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'r', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
        'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
        'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
        'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
        'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
        'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
        'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
        'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y'
    };

    return text
        .split('')
        .map(char => malayalamMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

const checkSlugCollision = async (slug: string) => {
    const { data, error } = await supabase
        .from('events')
        .select('slug')
        .ilike('slug', `${slug}%`)
        .limit(10);

    if (error) return [];
    return data.map((d: { slug: string }) => d.slug);
};

// --- Component ---

export default function AdminMarketForm() {
    const createMarket = useMarketStore(state => state.createMarket);
    const storeError = useMarketStore(state => state.error);
    const clearStoreError = useMarketStore(state => state.clearError);

    const [sectionStates, setSectionStates] = useState({
        core: true,
        temporal: false,
        advanced: false
    });

    const [isCheckingSlug, setIsCheckingSlug] = useState(false);
    const [slugCollision, setSlugCollision] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isValid, dirtyFields },
        reset
    } = useForm<MarketFormData>({
        resolver: zodResolver(marketSchema) as any,
        mode: 'onChange',
        defaultValues: {
            name: '',
            slug: '',
            question: '',
            category: 'Sports',
            answer1: 'Yes',
            answer2: 'No',
            resolutionDelay: 60,
            initialPrice: 0.5,
            initialLiquidity: 1000,
            negRisk: false,
            description: '',
            imageUrl: '',
            startsAt: new Date().toISOString().slice(0, 16),
            endsAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
            resolverAddress: '0x0000000000000000000000000000000000000000'
        }
    });

    const nameValue = watch('name');
    const slugValue = watch('slug');

    // Auto-generate slug from name
    useEffect(() => {
        if (nameValue && !dirtyFields.slug) {
            const suggestedSlug = generateUnicodeAwareSlug(nameValue);
            setValue('slug', suggestedSlug, { shouldValidate: true });
        }
    }, [nameValue, setValue, dirtyFields.slug]);

    // Check slug collision
    useEffect(() => {
        if (slugValue) {
            const timer = setTimeout(async () => {
                setIsCheckingSlug(true);
                const existingSlugs = await checkSlugCollision(slugValue);
                if (existingSlugs.includes(slugValue)) {
                    const suffix = Math.floor(Math.random() * 1000);
                    setSlugCollision(`${slugValue}-${suffix}`);
                } else {
                    setSlugCollision(null);
                }
                setIsCheckingSlug(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [slugValue]);

    const toggleSection = (section: keyof typeof sectionStates) => {
        setSectionStates(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const onSubmit = async (data: MarketFormData) => {
        setIsSubmitting(true);
        setSubmitError(null);
        clearStoreError();

        try {
            const finalSlug = slugCollision || data.slug;
            const finalData = { ...data, slug: finalSlug };

            const result = await createMarket(finalData);

            if (result.success) {
                alert('Market created successfully!');
                reset();
                setSlugCollision(null);
            } else {
                setSubmitError(typeof result.error === 'string' ? result.error : 'Failed to create market. Please check the form.');
            }
        } catch (err: any) {
            console.error(err);
            setSubmitError(err.message || 'An unexpected error occurred during market deployment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Section completion status logic
    const coreFields = ['name', 'slug', 'question', 'category', 'answer1', 'answer2'];
    const temporalFields = ['startsAt', 'endsAt', 'resolutionDelay', 'initialPrice', 'initialLiquidity'];
    const advancedFields = ['resolverAddress']; // minimum required for advanced

    const getSectionStatus = (fields: string[]): 'error' | 'complete' | 'pending' => {
        const hasError = fields.some(f => errors[f as keyof MarketFormData]);
        const allFilled = fields.every(f => {
            const val = watch(f as keyof MarketFormData);
            return val !== undefined && val !== '';
        });

        if (hasError) return 'error';
        if (allFilled) return 'complete';
        return 'pending';
    };

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'complete') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Zap className="w-8 h-8 text-blue-500" />
                        Market Creator Form
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        High-stakes administrative interface for platform growth.
                    </p>
                </div>
                <Badge variant={isValid ? "default" : "secondary"} className="h-6">
                    {isValid ? "Ready to Deploy" : "Validation Pending"}
                </Badge>
            </div>

            {(submitError || storeError) && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Submission Error</AlertTitle>
                    <AlertDescription>
                        {submitError || storeError}
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">

                {/* SECTION A: CORE DEFINITION */}
                <Card className={cn("overflow-hidden transition-all duration-300", sectionStates.core ? "ring-2 ring-blue-500/20" : "")}>
                    <div
                        className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                        onClick={() => toggleSection('core')}
                    >
                        <div className="flex items-center gap-3">
                            <StatusIcon status={getSectionStatus(coreFields)} />
                            <div>
                                <CardTitle className="text-lg">Core Definition</CardTitle>
                                <CardDescription>Name, question, category, and outcomes</CardDescription>
                            </div>
                        </div>
                        {sectionStates.core ? <ChevronDown /> : <ChevronRight />}
                    </div>

                    <div className={cn("p-6 space-y-4", sectionStates.core ? "block" : "hidden")}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Market Name (শিরোনাম)</Label>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    placeholder="e.g. BPL 2024 Final: Comilla vs Fortune Barishal"
                                    className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Market Slug</Label>
                                <div className="relative">
                                    <Input
                                        id="slug"
                                        {...register('slug')}
                                        className={cn(
                                            errors.slug ? "border-red-500 focus-visible:ring-red-500" : "",
                                            slugCollision ? "border-amber-500 text-amber-600" : ""
                                        )}
                                    />
                                    {isCheckingSlug && <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
                                </div>
                                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                                {slugCollision && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-amber-600">Slug collision detected. Suggested: <strong>{slugCollision}</strong></p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px]"
                                            onClick={() => setValue('slug', slugCollision, { shouldValidate: true })}
                                        >
                                            Use Suggestion
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="question">Market Question</Label>
                            <Textarea
                                id="question"
                                {...register('question')}
                                placeholder="The exact question users will bet on..."
                                rows={3}
                                className={errors.question ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.question && <p className="text-xs text-red-500">{errors.question.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select onValueChange={(v) => setValue('category', v as any, { shouldValidate: true })}>
                                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Sports', 'Politics', 'Crypto', 'Economics', 'Technology', 'Entertainment', 'World Events'].map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="answer1">Outcome 1 (Yes)</Label>
                                <Input id="answer1" {...register('answer1')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="answer2">Outcome 2 (No)</Label>
                                <Input id="answer2" {...register('answer2')} />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* SECTION B: TEMPORAL & FINANCIAL */}
                <Card className={cn("overflow-hidden transition-all duration-300", sectionStates.temporal ? "ring-2 ring-emerald-500/20" : "")}>
                    <div
                        className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                        onClick={() => toggleSection('temporal')}
                    >
                        <div className="flex items-center gap-3">
                            <StatusIcon status={getSectionStatus(temporalFields)} />
                            <div>
                                <CardTitle className="text-lg">Temporal & Financial Parameters</CardTitle>
                                <CardDescription>Timing, pricing, and initial liquidity</CardDescription>
                            </div>
                        </div>
                        {sectionStates.temporal ? <ChevronDown /> : <ChevronRight />}
                    </div>

                    <div className={cn("p-6 space-y-4", sectionStates.temporal ? "block" : "hidden")}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startsAt">Start Time (UTC)</Label>
                                <div className="relative">
                                    <Input id="startsAt" type="datetime-local" {...register('startsAt')} />
                                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endsAt">Trading End Time (UTC)</Label>
                                <div className="relative">
                                    <Input id="endsAt" type="datetime-local" {...register('endsAt')} />
                                    <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="resolutionDelay">Resolution Delay (Min)</Label>
                                <Input id="resolutionDelay" type="number" {...register('resolutionDelay', { valueAsNumber: true })} />
                                <p className="text-[10px] text-muted-foreground">Buffer time before oracle resolution.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="initialPrice">Initial Price (Yes)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input id="initialPrice" type="number" step="0.01" className="pl-7" {...register('initialPrice', { valueAsNumber: true })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="initialLiquidity">Initial Liquidity</Label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="initialLiquidity" type="number" className="pl-9" {...register('initialLiquidity', { valueAsNumber: true })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* SECTION C: ADVANCED CONFIGURATION */}
                <Card className={cn("overflow-hidden transition-all duration-300", sectionStates.advanced ? "ring-2 ring-purple-500/20" : "")}>
                    <div
                        className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                        onClick={() => toggleSection('advanced')}
                    >
                        <div className="flex items-center gap-3">
                            <StatusIcon status={getSectionStatus(advancedFields)} />
                            <div>
                                <CardTitle className="text-lg">Advanced Configuration</CardTitle>
                                <CardDescription>Visuals, oracles, and risk management</CardDescription>
                            </div>
                        </div>
                        {sectionStates.advanced ? <ChevronDown /> : <ChevronRight />}
                    </div>

                    <div className={cn("p-6 space-y-4", sectionStates.advanced ? "block" : "hidden")}>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL (Visual Asset)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="imageUrl" placeholder="https://..." className="pl-9" {...register('imageUrl')} />
                                </div>
                                {watch('imageUrl') && (
                                    <div className="h-10 w-10 rounded border border-slate-200 overflow-hidden shrink-0">
                                        <img src={watch('imageUrl')} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="resolverAddress">Resolver (Oracle) Address</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-blue-500" />
                                <Input id="resolverAddress" className="pl-9 font-mono text-xs" {...register('resolverAddress')} />
                            </div>
                            {errors.resolverAddress && <p className="text-xs text-red-500">{errors.resolverAddress.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Market Description (Detailed Context)</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Include rules, resolution criteria, and secondary sources..."
                                rows={4}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Negative Risk (NegRisk)</Label>
                                <p className="text-xs text-muted-foreground">Enable specialized risk offsets for this event.</p>
                            </div>
                            <Switch
                                checked={watch('negRisk')}
                                onCheckedChange={(val) => setValue('negRisk', val, { shouldDirty: true })}
                            />
                        </div>
                    </div>
                </Card>

                {/* SUBMIT SECTION */}
                <div className="flex items-center justify-between pt-4 gap-4">
                    <Alert className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 border-none py-2 h-14">
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                        <AlertDescription className="text-xs text-slate-500 flex items-center gap-2">
                            {isValid ? (
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> All systems go. Market is ready for insertion.
                                </span>
                            ) : (
                                "Ensure all required fields in the highlighted sections are correctly filled."
                            )}
                        </AlertDescription>
                    </Alert>

                    <Button
                        type="submit"
                        size="lg"
                        disabled={!isValid || isSubmitting || isCheckingSlug}
                        className="min-w-[200px] h-14 shadow-lg shadow-blue-500/20"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save className="w-5 h-5" />
                                Deploy Market
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
