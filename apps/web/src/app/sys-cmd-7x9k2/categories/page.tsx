'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderOpen, Plus, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  market_count: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '', icon: '', color: '#3b82f6' });
  const { toast } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: [{ id, is_active: !current }] }),
    });
    if (res.ok) { toast({ title: 'Updated' }); fetchCategories(); }
  };

  const createCategory = async () => {
    if (!newCat.name || !newCat.slug) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newCat, display_order: categories.length + 1 }),
    });
    if (res.ok) { toast({ title: 'Category created' }); setNewCat({ name: '', slug: '', description: '', icon: '', color: '#3b82f6' }); fetchCategories(); }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FolderOpen className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold">Market Categories</h1>
          <Badge variant="outline" className="border-slate-700">{categories.length}</Badge>
        </div>

        <Card className="bg-[#0f1629] border-slate-800 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input placeholder="Name" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} className="bg-slate-900/60 border-slate-700" />
              <Input placeholder="slug" value={newCat.slug} onChange={e => setNewCat({ ...newCat, slug: e.target.value })} className="bg-slate-900/60 border-slate-700" />
              <Input placeholder="Icon (emoji)" value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} className="bg-slate-900/60 border-slate-700 w-[120px]" />
              <input type="color" value={newCat.color} onChange={e => setNewCat({ ...newCat, color: e.target.value })} className="w-10 h-10 rounded" />
              <Button onClick={createCategory} className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1629] border-slate-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-slate-800">
              <TableHead className="text-slate-400">Icon</TableHead>
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Slug</TableHead>
                <TableHead className="text-slate-400">Markets</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Loading...</TableCell></TableRow> :
                  categories.map(c => (
                    <TableRow key={c.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-xl">{c.icon || '📊'}</TableCell>
                      <TableCell className="text-slate-200">
                        <span className="w-3 h-3 rounded-full inline-block mr-2" style={{ backgroundColor: c.color || '#3b82f6' }} />
                        {c.name}
                      </TableCell>
                      <TableCell className="text-slate-400 font-mono text-xs">{c.slug}</TableCell>
                      <TableCell className="text-slate-300">{c.market_count || 0}</TableCell>
                      <TableCell>
                        {c.is_active ? <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Active</Badge> : <Badge className="bg-red-500/20 text-red-400 text-xs">Inactive</Badge>}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleActive(c.id, c.is_active)}>
                          {c.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
