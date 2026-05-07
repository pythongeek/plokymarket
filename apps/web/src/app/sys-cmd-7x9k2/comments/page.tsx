'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Flag, Trash2, CheckCircle } from 'lucide-react';

interface Comment {
  id: string;
  user_email: string;
  market_question: string;
  content: string;
  is_flagged: boolean;
  flagged_reason: string;
  created_at: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/comments?status=${status}`);
    const data = await res.json();
    setComments(data.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [status]);

  const moderate = async (id: string, action: string, reason?: string) => {
    const res = await fetch('/api/admin/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, reason }),
    });
    if (res.ok) {
      toast({ title: `Comment ${action}d` });
      fetchComments();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold">Comment Moderation</h1>
          <Badge variant="outline" className="border-slate-700">{comments.length}</Badge>
        </div>

        <div className="flex gap-2 mb-4">
          {['all', 'flagged', 'clean'].map(s => (
            <Button key={s} size="sm" variant={status === s ? 'default' : 'outline'}
              className={status === s ? 'bg-purple-600' : 'border-slate-700'}
              onClick={() => setStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        <Card className="bg-[#0f1629] border-slate-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Market</TableHead>
                  <TableHead className="text-slate-400">Content</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Loading...</TableCell></TableRow>
                ) : comments.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No comments</TableCell></TableRow>
                ) : comments.map(c => (
                  <TableRow key={c.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-slate-300 text-xs">{c.user_email || 'Unknown'}</TableCell>
                    <TableCell className="text-slate-400 text-xs max-w-[150px] truncate">{c.market_question?.slice(0, 30)}</TableCell>
                    <TableCell className="text-slate-300 text-xs max-w-[300px]">{c.content?.slice(0, 100)}</TableCell>
                    <TableCell>
                      {c.is_flagged ? (
                        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Flagged</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Clean</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!c.is_flagged && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-400 hover:text-orange-300"
                            onClick={() => moderate(c.id, 'flag', 'Inappropriate content')}>
                            <Flag className="w-3 h-3" />
                          </Button>
                        )}
                        {c.is_flagged && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300"
                            onClick={() => moderate(c.id, 'unflag')}>
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300"
                          onClick={() => moderate(c.id, 'delete')}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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
