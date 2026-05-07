'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Search, Download, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  ip_address: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  UPDATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  VERIFY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  REJECT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  LOGIN: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  LOGOUT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (action) params.set('action', action);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.data || []);
        setTotalPages(data.pages || 1);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, action, fromDate, toDate]);

  const exportCSV = () => {
    const headers = ['Time', 'Admin', 'Action', 'Target Type', 'Target ID', 'Details', 'IP'];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.admin_email || l.admin_name || l.admin_id,
      l.action,
      l.target_type,
      l.target_id,
      JSON.stringify(l.details),
      l.ip_address || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${logs.length} rows exported` });
  };

  const filtered = search
    ? logs.filter(l =>
        (l.admin_email || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.target_type || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold">Audit Log</h1>
            <Badge variant="outline" className="border-slate-700 text-slate-400">
              {logs.length} entries
            </Badge>
          </div>
          <Button onClick={exportCSV} variant="outline" className="border-slate-700 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Card className="bg-[#0f1629] border-slate-800 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search admin, action, target..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-slate-900/60 border-slate-700 text-slate-100"
                />
              </div>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-[160px] bg-slate-900/60 border-slate-700 text-slate-100">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1629] border-slate-700">
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="VERIFY">VERIFY</SelectItem>
                  <SelectItem value="REJECT">REJECT</SelectItem>
                  <SelectItem value="LOGIN">LOGIN</SelectItem>
                  <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-[150px] bg-slate-900/60 border-slate-700 text-slate-100"
              />
              <Input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-[150px] bg-slate-900/60 border-slate-700 text-slate-100"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1629] border-slate-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Time</TableHead>
                  <TableHead className="text-slate-400">Admin</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                  <TableHead className="text-slate-400">Target</TableHead>
                  <TableHead className="text-slate-400">Details</TableHead>
                  <TableHead className="text-slate-400">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No audit logs found</TableCell></TableRow>
                ) : filtered.map(log => (
                  <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-slate-300 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs">
                      {log.admin_email || log.admin_name || log.admin_id?.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${ACTION_COLORS[log.action] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs">
                      <span className="text-slate-500">{log.target_type}</span>
                      <br />
                      <span className="text-slate-400">{log.target_id?.slice(0, 12)}...</span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs max-w-[200px] truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)?.slice(0, 80)}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs font-mono">{log.ip_address || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-4">
          <span className="text-slate-500 text-sm">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 hover:bg-slate-800"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 hover:bg-slate-800"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
