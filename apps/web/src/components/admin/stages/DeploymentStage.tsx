'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Check,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Shield,
  Wallet,
  Play,
  Zap,
  Eye,
  ShieldOff,
  ExternalLink,
  Cpu,
  Clock,
  DollarSign,
  LinkIcon,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { marketCreationService, type MarketDraft } from '@/lib/market-creation/service';

interface DeploymentStageProps {
  draft: MarketDraft;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
  adminBypass?: { liquidity: boolean; legal_review: boolean; simulation: boolean };
  onComplete?: (marketId: string) => void;
}

type DeployStatus = 'idle' | 'validating' | 'creating' | 'indexing' | 'complete' | 'error';

const DEPLOY_STEPS = [
  { id: 'EVENT_CREATED', label: 'ইভেন্ট সিঙ্ক', labelEn: 'Event Sync', icon: Globe },
  { id: 'MARKET_DEPLOYED', label: 'মার্কেট তৈরি', labelEn: 'Creating Market', icon: Shield },
  { id: 'LIQUIDITY_ADDED', label: 'প্রাথমিক তারল্য', labelEn: 'Adding Liquidity', icon: Wallet },
  { id: 'complete', label: 'সম্পন্ন', labelEn: 'Complete', icon: Check }
];

export function DeploymentStage({
  draft,
  onSave,
  onBack,
  isSaving,
  errors,
  adminBypass,
  onComplete
}: DeploymentStageProps) {
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployedMarketId, setDeployedMarketId] = useState<string | null>(
    draft?.deployed_market_id || null
  );
  const [deployError, setDeployError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const handleDeploy = async () => {
    setDeployStatus('creating');
    setDeployError(null);
    setCurrentStep(0);

    try {
      // Execute the "One Shot" unified flow via single API call to the service layer
      const result = await marketCreationService.deployMarket(draft.id, {
        verification_method: draft.verification_method,
        required_confirmations: draft.required_confirmations,
        admin_bypasses: adminBypass
      });

      // The backend fulfilled the steps atomically. We process the returned interface array to animate the UI.
      const returnedSteps = result.steps || [];

      for (let i = 0; i < returnedSteps.length; i++) {
        const step = returnedSteps[i];
        if (step.status === 'SUCCESS' || step.status === 'PENDING') {
          // Find correlating index in DEPLOY_STEPS
          const stepIndex = DEPLOY_STEPS.findIndex(s => s.id === step.stage);
          if (stepIndex >= 0) {
            setCurrentStep(stepIndex);

            // Artificial delay for UX so user can see progress stages visually
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } else if (step.status === 'FAILED') {
          throw new Error(step.error || `Failed at stage ${step.stage}`);
        }
      }

      setCurrentStep(DEPLOY_STEPS.length - 1); // target complete step
      setDeployStatus('complete');
      setDeployedMarketId(result.market_id);

    } catch (error: any) {
      console.error('Deploy error:', error);
      setDeployStatus('error');
      setDeployError(error.message || 'ডিপ্লয়মেন্ট ব্যর্থ হয়েছে');
    }
  };

  const bypassList = [];
  if (adminBypass?.liquidity) bypassList.push('তারল্য (Liquidity)');
  if (adminBypass?.legal_review) bypassList.push('আইনি পর্যালোচনা (Legal Review)');
  if (adminBypass?.simulation) bypassList.push('সিমুলেশন (Simulation)');

  return (
    <div className="space-y-6">
      {/* Admin Bypass Summary */}
      {bypassList.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldOff className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">বাইপাসকৃত ধাপসমূহ</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {bypassList.map((item, i) => (
              <Badge key={i} className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                <Zap className="w-3 h-3 mr-1" />
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Final Summary */}
      <Card className="bg-slate-900/50 border-slate-700/50 p-4 space-y-4">
        <h4 className="text-sm font-semibold text-white">চূড়ান্ত সারসংক্ষেপ (Final Summary)</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Question */}
          <div className="col-span-2 p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">প্রশ্ন (Question)</p>
            <p className="text-white font-medium">{draft?.question || 'N/A'}</p>
          </div>

          {/* Category */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">ক্যাটাগরি</p>
            <p className="text-white">{draft?.category || 'N/A'}</p>
          </div>

          {/* Market Type */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">মার্কেট ধরন</p>
            <p className="text-white capitalize">{draft?.market_type || 'N/A'}</p>
          </div>

          {/* Deadline */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <p className="text-xs text-slate-500">সমাধানের সময়সীমা</p>
            </div>
            <p className="text-white text-sm">
              {draft?.resolution_deadline
                ? new Date(draft.resolution_deadline).toLocaleDateString('bn-BD', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })
                : 'N/A'
              }
            </p>
          </div>

          {/* Liquidity */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-slate-500" />
              <p className="text-xs text-slate-500">তারল্য</p>
            </div>
            <p className="text-white">
              {adminBypass?.liquidity
                ? <span className="text-amber-400">বাইপাসকৃত</span>
                : `$${(draft?.liquidity_amount || draft?.liquidity_commitment || 0).toLocaleString()}`
              }
            </p>
          </div>

          {/* Oracle */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Cpu className="w-3 h-3 text-slate-500" />
              <p className="text-xs text-slate-500">ওরাকল পদ্ধতি</p>
            </div>
            <p className="text-white">{draft?.oracle_type || 'MANUAL'}</p>
          </div>

          {/* Confirmations */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3 h-3 text-slate-500" />
              <p className="text-xs text-slate-500">নিশ্চিতকরণ</p>
            </div>
            <p className="text-white">{draft?.required_confirmations || 1} / 5</p>
          </div>

          {/* Fee */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-slate-500">ট্রেডিং ফি</p>
            </div>
            <p className="text-white">{draft?.trading_fee_percent || 2.0}%</p>
          </div>
        </div>

        {/* Resolution Source */}
        {draft?.resolution_source && (
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <LinkIcon className="w-3 h-3 text-slate-500" />
              <p className="text-xs text-slate-500">সমাধানের উৎস</p>
            </div>
            <p className="text-white text-sm">{draft.resolution_source}</p>
            {draft.resolution_source_url && (
              <a href={draft.resolution_source_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1">
                {draft.resolution_source_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </Card>

      {/* Deployment Progress */}
      {deployStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="space-y-3">
            {DEPLOY_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep && deployStatus !== 'complete' && deployStatus !== 'error';
              const isPending = index > currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    isComplete ? "bg-green-900/20 border-green-800/50" :
                      isCurrent ? "bg-blue-900/20 border-blue-800/50" :
                        "bg-slate-900/30 border-slate-800/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isComplete ? "bg-green-500/20 text-green-400" :
                      isCurrent ? "bg-blue-500/20 text-blue-400" :
                        "bg-slate-800 text-slate-500"
                  )}>
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      isComplete ? "text-green-300" :
                        isCurrent ? "text-blue-300" :
                          "text-slate-500"
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-500">{step.labelEn}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Success */}
      {deployStatus === 'complete' && deployedMarketId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-900/20 border border-green-800/50 rounded-lg p-6 text-center"
        >
          <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <Rocket className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            🎉 মার্কেট সফলভাবে ডিপ্লয় হয়েছে!
          </h3>
          <p className="text-sm text-green-300 mb-4">
            আপনার মার্কেট এখন লাইভ এবং ট্রেডিংয়ের জন্য প্রস্তুত।
          </p>
          <div className="flex flex-col items-center gap-2">
            <Badge className="bg-slate-800 text-slate-300 border-slate-700 font-mono text-xs">
              Market ID: {deployedMarketId}
            </Badge>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => window.open(`/markets/${deployedMarketId}`, '_blank')}
                className="border-green-500/40 text-green-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                মার্কেট দেখুন
              </Button>
              {onComplete && (
                <Button onClick={() => onComplete(deployedMarketId)} className="bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 mr-2" />
                  সম্পন্ন
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {deployStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-900/20 border border-red-800/50 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-300">ডিপ্লয়মেন্ট ব্যর্থ</span>
          </div>
          <p className="text-xs text-red-400/70 mb-3">{deployError}</p>
          <Button
            variant="outline"
            onClick={handleDeploy}
            className="border-red-500/40 text-red-300"
          >
            পুনরায় চেষ্টা করুন
          </Button>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-slate-800">
        {onBack && deployStatus === 'idle' && (
          <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            পিছনে
          </Button>
        )}
        {deployStatus === 'idle' && (
          <Button
            onClick={handleDeploy}
            disabled={isSaving}
            className="ml-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            size="lg"
          >
            <Rocket className="w-5 h-5 mr-2" />
            প্রোডাকশনে ডিপ্লয় করুন
          </Button>
        )}
      </div>
    </div>
  );
}
