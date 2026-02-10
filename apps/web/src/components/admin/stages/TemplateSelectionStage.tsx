'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Binary,
  List,
  Scale,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MarketTemplate } from '@/lib/market-creation/service';

interface TemplateSelectionStageProps {
  templates: MarketTemplate[];
  onCreateDraft: (marketType: string, templateId?: string) => Promise<string>;
  isSaving: boolean;
  errors: string[];
}

const MARKET_TYPES = [
  {
    id: 'binary',
    name: 'Binary (Yes/No)',
    description: 'Simple yes or no outcome prediction',
    icon: Binary,
    examples: ['Will it rain tomorrow?', 'Will BTC hit $100k?'],
    color: 'bg-blue-500'
  },
  {
    id: 'categorical',
    name: 'Categorical',
    description: 'Multiple possible outcomes',
    icon: List,
    examples: ['Who will win the election?', 'Which team will score first?'],
    color: 'bg-purple-500'
  },
  {
    id: 'scalar',
    name: 'Scalar (Range)',
    description: 'Predict a value within a range',
    icon: Scale,
    examples: ['What will BTC price be?', 'How many goals will be scored?'],
    color: 'bg-green-500'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Build your own market type',
    icon: Sparkles,
    examples: ['Complex multi-outcome scenarios', 'Conditional predictions'],
    color: 'bg-orange-500'
  }
];

export function TemplateSelectionStage({
  templates,
  onCreateDraft,
  isSaving,
  errors
}: TemplateSelectionStageProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedType) return;
    
    await onCreateDraft(
      selectedType,
      selectedTemplate || undefined
    );
  };

  const filteredTemplates = templates.filter(t => 
    selectedType && t.market_type === selectedType
  );

  return (
    <div className="space-y-6">
      {/* Market Type Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4">
          {t('admin.marketWizard.selectMarketType', 'Select Market Type')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MARKET_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedType(type.id);
                  setSelectedTemplate(null);
                }}
                className={cn(
                  "relative p-6 rounded-xl border-2 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                )}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", type.color)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h4 className="font-semibold text-lg mb-1">{type.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {type.description}
                </p>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('admin.marketWizard.examples', 'Examples:')}
                  </p>
                  {type.examples.map((example, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {example}
                    </p>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Template Selection */}
      {selectedType && filteredTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-medium">
            {t('admin.marketWizard.chooseTemplate', 'Choose a Template (Optional)')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedTemplate(null)}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                selectedTemplate === null
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Start from Scratch</p>
                  <p className="text-xs text-muted-foreground">
                    Build your market manually
                  </p>
                </div>
              </div>
            </button>

            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  selectedTemplate === template.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  {template.is_premium && (
                    <Badge variant="secondary">Premium</Badge>
                  )}
                </div>
                {template.category && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {template.category}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {t('admin.marketWizard.qualityGates', 'Quality Gates')}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            All markets must pass through our 6-stage quality workflow including legal review 
            and minimum $1,000 liquidity commitment before deployment.
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!selectedType || isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Creating...
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
