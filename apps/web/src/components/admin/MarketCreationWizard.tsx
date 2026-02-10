'use client';

import { useState, useEffect, useCallback } from 'react';
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
  X
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
  onComplete?: (marketId: string) => void;
  onCancel?: () => void;
}

const STAGES = [
  { id: 'template_selection', name: 'Template', icon: FileText },
  { id: 'parameter_configuration', name: 'Parameters', icon: Settings },
  { id: 'liquidity_commitment', name: 'Liquidity', icon: Wallet },
  { id: 'legal_review', name: 'Legal Review', icon: Shield },
  { id: 'preview_simulation', name: 'Preview', icon: Play },
  { id: 'deployment', name: 'Deploy', icon: Rocket },
] as const;

// ============================================
// WIZARD COMPONENT
// ============================================

export function MarketCreationWizard({ 
  draftId: initialDraftId, 
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
      const newDraftId = await marketCreationService.createDraft(marketType, templateId);
      setDraftId(newDraftId);
      return newDraftId;
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
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

      // Validate stage data
      const validationErrors = marketCreationService.validateStage(currentStage, stageData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return false;
      }

      // Update draft
      await marketCreationService.updateStage(draftId, nextStage, stageData);

      // Reload draft
      const updatedDraft = await marketCreationService.getDraft(draftId);
      setDraft(updatedDraft);

      // Move to next stage
      if (nextStageIndex < STAGES.length) {
        setCurrentStageIndex(nextStageIndex);
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
    // Only allow navigating to completed stages or current stage
    if (index <= currentStageIndex) {
      setCurrentStageIndex(index);
    }
  };

  const goBack = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex(currentStageIndex - 1);
    }
  };

  // Get stage completion status
  const isStageCompleted = (stageId: string) => {
    return draft?.stages_completed?.includes(stageId) || false;
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
      errors
    };

    switch (stageId) {
      case 'template_selection':
        return (
          <TemplateSelectionStage
            {...commonProps}
            draft={undefined}
            onCreateDraft={createDraft}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t('admin.marketWizard.title', 'Create New Market')}
          </h2>
          <p className="text-muted-foreground">
            {t('admin.marketWizard.subtitle', 'Follow the guided workflow to create a quality market')}
          </p>
        </div>
        {draftId && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Draft: {draftId.slice(0, 8)}...
            </Badge>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
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
                      : isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-background border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {stage.name}
                </span>
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
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = STAGES[currentStageIndex].icon;
                  return <Icon className="w-5 h-5" />;
                })()}
                {STAGES[currentStageIndex].name}
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
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">
              {t('admin.marketWizard.validationErrors', 'Please fix the following errors:')}
            </span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
