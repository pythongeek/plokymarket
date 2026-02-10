'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  ArrowLeft,
  Shield,
  FileText,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { MarketDraft } from '@/lib/market-creation/service';

interface DeploymentStageProps {
  draft: MarketDraft;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
  onComplete?: (marketId: string) => void;
}

const DEPLOYMENT_STEPS = [
  { id: 'validate', name: 'Validating', description: 'Checking all parameters' },
  { id: 'contract', name: 'Creating Contract', description: 'Deploying smart contract' },
  { id: 'liquidity', name: 'Adding Liquidity', description: 'Funding the market' },
  { id: 'index', name: 'Indexing', description: 'Adding to platform' },
  { id: 'complete', name: 'Complete', description: 'Market is live' },
];

export function DeploymentStage({
  draft,
  onSave,
  onBack,
  isSaving,
  errors,
  onComplete
}: DeploymentStageProps) {
  const { t } = useTranslation();
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deployedMarketId, setDeployedMarketId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentStatus('deploying');

    // Simulate deployment steps
    for (let i = 0; i < DEPLOYMENT_STEPS.length - 1; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Complete deployment
    setCurrentStep(DEPLOYMENT_STEPS.length - 1);
    const mockMarketId = 'market_' + Math.random().toString(36).substr(2, 9);
    const mockTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    setDeployedMarketId(mockMarketId);
    setTxHash(mockTxHash);
    setDeploymentStatus('success');
    setIsDeploying(false);

    // Call onComplete callback
    if (onComplete) {
      onComplete(mockMarketId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (deploymentStatus === 'success' && deployedMarketId) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Market Deployed!</h3>
          <p className="text-muted-foreground">
            Your market is now live and ready for trading.
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Deployment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Market ID</p>
                <p className="font-mono font-medium">{deployedMarketId}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(deployedMarketId)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Transaction Hash</p>
                <p className="font-mono font-medium truncate">{txHash}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(txHash)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-muted-foreground">Question</p>
                <p className="text-sm font-medium line-clamp-2">{draft.question}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-sm font-medium">{draft.category}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <a href={`/markets/${deployedMarketId}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Market
            </a>
          </Button>
          <Button className="flex-1" asChild>
            <a href="/admin">
              <TrendingUp className="w-4 h-4 mr-2" />
              Back to Admin
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (deploymentStatus === 'deploying') {
    return (
      <div className="space-y-8 py-8">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary mx-auto mb-4"
          />
          <h3 className="text-xl font-bold mb-2">Deploying Market...</h3>
          <p className="text-muted-foreground">
            Please do not close this window
          </p>
        </div>

        <div className="space-y-4">
          {DEPLOYMENT_STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isPending = index > currentStep;

            return (
              <motion.div
                key={step.id}
                initial={false}
                animate={{
                  opacity: isPending ? 0.5 : 1,
                  x: isActive ? 10 : 0
                }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg transition-colors",
                  isActive && "bg-primary/5 border border-primary/20",
                  isCompleted && "bg-green-50 dark:bg-green-900/20"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isCompleted ? "bg-green-500" :
                  isActive ? "bg-primary" :
                  "bg-gray-200 dark:bg-gray-700"
                )}>
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    isActive && "text-primary"
                  )}>
                    {step.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {isActive && (
                  <Badge variant="default" className="animate-pulse">
                    In Progress
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>

        <Progress value={(currentStep / (DEPLOYMENT_STEPS.length - 1)) * 100} className="h-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pre-deployment Checklist */}
      <div className="space-y-4">
        <h3 className="font-medium">Pre-deployment Checklist</h3>
        
        <div className="space-y-3">
          <ChecklistItem 
            icon={FileText}
            title="Parameters Configured"
            description={draft.question || 'Not set'}
            checked={!!draft.question}
          />
          <ChecklistItem 
            icon={Wallet}
            title="Liquidity Committed"
            description={`$${draft.liquidity_commitment?.toLocaleString()} USDC`}
            checked={draft.liquidity_deposited}
          />
          <ChecklistItem 
            icon={Shield}
            title="Legal Review"
            description={draft.legal_review_status === 'approved' ? 'Approved' : 'Pending'}
            checked={draft.legal_review_status === 'approved'}
          />
        </div>
      </div>

      {/* Deployment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Market Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{draft.market_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{draft.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Oracle</p>
              <p className="font-medium">{draft.oracle_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Liquidity</p>
              <p className="font-medium">${draft.liquidity_commitment?.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Important Notice
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Once deployed, market parameters cannot be changed. The market will be 
              immediately visible to all users. Ensure all details are correct before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled={isDeploying}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleDeploy} 
          disabled={isDeploying || !draft.liquidity_deposited}
          size="lg"
          className="bg-gradient-to-r from-primary to-purple-600"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Deploy Market
        </Button>
      </div>
    </div>
  );
}

// Checklist Item Component
function ChecklistItem({ 
  icon: Icon, 
  title, 
  description, 
  checked 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  checked: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      checked 
        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
        : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      )}>
        {checked ? (
          <Check className="w-4 h-4 text-white" />
        ) : (
          <Icon className="w-4 h-4 text-white" />
        )}
      </div>
      <div className="flex-1">
        <p className={cn("font-medium", checked && "text-green-900 dark:text-green-100")}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {description}
        </p>
      </div>
      {checked && (
        <Badge variant="default" className="bg-green-500">Ready</Badge>
      )}
    </div>
  );
}
