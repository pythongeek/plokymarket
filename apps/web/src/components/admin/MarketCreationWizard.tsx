'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  FileText,
  Settings,
  Wallet,
  Shield,
  Play,
  Rocket,
  Loader2,
  Save,
  X,
  ShieldOff,
  ToggleLeft,
  ToggleRight,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { marketCreationService, type MarketDraft, type MarketTemplate } from '@/lib/market-creation/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Stage components
import { TemplateSelectionStage } from './stages/TemplateSelectionStage';
import { ParameterConfigurationStage } from './stages/ParameterConfigurationStage';
import { LiquidityCommitmentStage } from './stages/LiquidityCommitmentStage';
import { LegalReviewStage } from './stages/LegalReviewStage';
import { PreviewSimulationStage } from './stages/PreviewSimulationStage';
import { DeploymentStage } from './stages/DeploymentStage';

// ============================================
// TYPES
// ============================================

interface MarketCreationWizardProps {
  draftId?: string;
  eventId?: string; // Add eventId prop
  onComplete?: (marketId: string) => void;
  onCancel?: () => void;
}

interface AdminBypass {
  liquidity: boolean;
  legal_review: boolean;
  simulation: boolean;
}

const STAGES = [
  { id: 'template_selection', name: 'টেমপ্লেট', nameEn: 'Template', icon: FileText },
  { id: 'parameter_configuration', name: 'প্যারামিটার', nameEn: 'Parameters', icon: Settings },
  { id: 'liquidity_commitment', name: 'তারল্য', nameEn: 'Liquidity', icon: Wallet },
  { id: 'legal_review', name: 'পর্যালোচনা', nameEn: 'Legal Review', icon: Shield },
  { id: 'preview_simulation', name: 'প্রিভিউ', nameEn: 'Preview', icon: Play },
  { id: 'deployment', name: 'ডিপ্লয়', nameEn: 'Deploy', icon: Rocket },
] as const;

// ============================================
// WIZARD COMPONENT
// ============================================

export function MarketCreationWizard({
  draftId: initialDraftId,
  eventId, // Destructure eventId
  onComplete,
  onCancel
}: MarketCreationWizardProps) {
  const { t } = useTranslation();
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId);
  const [draft, setDraft] = useState<MarketDraft | null>(null);
  const [templates, setTemplates] = useState<MarketTemplate[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showBypassPanel, setShowBypassPanel] = useState(false);
  const [adminBypass, setAdminBypass] = useState<AdminBypass>({
    liquidity: false,
    legal_review: false,
    simulation: false
  });

  // Load draft and templates
  useEffect(() => {
    loadData();
  }, [draftId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load templates
      const templatesData = await marketCreationService.getTemplates();
      setTemplates(templatesData);

      // Load draft if exists
      if (draftId) {
        const draftData = await marketCreationService.getDraft(draftId);
        setDraft(draftData);

        // Load saved bypass flags from draft
        setAdminBypass({
          liquidity: draftData.admin_bypass_liquidity || false,
          legal_review: draftData.admin_bypass_legal_review || false,
          simulation: draftData.admin_bypass_simulation || false
        });

        // Set current stage based on draft
        const stageIndex = STAGES.findIndex(s => s.id === draftData.current_stage);
        if (stageIndex >= 0) {
          setCurrentStageIndex(stageIndex);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new draft
  const createDraft = async (marketType: string, templateId?: string) => {
    try {
      const newDraftId = await marketCreationService.createDraft(marketType, templateId, eventId);
      setDraftId(newDraftId);
      return newDraftId;
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
    }
  };

  // Toggle admin bypass
  const toggleBypass = async (key: keyof AdminBypass) => {
    const newBypass = { ...adminBypass, [key]: !adminBypass[key] };
    setAdminBypass(newBypass);

    // Save bypass flags to draft
    if (draftId) {
      try {
        await marketCreationService.updateStage(draftId, STAGES[currentStageIndex].id, {
          admin_bypass_liquidity: newBypass.liquidity,
          admin_bypass_legal_review: newBypass.legal_review,
          admin_bypass_simulation: newBypass.simulation
        });
      } catch (error) {
        console.error('Error saving bypass:', error);
      }
    }
  };

  // Save stage progress
  const saveStage = async (stageData: Record<string, any>) => {
    if (!draftId) return false;

    setIsSaving(true);
    setErrors([]);

    try {
      const currentStage = STAGES[currentStageIndex].id;
      const nextStageIndex = currentStageIndex + 1;
      const nextStage = nextStageIndex < STAGES.length ? STAGES[nextStageIndex].id : 'completed';

      // Merge bypass flags into stage data
      const mergedData = {
        ...stageData,
        admin_bypass_liquidity: adminBypass.liquidity,
        admin_bypass_legal_review: adminBypass.legal_review,
        admin_bypass_simulation: adminBypass.simulation
      };

      console.log("[MarketCreationWizard] Submitting Stage Data Payload to API:", mergedData);

      // Validate stage data
      const validationErrors = marketCreationService.validateStage(currentStage, mergedData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return false;
      }

      // Update draft
      await marketCreationService.updateStage(draftId, nextStage, mergedData);

      // Reload draft
      const updatedDraft = await marketCreationService.getDraft(draftId);
      setDraft(updatedDraft);

      // Move to next stage
      if (nextStageIndex < STAGES.length) {
        // Check if next stage should be auto-skipped
        let skipToIndex = nextStageIndex;

        if (adminBypass.liquidity && STAGES[skipToIndex]?.id === 'liquidity_commitment') {
          // Auto-complete liquidity stage
          await marketCreationService.updateStage(draftId, STAGES[skipToIndex + 1]?.id || 'completed', {
            admin_bypass_liquidity: true,
            liquidity_amount: 0
          });
          skipToIndex++;
        }

        if (adminBypass.legal_review && STAGES[skipToIndex]?.id === 'legal_review') {
          await marketCreationService.updateStage(draftId, STAGES[skipToIndex + 1]?.id || 'completed', {
            admin_bypass_legal_review: true,
            legal_review_status: 'approved'
          });
          skipToIndex++;
        }

        if (adminBypass.simulation && STAGES[skipToIndex]?.id === 'preview_simulation') {
          await marketCreationService.updateStage(draftId, STAGES[skipToIndex + 1]?.id || 'completed', {
            admin_bypass_simulation: true
          });
          skipToIndex++;
        }

        if (skipToIndex < STAGES.length) {
          setCurrentStageIndex(skipToIndex);
        }

        // Reload draft after potential skips
        const finalDraft = await marketCreationService.getDraft(draftId);
        setDraft(finalDraft);
      }

      return true;
    } catch (error: any) {
      console.error('Error saving stage:', error);
      setErrors([error.message || 'Failed to save']);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate stages
  const goToStage = (index: number) => {
    if (index <= currentStageIndex) {
      setCurrentStageIndex(index);
    }
  };

  const goBack = () => {
    if (currentStageIndex > 0) {
      // Skip back over bypassed stages
      let prevIndex = currentStageIndex - 1;

      while (prevIndex > 0) {
        const stageId = STAGES[prevIndex].id;
        if (
          (stageId === 'liquidity_commitment' && adminBypass.liquidity) ||
          (stageId === 'legal_review' && adminBypass.legal_review) ||
          (stageId === 'preview_simulation' && adminBypass.simulation)
        ) {
          prevIndex--;
        } else {
          break;
        }
      }

      setCurrentStageIndex(prevIndex);
    }
  };

  // Get stage completion status
  const isStageCompleted = (stageId: string) => {
    return draft?.stages_completed?.includes(stageId) || false;
  };

  // Check if stage is bypassed
  const isStageBypassed = (stageId: string) => {
    if (stageId === 'liquidity_commitment') return adminBypass.liquidity;
    if (stageId === 'legal_review') return adminBypass.legal_review;
    if (stageId === 'preview_simulation') return adminBypass.simulation;
    return false;
  };

  // Render current stage
  const renderStage = () => {
    const stageId = STAGES[currentStageIndex].id;
    const commonProps = {
      draft: draft!,
      templates,
      onSave: saveStage,
      onBack: currentStageIndex > 0 ? goBack : undefined,
      isSaving,
      errors,
      adminBypass
    };

    switch (stageId) {
      case 'template_selection':
        return (
          <TemplateSelectionStage
            templates={templates}
            onCreateDraft={createDraft}
            isSaving={isSaving}
            errors={errors}
          />
        );
      case 'parameter_configuration':
        return <ParameterConfigurationStage {...commonProps} />;
      case 'liquidity_commitment':
        return <LiquidityCommitmentStage {...commonProps} />;
      case 'legal_review':
        return <LegalReviewStage {...commonProps} />;
      case 'preview_simulation':
        return <PreviewSimulationStage {...commonProps} />;
      case 'deployment':
        return (
          <DeploymentStage
            {...commonProps}
            onComplete={onComplete}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const bypassCount = Object.values(adminBypass).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t('admin.marketWizard.title', 'নতুন মার্কেট তৈরি করুন')}
          </h2>
          <p className="text-slate-400">
            {t('admin.marketWizard.subtitle', 'মানসম্পন্ন মার্কেট তৈরি করতে গাইডেড ওয়ার্কফ্লো অনুসরণ করুন')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Admin Bypass Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBypassPanel(!showBypassPanel)}
            className={cn(
              "border-slate-700 text-slate-300 hover:text-white gap-2",
              bypassCount > 0 && "border-amber-500/50 text-amber-400"
            )}
          >
            <ShieldOff className="w-4 h-4" />
            অ্যাডমিন বাইপাস
            {bypassCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {bypassCount}
              </Badge>
            )}
          </Button>

          {draftId && (
            <>
              <Badge variant="outline" className="font-mono text-xs text-slate-400 border-slate-700">
                Draft: {draftId.slice(0, 8)}...
              </Badge>
              <Button variant="ghost" size="sm" onClick={onCancel} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Admin Bypass Panel */}
      <AnimatePresence>
        {showBypassPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-amber-950/30 border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldOff className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-300">
                    অ্যাডমিন বাইপাস কন্ট্রোল (Admin Override)
                  </h3>
                </div>
                <p className="text-xs text-amber-400/70 mb-4">
                  এই টগলগুলি চালু করলে নির্দিষ্ট যাচাইকরণ ধাপগুলি এড়িয়ে যাবে। শুধুমাত্র সুপার অ্যাডমিনদের জন্য।
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Bypass Liquidity */}
                  <button
                    onClick={() => toggleBypass('liquidity')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      adminBypass.liquidity
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                        : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      <div className="text-left">
                        <p className="text-xs font-medium">তারল্য বাইপাস</p>
                        <p className="text-[10px] opacity-70">Skip $1K minimum</p>
                      </div>
                    </div>
                    {adminBypass.liquidity ? (
                      <ToggleRight className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>

                  {/* Bypass Legal Review */}
                  <button
                    onClick={() => toggleBypass('legal_review')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      adminBypass.legal_review
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                        : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <div className="text-left">
                        <p className="text-xs font-medium">আইনি পর্যালোচনা বাইপাস</p>
                        <p className="text-[10px] opacity-70">Skip legal review</p>
                      </div>
                    </div>
                    {adminBypass.legal_review ? (
                      <ToggleRight className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>

                  {/* Bypass Simulation */}
                  <button
                    onClick={() => toggleBypass('simulation')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      adminBypass.simulation
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                        : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      <div className="text-left">
                        <p className="text-xs font-medium">সিমুলেশন বাইপাস</p>
                        <p className="text-[10px] opacity-70">Skip preview test</p>
                      </div>
                    </div>
                    {adminBypass.simulation ? (
                      <ToggleRight className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = isStageCompleted(stage.id);
            const isCurrent = index === currentStageIndex;
            const isClickable = index <= currentStageIndex || isCompleted;
            const bypassed = isStageBypassed(stage.id);

            return (
              <button
                key={stage.id}
                onClick={() => isClickable && goToStage(index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all",
                  !isClickable && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10",
                    isCurrent
                      ? "bg-primary border-primary text-primary-foreground"
                      : bypassed
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-slate-800 border-slate-600 text-slate-400"
                  )}
                >
                  {bypassed ? (
                    <Zap className="w-4 h-4" />
                  ) : isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isCurrent ? "text-primary" : bypassed ? "text-amber-400" : isCompleted ? "text-emerald-400" : "text-slate-400"
                    )}
                  >
                    {stage.name}
                  </span>
                  {bypassed && (
                    <span className="text-[9px] text-amber-500">বাইপাস</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStageIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="min-h-[500px] bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                {(() => {
                  const Icon = STAGES[currentStageIndex].icon;
                  return <Icon className="w-5 h-5" />;
                })()}
                {STAGES[currentStageIndex].name}
                <span className="text-sm text-slate-500 font-normal ml-1">
                  ({STAGES[currentStageIndex].nameEn})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStage()}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Errors */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">
              {t('admin.marketWizard.validationErrors', 'নিম্নলিখিত ত্রুটিগুলি ঠিক করুন:')}
            </span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-400">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
