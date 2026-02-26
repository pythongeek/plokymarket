/**
 * Event Live Preview Component
 * Production-ready live preview for event creation
 * Shows real-time preview of how event will appear to users
 */

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Globe, Info, TrendingUp, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

// Event form data interface
interface EventFormData {
  title?: string;
  question?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tradingClosesAt?: string;
  resolutionDate?: string;
  resolutionMethod?: string;
  imageUrl?: string;
  tags?: string[];
}

interface EventLivePreviewProps {
  formData: EventFormData;
  className?: string;
}

// Category color mapping
const categoryColors: Record<string, string> = {
  sports: 'bg-blue-500',
  politics: 'bg-red-500',
  crypto: 'bg-orange-500',
  economics: 'bg-green-500',
  weather: 'bg-cyan-500',
  entertainment: 'bg-purple-500',
  technology: 'bg-indigo-500',
  international: 'bg-pink-500',
};

// Category labels in Bengali
const categoryLabels: Record<string, string> = {
  sports: 'খেলাধুলা',
  politics: 'রাজনীতি',
  crypto: 'ক্রিপ্টো',
  economics: 'অর্থনীতি',
  weather: 'আবহাওয়া',
  entertainment: 'বিনোদন',
  technology: 'প্রযুক্তি',
  international: 'আন্তর্জাতিক',
};

export const EventLivePreview: React.FC<EventLivePreviewProps> = memo(({ formData, className }) => {
  // Transform form data to preview format with fallbacks
  const previewData = {
    title: formData.title?.trim() || 'আপনার ইভেন্টের শিরোনাম এখানে দেখাবে',
    question: formData.question?.trim() || 'ইভেন্টের প্রশ্ন এখানে দেখাবে...',
    description: formData.description?.trim() || '',
    category: formData.category || 'uncategorized',
    subcategory: formData.subcategory || '',
    tradingClosesAt: formData.tradingClosesAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    resolutionDate: formData.resolutionDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    resolutionMethod: formData.resolutionMethod || 'নির্ধারিত নয়',
    imageUrl: formData.imageUrl || '/images/placeholder-event.png',
    tags: formData.tags || [],
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM, yyyy h:mm a', { locale: bn });
    } catch {
      return dateString;
    }
  };

  // Calculate time remaining
  const getTimeRemaining = (dateString: string) => {
    const target = new Date(dateString).getTime();
    const now = Date.now();
    const diff = target - now;
    
    if (diff <= 0) return 'বন্ধ হয়ে গেছে';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} দিন ${hours} ঘন্টা বাকি`;
    return `${hours} ঘন্টা বাকি`;
  };

  const categoryColor = categoryColors[previewData.category] || 'bg-gray-500';
  const categoryLabel = categoryLabels[previewData.category] || previewData.category;

  return (
    <Card className={`sticky top-6 border-2 border-primary/20 shadow-xl overflow-hidden ${className}`}>
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b py-4">
        <CardTitle className="text-md flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          লাইভ প্রিভিউ (ইউজার ভিউ)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Event Card Preview - Mobile/Desktop View */}
        <div className="flex justify-center">
          <div 
            className="w-full max-w-[380px] transform hover:scale-[1.02] transition-transform duration-300"
            aria-hidden="true"
          >
            {/* Event Card Container */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden pointer-events-none">
              {/* Image Section */}
              <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                {previewData.imageUrl ? (
                  <img 
                    src={previewData.imageUrl} 
                    alt={previewData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-event.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TrendingUp className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={`${categoryColor} text-white text-xs font-medium px-2 py-1`}>
                    {categoryLabel}
                  </Badge>
                </div>
                
                {/* Time Badge */}
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-slate-900/90">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeRemaining(previewData.tradingClosesAt)}
                  </Badge>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2">
                  {previewData.title}
                </h3>
                
                {/* Question */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {previewData.question}
                </p>
                
                {/* Yes/No Buttons Preview */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-2 px-3 rounded-lg text-center text-sm font-medium">
                    হ্যাঁ ৳৫০.০০
                  </div>
                  <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 py-2 px-3 rounded-lg text-center text-sm font-medium">
                    না ৳৫০.০০
                  </div>
                </div>
                
                {/* Footer Info */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>০ ট্রেডার</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>ভলিউম: ৳০</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Internal Details Panel */}
        <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
          <h4 className="font-semibold flex items-center gap-2 border-b pb-2 dark:border-slate-700">
            <Clock className="w-4 h-4" />
            সিস্টেম কনফিগারেশন
          </h4>
          
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <span className="text-muted-foreground">টাইমজোন:</span>
            <span className="font-mono text-right">Asia/Dhaka (GMT+6)</span>
            
            <span className="text-muted-foreground">ট্রেডিং বন্ধ:</span>
            <span className="text-right font-medium">{formatDate(previewData.tradingClosesAt)}</span>
            
            <span className="text-muted-foreground">রেজোলিউশন:</span>
            <span className="text-right font-medium">{formatDate(previewData.resolutionDate)}</span>
            
            <span className="text-muted-foreground">রেজোলিউশন মেথড:</span>
            <span className="text-right">{previewData.resolutionMethod}</span>
            
            <span className="text-muted-foreground">মার্কেট টাইপ:</span>
            <Badge variant="outline" className="ml-auto w-fit text-xs">Binary (Yes/No)</Badge>
            
            {previewData.tags.length > 0 && (
              <>
                <span className="text-muted-foreground">ট্যাগ:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {previewData.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Info Alert */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-xs flex gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>ইউজাররা মোবাইল এবং ডেস্কটপে আপনার ইভেন্টটি এভাবেই দেখতে পাবে।</p>
              <p className="text-blue-600 dark:text-blue-400">
                প্রিভিউ মোডে কার্ডটি ক্লিক করা যাবে না (pointer-events: none)
              </p>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {previewData.title.length > 10 && previewData.question.length > 10 && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>প্রিভিউ তৈরি হয়েছে - ইভেন্ট প্রকাশের জন্য প্রস্তুত</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

EventLivePreview.displayName = 'EventLivePreview';

export default EventLivePreview;
