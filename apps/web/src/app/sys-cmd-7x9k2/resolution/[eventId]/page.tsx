/**
 * Manual Resolution Page
 * Admin can manually resolve events with evidence
 * Includes emergency resolution option
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText,
  Shield,
  Loader2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ManualResolutionPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState<'yes' | 'no' | null>(null);
  const [source, setSource] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/admin/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      if (!response.ok) throw new Error('Event not found');
      
      const data = await response.json();
      setEvent(data.event);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addEvidenceUrl = () => {
    if (newUrl.trim() && !evidenceUrls.includes(newUrl.trim())) {
      setEvidenceUrls([...evidenceUrls, newUrl.trim()]);
      setNewUrl('');
    }
  };

  const removeEvidenceUrl = (url: string) => {
    setEvidenceUrls(evidenceUrls.filter(u => u !== url));
  };

  const handleResolve = async (isEmergency: boolean = false) => {
    if (!outcome) {
      setError('ফলাফল নির্বাচন করুন');
      return;
    }

    if (!reasoning.trim()) {
      setError('যুক্তি লিখুন');
      return;
    }

    if (!isEmergency && evidenceUrls.length === 0) {
      setError('অন্তত একটি প্রমাণ URL দিন');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/resolution/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          event_id: eventId,
          outcome,
          source,
          reasoning,
          evidence_urls: evidenceUrls,
          is_emergency: isEmergency
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Resolution ব্যর্থ');
      }

      setSuccess(isEmergency 
        ? '✅ জরুরী Resolution সম্পন্ন!' 
        : '✅ প্রস্তাবনা জমা দেওয়া হয়েছে!'
      );

      setTimeout(() => {
        router.push('/sys-cmd-7x9k2/resolutions');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <Alert variant="destructive">
        <AlertDescription>ইভেন্ট খুঁজে পাওয়া যায়নি</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          ফিরে যান
        </Button>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          ম্যানুয়াল Resolution
        </h1>
        <p className="text-muted-foreground">
          ইভেন্টের ফলাফল নির্ধারণ করুন প্রমাণ সহ
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Event Info */}
      <Card className="mb-6 bg-muted">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-2">{event.question}</h3>
          <div className="flex gap-2 flex-wrap">
            <Badge>{event.category}</Badge>
            <Badge variant="outline">
              শেষ: {new Date(event.trading_closes_at).toLocaleDateString('bn-BD')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Outcome Selection */}
        <Card>
          <CardHeader>
            <CardTitle>ফলাফল নির্বাচন করুন *</CardTitle>
            <CardDescription>
              ইভেন্টের চূড়ান্ত ফলাফল কী ছিল?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={outcome === 'yes' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setOutcome('yes')}
                className="h-24 text-lg"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                YES
                <br />
                <span className="text-sm font-normal">হ্যাঁ</span>
              </Button>
              
              <Button
                variant={outcome === 'no' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setOutcome('no')}
                className="h-24 text-lg"
              >
                <XCircle className="w-6 h-6 mr-2" />
                NO
                <br />
                <span className="text-sm font-normal">না</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Evidence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              প্রমাণ এবং সোর্স *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>প্রাথমিক সোর্স URL *</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="https://prothomalo.com/..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>অতিরিক্ত প্রমাণ URLs</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEvidenceUrl())}
                />
                <Button type="button" onClick={addEvidenceUrl} variant="outline">
                  যোগ
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {evidenceUrls.map((url) => (
                  <Badge key={url} variant="secondary" className="cursor-pointer" onClick={() => removeEvidenceUrl(url)}>
                    {new URL(url).hostname} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>যুক্তি/বিবরণ *</Label>
              <Textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="কেন এই ফলাফল সঠিক? প্রমাণ কী?"
                rows={5}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={() => handleResolve(false)}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <FileText className="w-5 h-5 mr-2" />
            )}
            প্রস্তাবনা জমা দিন
            <span className="text-xs ml-2 opacity-75">(Approval প্রয়োজন)</span>
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={() => setShowEmergency(true)}
            disabled={isSubmitting}
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Red Button
          </Button>
        </div>

        {/* Emergency Confirmation */}
        {showEmergency && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950">
            <CardHeader>
              <CardTitle className="text-red-900 dark:text-red-100 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                ⚠️ জরুরী Resolution নিশ্চিত করুন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-800 dark:text-red-200">
                এটি তাৎক্ষণিকভাবে ইভেন্ট resolve করবে, কোনো approval ছাড়াই।
                শুধুমাত্র জরুরী পরিস্থিতিতে ব্যবহার করুন:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• স্পষ্ট সরকারি ঘোষণা</li>
                <li>• আন্তর্জাতিক ম্যাচের ফলাফল</li>
                <li>• বড় দুর্ঘটনা/ঘটনা</li>
              </ul>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="destructive"
                  onClick={() => handleResolve(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  নিশ্চিত করুন
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEmergency(false)}
                >
                  বাতিল করুন
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
