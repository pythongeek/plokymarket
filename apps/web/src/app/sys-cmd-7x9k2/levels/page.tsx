'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Edit, Save, Plus, ShieldCheck, TrendingUp, Wallet, Banknote, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Level {
    id: number;
    name: string;
    min_volume: number;
    kyc_required: number;
    benefits: {
        withdrawal_limit?: number;
        trading_fee_discount?: number;
        instant_withdrawal?: boolean;
        vip_support?: boolean;
        custom_markets?: boolean;
        direct_admin_access?: boolean;
        [key: string]: any;
    };
    description: string;
}

export default function LevelsAdminPage() {
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const supabase = createClient();

    const fetchLevels = async () => {
        try {
            const { data, error } = await supabase
                .from('levels')
                .select('*')
                .order('min_volume', { ascending: true });

            if (error) throw error;
            setLevels(data || []);
        } catch (error) {
            console.error('Error fetching levels:', error);
            toast.error('Failed to load levels');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const handleSaveLevel = async () => {
        if (!editingLevel) return;

        try {
            setLoading(true);

            const levelData = {
                name: editingLevel.name,
                min_volume: editingLevel.min_volume,
                kyc_required: editingLevel.kyc_required,
                benefits: editingLevel.benefits,
                description: editingLevel.description
            };

            if (editingLevel.id === 0) {
                const { error } = await supabase.from('levels').insert(levelData);
                if (error) throw error;
                toast.success('Level created successfully');
            } else {
                const { error } = await supabase.from('levels').update(levelData).eq('id', editingLevel.id);
                if (error) throw error;
                toast.success('Level updated successfully');
            }

            setIsDialogOpen(false);
            fetchLevels();
        } catch (error) {
            console.error('Error saving level:', error);
            toast.error('Failed to save level changes');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLevel = async (levelId: number) => {
        if (!confirm('Are you sure you want to delete this level? This cannot be undone.')) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('levels')
                .delete()
                .eq('id', levelId);

            if (error) throw error;
            toast.success('Level deleted successfully');
            fetchLevels();
        } catch (error) {
            console.error('Error deleting level:', error);
            toast.error('Failed to delete level. Ensure no users are assigned to it.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && levels.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Levels</h1>
                    <p className="text-muted-foreground">Manage loyalty tiers, requirements, and benefits.</p>
                </div>
                <Button onClick={() => toast.info('Level creation disabled for safety. Edit existing levels only.')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Level
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Defined Levels</CardTitle>
                        <CardDescription>
                            Tiers are automatically assigned based on user volume.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Level Name</TableHead>
                                    <TableHead>Min. Volume (BDT)</TableHead>
                                    <TableHead>KYC Req.</TableHead>
                                    <TableHead>Benefits Summary</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {levels.map((level) => (
                                    <TableRow key={level.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-primary/5">Lvl {level.id}</Badge>
                                                {level.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>৳{level.min_volume.toLocaleString()}</TableCell>
                                        <TableCell>
                                            {level.kyc_required === 0 ? (
                                                <Badge variant="secondary">None</Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-blue-500">Level {level.kyc_required}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {level.benefits.trading_fee_discount && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Fee -{level.benefits.trading_fee_discount}%
                                                    </Badge>
                                                )}
                                                {level.benefits.withdrawal_limit && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Limit ৳{level.benefits.withdrawal_limit === -1 ? '∞' : level.benefits.withdrawal_limit.toLocaleString()}
                                                    </Badge>
                                                )}
                                                {level.benefits.instant_withdrawal && (
                                                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                                                        Instant
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingLevel({ ...level });
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Level: {editingLevel?.name}</DialogTitle>
                        <DialogDescription>
                            Update requirements and benefits for this tier. Changes affect all users on this level.
                        </DialogDescription>
                    </DialogHeader>

                    {editingLevel && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Level Name</Label>
                                    <Input
                                        id="name"
                                        value={editingLevel.name}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="volume">Minimum Volume (BDT)</Label>
                                    <Input
                                        id="volume"
                                        type="number"
                                        value={editingLevel.min_volume}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, min_volume: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="kyc">KYC Requirement (Level 0-3)</Label>
                                <Input
                                    id="kyc"
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={editingLevel.kyc_required}
                                    onChange={(e) => setEditingLevel({ ...editingLevel, kyc_required: Number(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea
                                    id="desc"
                                    value={editingLevel.description}
                                    onChange={(e) => setEditingLevel({ ...editingLevel, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Benefits Configuration
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Withdrawal Limit (BDT, -1 for Unlimited)</Label>
                                        <Input
                                            type="number"
                                            value={editingLevel.benefits.withdrawal_limit ?? 0}
                                            onChange={(e) => setEditingLevel({
                                                ...editingLevel,
                                                benefits: { ...editingLevel.benefits, withdrawal_limit: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fee Discount (%)</Label>
                                        <Input
                                            type="number"
                                            value={editingLevel.benefits.trading_fee_discount ?? 0}
                                            onChange={(e) => setEditingLevel({
                                                ...editingLevel,
                                                benefits: { ...editingLevel.benefits, trading_fee_discount: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300"
                                            checked={editingLevel.benefits.instant_withdrawal || false}
                                            onChange={(e) => setEditingLevel({
                                                ...editingLevel,
                                                benefits: { ...editingLevel.benefits, instant_withdrawal: e.target.checked }
                                            })}
                                        />
                                        Instant Withdrawals
                                    </label>

                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300"
                                            checked={editingLevel.benefits.vip_support || false}
                                            onChange={(e) => setEditingLevel({
                                                ...editingLevel,
                                                benefits: { ...editingLevel.benefits, vip_support: e.target.checked }
                                            })}
                                        />
                                        VIP Support
                                    </label>

                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300"
                                            checked={editingLevel.benefits.direct_admin_access || false}
                                            onChange={(e) => setEditingLevel({
                                                ...editingLevel,
                                                benefits: { ...editingLevel.benefits, direct_admin_access: e.target.checked }
                                            })}
                                        />
                                        Direct Admin Access
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveLevel} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
