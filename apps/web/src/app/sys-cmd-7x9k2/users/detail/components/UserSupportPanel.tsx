'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Headphones,
    MessageSquare,
    Clock,
    AlertCircle,
    CheckCircle,
    ArrowUp,
    Loader2,
    Plus,
    Tag,
    StickyNote,
    RefreshCw,
    Send,
} from 'lucide-react';
import { userManagementService } from '@/lib/user-management/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface UserSupportPanelProps {
    userId: string;
    tickets: any[];
    notes: any[];
    onUpdate: () => void;
}

export function UserSupportPanel({ userId, tickets = [], notes = [], onUpdate }: UserSupportPanelProps) {
    const [loading, setLoading] = useState(false);
    const [showNoteDialog, setShowNoteDialog] = useState(false);
    const [noteForm, setNoteForm] = useState({
        content: '',
        isEscalation: false,
        category: 'general',
    });

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { class: string; label: string }> = {
            critical: { class: 'bg-red-500/20 text-red-400', label: 'জরুরি' },
            high: { class: 'bg-orange-500/20 text-orange-400', label: 'উচ্চ' },
            medium: { class: 'bg-amber-500/20 text-amber-400', label: 'মাঝারি' },
            low: { class: 'bg-emerald-500/20 text-emerald-400', label: 'নিম্ন' },
        };
        return configs[priority] || configs.low;
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { class: string; label: string; icon: typeof Clock }> = {
            open: { class: 'bg-blue-500/20 text-blue-400', label: 'খোলা', icon: Clock },
            in_progress: { class: 'bg-amber-500/20 text-amber-400', label: 'চলমান', icon: Loader2 },
            resolved: { class: 'bg-emerald-500/20 text-emerald-400', label: 'সমাধান', icon: CheckCircle },
            closed: { class: 'bg-slate-700 text-slate-400', label: 'বন্ধ', icon: CheckCircle },
            escalated: { class: 'bg-red-500/20 text-red-400', label: 'এস্কেলেটেড', icon: ArrowUp },
        };
        return configs[status] || configs.open;
    };

    const handleAddNote = async () => {
        if (!noteForm.content.trim()) return;

        setLoading(true);
        try {
            await userManagementService.addInternalNote(userId, {
                content: noteForm.content,
                is_escalation: noteForm.isEscalation,
                category: noteForm.category,
            });
            setShowNoteDialog(false);
            setNoteForm({ content: '', isEscalation: false, category: 'general' });
            onUpdate();
        } catch (error: any) {
            console.error('Error adding note:', error);
            alert(`ত্রুটি: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEscalateTicket = async (ticketId: string) => {
        if (!confirm('এই টিকেটটি এস্কেলেট করতে চান?')) return;

        setLoading(true);
        try {
            await userManagementService.escalateTicket(ticketId);
            onUpdate();
        } catch (error: any) {
            console.error('Escalation error:', error);
            alert(`ত্রুটি: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* CRM Sync Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <div>
                        <p className="text-sm text-white">CRM সিঙ্ক স্ট্যাটাস</p>
                        <p className="text-xs text-emerald-400">সিঙ্ক করা হয়েছে • শেষ সমন্বয়: আজ</p>
                    </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400">সক্রিয়</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Support Tickets */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                            <Headphones className="w-4 h-4 text-primary" />
                            সাপোর্ট টিকেট ({tickets.length})
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Priority-based ticket queue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tickets.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Headphones className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>কোনো সাপোর্ট টিকেট নেই</p>
                                <p className="text-xs mt-1">No support tickets</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map((ticket) => {
                                    const priority = getPriorityConfig(ticket.priority);
                                    const status = getStatusConfig(ticket.status);
                                    const StatusIcon = status.icon;

                                    return (
                                        <motion.div
                                            key={ticket.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-4 rounded-xl bg-slate-950 border border-slate-800"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="text-sm font-medium text-white line-clamp-1">
                                                    {ticket.subject || ticket.title}
                                                </h4>
                                                <Badge className={cn("text-[10px] shrink-0", priority.class)}>
                                                    {priority.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge className={cn("text-[10px]", status.class)}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {status.label}
                                                </Badge>
                                                {ticket.category && (
                                                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                                                        <Tag className="w-3 h-3 mr-1" />
                                                        {ticket.category}
                                                    </Badge>
                                                )}
                                                <span className="text-[10px] text-slate-600">
                                                    {new Date(ticket.created_at).toLocaleDateString('bn-BD')}
                                                </span>
                                            </div>
                                            {ticket.status !== 'escalated' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEscalateTicket(ticket.id)}
                                                    className="mt-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs"
                                                    disabled={loading}
                                                >
                                                    <ArrowUp className="w-3 h-3 mr-1" />
                                                    এস্কেলেট
                                                </Button>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Internal Notes */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white text-sm flex items-center gap-2">
                                <StickyNote className="w-4 h-4 text-primary" />
                                অভ্যন্তরীণ নোট ({notes.length})
                            </CardTitle>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowNoteDialog(true)}
                                className="border-slate-800 text-slate-400 hover:text-white gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                নতুন নোট
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {notes.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>কোনো অভ্যন্তরীণ নোট নেই</p>
                                <p className="text-xs mt-1">No internal notes</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notes.map((note, index) => (
                                    <motion.div
                                        key={note.id || index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={cn(
                                            "p-4 rounded-xl border",
                                            note.is_escalation
                                                ? "bg-red-500/5 border-red-500/20"
                                                : "bg-slate-950 border-slate-800"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                {note.is_escalation && (
                                                    <Badge className="bg-red-500/20 text-red-400 text-[10px]">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        এস্কেলেশন
                                                    </Badge>
                                                )}
                                                {note.category && (
                                                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                                                        {note.category}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-600 shrink-0">
                                                {new Date(note.created_at).toLocaleDateString('bn-BD')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-300">{note.content}</p>
                                        {note.author && (
                                            <p className="text-[10px] text-slate-600 mt-2">— {note.author}</p>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Note Dialog */}
            <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">নতুন অভ্যন্তরীণ নোট</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 block mb-1">ক্যাটাগরি</label>
                            <Select
                                value={noteForm.category}
                                onValueChange={(v) => setNoteForm(prev => ({ ...prev, category: v }))}
                            >
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="general">সাধারণ</SelectItem>
                                    <SelectItem value="kyc">KYC</SelectItem>
                                    <SelectItem value="trading">ট্রেডিং</SelectItem>
                                    <SelectItem value="compliance">কমপ্লায়েন্স</SelectItem>
                                    <SelectItem value="risk">ঝুঁকি</SelectItem>
                                    <SelectItem value="support">সাপোর্ট</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-400 block mb-1">নোট</label>
                            <Textarea
                                value={noteForm.content}
                                onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="অভ্যন্তরীণ নোট লিখুন..."
                                className="bg-slate-950 border-slate-800 text-white"
                                rows={4}
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={noteForm.isEscalation}
                                onChange={(e) => setNoteForm(prev => ({ ...prev, isEscalation: e.target.checked }))}
                                className="rounded border-slate-700 bg-slate-950"
                            />
                            <span className="text-sm text-red-400">🚨 এস্কেলেশন হিসাবে চিহ্নিত করুন</span>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNoteDialog(false)} className="border-slate-800 text-slate-400">
                            বাতিল
                        </Button>
                        <Button onClick={handleAddNote} disabled={!noteForm.content.trim() || loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            নোট যোগ করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
