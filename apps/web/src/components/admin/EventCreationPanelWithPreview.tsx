/**
 * Event Creation Panel with Live Preview
 * Production-ready event creation with real-time preview
 */

'use client';

import { useState, useMemo } from 'react';
import { EventCreationPanel } from './EventCreationPanel';
import { EventLivePreview } from './live-preview/EventLivePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Edit3, Sparkles } from 'lucide-react';

interface EventCreationPanelWithPreviewProps {
  onEventCreated?: (eventId: string) => void;
}

export function EventCreationPanelWithPreview({ onEventCreated }: EventCreationPanelWithPreviewProps) {
  const [activeTab, setActiveTab] = useState('edit');
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    description: '',
    category: '',
    subcategory: '',
    tradingClosesAt: '',
    resolutionDate: '',
    resolutionMethod: 'MANUAL',
    imageUrl: '',
    tags: [] as string[],
  });

  // Transform form data for preview
  const previewData = useMemo(() => ({
    title: formData.title,
    question: formData.question,
    description: formData.description,
    category: formData.category.toLowerCase(),
    subcategory: formData.subcategory,
    tradingClosesAt: formData.tradingClosesAt,
    resolutionDate: formData.resolutionDate,
    resolutionMethod: formData.resolutionMethod === 'MANUAL' ? 'ম্যানুয়াল (অ্যাডমিন)' : 
                      formData.resolutionMethod === 'AI' ? 'AI কনসেনসাস' : 
                      formData.resolutionMethod,
    imageUrl: formData.imageUrl,
    tags: formData.tags,
  }), [formData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-400" />
            নতুন ইভেন্ট তৈরি করুন
          </h2>
          <p className="text-slate-400 mt-1">
            লাইভ প্রিভিউ সহ নতুন প্রেডিকশন মার্কেট ইভেন্ট তৈরি করুন
          </p>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              এডিট
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              প্রিভিউ
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="mt-4">
            <EventCreationPanel 
              onEventCreated={onEventCreated}
              onFormChange={setFormData}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4">
            <EventLivePreview formData={previewData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Side-by-Side */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-6">
        {/* Form Section - 3 columns */}
        <div className="lg:col-span-3">
          <EventCreationPanel 
            onEventCreated={onEventCreated}
            onFormChange={setFormData}
          />
        </div>
        
        {/* Preview Section - 2 columns */}
        <div className="lg:col-span-2">
          <EventLivePreview formData={previewData} />
        </div>
      </div>
    </div>
  );
}

export default EventCreationPanelWithPreview;
