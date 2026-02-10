'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Link,
  FileText,
  Tag,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MarketDraft, MarketTemplate } from '@/lib/market-creation/service';

interface ParameterConfigurationStageProps {
  draft: MarketDraft;
  templates: MarketTemplate[];
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
}

const CATEGORIES = [
  'Sports',
  'Politics',
  'Crypto',
  'Finance',
  'Entertainment',
  'Technology',
  'Science',
  'Weather',
  'Other'
];

const ORACLE_TYPES = [
  { id: 'MANUAL', name: 'Manual (Admin)', description: 'Resolved by platform admin' },
  { id: 'AI', name: 'AI Consensus', description: 'Automated via AI oracle' },
  { id: 'UMA', name: 'UMA Optimistic', description: 'Decentralized optimistic oracle' },
  { id: 'CHAINLINK', name: 'Chainlink', description: 'Decentralized data feeds' },
];

export function ParameterConfigurationStage({
  draft,
  templates,
  onSave,
  onBack,
  isSaving,
  errors
}: ParameterConfigurationStageProps) {
  const { t } = useTranslation();
  const template = templates.find(t => t.id === draft.template_id);

  const [formData, setFormData] = useState({
    question: draft.question || '',
    description: draft.description || '',
    category: draft.category || template?.category || '',
    subcategory: draft.subcategory || '',
    tags: draft.tags || [],
    resolution_source: draft.resolution_source || '',
    resolution_source_url: draft.resolution_source_url || '',
    resolution_criteria: draft.resolution_criteria || template?.default_params?.resolution_criteria || '',
    resolution_deadline: draft.resolution_deadline 
      ? new Date(draft.resolution_deadline).toISOString().slice(0, 16)
      : '',
    oracle_type: draft.oracle_type || 'MANUAL',
    oracle_config: draft.oracle_config || {},
    // Scalar specific
    min_value: draft.min_value || 0,
    max_value: draft.max_value || 100,
    unit: draft.unit || 'USD',
    // Categorical specific
    outcomes: draft.outcomes || [{ id: '1', label: '' }, { id: '2', label: '' }],
    ...template?.default_params
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = async () => {
    const dataToSave = {
      ...formData,
      market_type: draft.market_type,
      resolution_deadline: formData.resolution_deadline 
        ? new Date(formData.resolution_deadline).toISOString()
        : undefined
    };
    await onSave(dataToSave);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addOutcome = () => {
    setFormData(prev => ({
      ...prev,
      outcomes: [...prev.outcomes, { id: String(prev.outcomes.length + 1), label: '' }]
    }));
  };

  const removeOutcome = (index: number) => {
    if (formData.outcomes.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter((_, i) => i !== index)
    }));
  };

  const updateOutcome = (index: number, label: string) => {
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.map((o, i) => 
        i === index ? { ...o, label } : o
      )
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">
            Market Question *
            <span className="text-xs text-muted-foreground ml-2">
              (Be specific and objective)
            </span>
          </Label>
          <Textarea
            id="question"
            placeholder="Will [specific event] happen by [specific date]?"
            value={formData.question}
            onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            {formData.question.length} characters (min 10 recommended)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description
            <span className="text-xs text-muted-foreground ml-2">
              (Provide context and clarifications)
            </span>
          </Label>
          <Textarea
            id="description"
            placeholder="Detailed description of the market, including any edge cases or clarifications..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="min-h-[100px]"
          />
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              placeholder="e.g., Cricket, Presidential Election"
              value={formData.subcategory}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Market Type Specific */}
      {draft.market_type === 'scalar' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4"
        >
          <h4 className="font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Scalar Market Parameters
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Minimum Value</Label>
              <Input
                type="number"
                value={formData.min_value}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  min_value: parseFloat(e.target.value) 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Value</Label>
              <Input
                type="number"
                value={formData.max_value}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_value: parseFloat(e.target.value) 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                placeholder="USD, points, etc."
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              />
            </div>
          </div>
        </motion.div>
      )}

      {draft.market_type === 'categorical' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4"
        >
          <h4 className="font-medium flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Outcomes
          </h4>
          <div className="space-y-2">
            {formData.outcomes.map((outcome, index) => (
              <div key={outcome.id} className="flex gap-2">
                <Input
                  placeholder={`Outcome ${index + 1}`}
                  value={outcome.label}
                  onChange={(e) => updateOutcome(index, e.target.value)}
                />
                {formData.outcomes.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOutcome(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addOutcome} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Outcome
            </Button>
          </div>
        </motion.div>
      )}

      {/* Resolution Criteria */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Resolution Criteria
        </h4>

        <div className="space-y-2">
          <Label htmlFor="resolution_criteria">Resolution Criteria *</Label>
          <Textarea
            id="resolution_criteria"
            placeholder="Describe exactly how this market will be resolved. Be specific about sources and edge cases."
            value={formData.resolution_criteria}
            onChange={(e) => setFormData(prev => ({ ...prev, resolution_criteria: e.target.value }))}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution_source">Resolution Source</Label>
          <Input
            id="resolution_source"
            placeholder="e.g., ESPN, Bloomberg, Official Government Source"
            value={formData.resolution_source}
            onChange={(e) => setFormData(prev => ({ ...prev, resolution_source: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution_source_url">Source URL</Label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="resolution_source_url"
              type="url"
              placeholder="https://..."
              value={formData.resolution_source_url}
              onChange={(e) => setFormData(prev => ({ ...prev, resolution_source_url: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution_deadline">Resolution Deadline *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="resolution_deadline"
              type="datetime-local"
              value={formData.resolution_deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, resolution_deadline: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Oracle Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ORACLE_TYPES.map((oracle) => (
              <button
                key={oracle.id}
                onClick={() => setFormData(prev => ({ ...prev, oracle_type: oracle.id }))}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  formData.oracle_type === oracle.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <p className="font-medium">{oracle.name}</p>
                <p className="text-xs text-muted-foreground">{oracle.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Saving...
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
