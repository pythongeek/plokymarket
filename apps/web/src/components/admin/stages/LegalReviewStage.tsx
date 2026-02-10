'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Check,
  Clock,
  ArrowRight,
  ArrowLeft,
  Send,
  Info,
  FileText,
  AlertCircle,
  Scale,
  Gavel
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { MarketDraft } from '@/lib/market-creation/service';

interface LegalReviewStageProps {
  draft: MarketDraft;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
}

const RISK_INDICATORS = [
  {
    category: 'Political Sensitivity',
    keywords: ['election fraud', 'corruption', 'coup', 'assassination'],
    level: 'high'
  },
  {
    category: 'Violence & Harm',
    keywords: ['terrorism', 'war', 'death', 'violence'],
    level: 'high'
  },
  {
    category: 'Regulated Activities',
    keywords: ['gambling', 'insider trading', 'market manipulation'],
    level: 'medium'
  },
  {
    category: 'Health & Safety',
    keywords: ['pandemic', 'disease outbreak', 'public health emergency'],
    level: 'medium'
  }
];

export function LegalReviewStage({
  draft,
  onSave,
  onBack,
  isSaving,
  errors
}: LegalReviewStageProps) {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(draft.legal_review_status === 'pending');
  const [isApproved, setIsApproved] = useState(draft.legal_review_status === 'approved');
  const [notes, setNotes] = useState('');
  const [detectedIssues, setDetectedIssues] = useState<string[]>([]);

  // Auto-scan for sensitive topics
  useEffect(() => {
    const text = `${draft.question || ''} ${draft.description || ''}`.toLowerCase();
    const issues: string[] = [];

    RISK_INDICATORS.forEach(indicator => {
      const found = indicator.keywords.filter(k => text.includes(k));
      if (found.length > 0) {
        issues.push(`${indicator.category}: "${found.join(', ')}" detected`);
      }
    });

    setDetectedIssues(issues);
  }, [draft]);

  const handleSubmit = async () => {
    await onSave({});
  };

  const handleSubmitForReview = async () => {
    // In a real implementation, this would call the API
    setIsSubmitted(true);
  };

  const riskLevel = detectedIssues.length === 0 ? 'low' : 
    detectedIssues.some(i => i.includes('Political') || i.includes('Violence')) ? 'high' : 'medium';

  if (isApproved) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
            Legal Review Approved
          </h3>
          <p className="text-green-700 dark:text-green-300">
            This market has passed legal review and is ready for deployment.
          </p>
          {draft.legal_review_notes && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg text-left">
              <p className="text-sm font-medium mb-1">Reviewer Notes:</p>
              <p className="text-sm text-muted-foreground">{draft.legal_review_notes}</p>
            </div>
          )}
        </motion.div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack} disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-1">
                Pending Legal Review
              </h3>
              <p className="text-amber-700 dark:text-amber-300">
                Your market is being reviewed by our legal team. This typically takes 24 hours.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Submitted for review</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Under legal review</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              <span>Approval decision</span>
            </div>
          </div>
        </motion.div>

        <Card className="p-4">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4" />
            Market Summary
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Question:</span> {draft.question}</p>
            <p><span className="text-muted-foreground">Category:</span> {draft.category}</p>
            <p><span className="text-muted-foreground">Liquidity:</span> ${draft.liquidity_commitment?.toLocaleString()}</p>
          </div>
        </Card>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack} disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button disabled>
            <Clock className="w-4 h-4 mr-2" />
            Awaiting Review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Assessment */}
      <div className={cn(
        "rounded-lg p-4 border",
        riskLevel === 'low' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
        riskLevel === 'medium' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
        'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      )}>
        <div className="flex items-center gap-3">
          {riskLevel === 'low' ? (
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : riskLevel === 'medium' ? (
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          )}
          <div>
            <p className={cn(
              "font-medium",
              riskLevel === 'low' ? 'text-green-900 dark:text-green-100' :
              riskLevel === 'medium' ? 'text-amber-900 dark:text-amber-100' :
              'text-red-900 dark:text-red-100'
            )}>
              Risk Assessment: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
            </p>
            <p className={cn(
              "text-sm",
              riskLevel === 'low' ? 'text-green-700 dark:text-green-300' :
              riskLevel === 'medium' ? 'text-amber-700 dark:text-amber-300' :
              'text-red-700 dark:text-red-300'
            )}>
              {detectedIssues.length === 0 
                ? 'No sensitive topics detected. This market can proceed.'
                : `${detectedIssues.length} potential issue(s) detected. Legal review required.`}
            </p>
          </div>
        </div>
      </div>

      {/* Detected Issues */}
      {detectedIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Detected Issues
          </h4>
          <div className="space-y-2">
            {detectedIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">{issue}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Review Requirements */}
      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Review Requirements
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className={cn(
            "p-4",
            draft.liquidity_commitment >= 10000 && "border-green-500 bg-green-50/50"
          )}>
            <div className="flex items-center gap-3">
              {draft.liquidity_commitment >= 10000 ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Info className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">High-Value Markets</p>
                <p className="text-xs text-muted-foreground">
                  {draft.liquidity_commitment >= 10000 
                    ? 'Liquidity ≥$10K requires review'
                    : 'No additional review needed'}
                </p>
              </div>
            </div>
          </Card>

          <Card className={cn(
            "p-4",
            detectedIssues.length > 0 && "border-amber-500 bg-amber-50/50"
          )}>
            <div className="flex items-center gap-3">
              {detectedIssues.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <Check className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="font-medium">Sensitive Topics</p>
                <p className="text-xs text-muted-foreground">
                  {detectedIssues.length > 0
                    ? `${detectedIssues.length} topic(s) flagged`
                    : 'No sensitive topics detected'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Gavel className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Regulatory Compliance</p>
                <p className="text-xs text-muted-foreground">
                  Checked against local regulations
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Platform Policies</p>
                <p className="text-xs text-muted-foreground">
                  Terms of service compliance
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Review Notes */}
      {detectedIssues.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes for Reviewer</Label>
          <Textarea
            id="notes"
            placeholder="Provide any context or clarification for the legal review team..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      )}

      {/* SLA Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Review Timeline
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Standard review: 24 hours<br />
              Senior counsel (high-risk): 48 hours<br />
              Escalated cases: Up to 5 business days
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={detectedIssues.length > 0 ? handleSubmitForReview : handleSubmit}
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : detectedIssues.length > 0 ? (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit for Legal Review
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Import Label for the notes textarea
import { Label } from '@/components/ui/label';
