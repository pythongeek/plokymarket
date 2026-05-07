'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Copy, FileText, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  icon: string;
  type: string;
  category: string;
  parameters: any[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(r => r.json())
      .then(data => { setTemplates(data.data || []); setLoading(false); });
  }, []);

  const useTemplate = (template: Template) => {
    const params = template.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.defaultValue || '' }), {});
    const query = new URLSearchParams({ template: template.id, ...params });
    window.open(`/sys-cmd-7x9k2/markets?${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-teal-400" />
          <h1 className="text-2xl font-bold">Market Templates</h1>
          <Badge variant="outline" className="border-slate-700">{templates.length}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <p className="text-slate-500 col-span-3">Loading...</p> :
            templates.map(t => (
              <Card key={t.id} className="bg-[#0f1629] border-slate-800 hover:border-teal-500/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-200 text-sm">{t.name}</CardTitle>
                    <Badge variant="outline" className="text-xs border-slate-700">{t.category}</Badge>
                  </div>
                  <p className="text-slate-500 text-xs">{t.nameBn}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-xs mb-3">{t.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.parameters?.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-slate-700 text-slate-500">{p.name}</Badge>
                    ))}
                  </div>
                  <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => useTemplate(t)}>
                    <Sparkles className="w-3 h-3 mr-1" /> Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
