"use client";

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  History,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  Package,
  FileSpreadsheet,
  FileJson,
  FileText,
  PlusCircle,
  MinusCircle,
  XSquare,
  BellRing
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { usePositionHistory, type PositionFilters, type OrderType, type OrderStatus } from '@/hooks/portfolio/usePositionHistory';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';

interface PositionHistoryProps {
  userId?: string;
}

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  entry: { icon: Package, color: 'blue', label: 'এন্ট্রি' },
  modification: { icon: MoreHorizontal, color: 'amber', label: 'মডিফিকেশন' },
  partial_fill: { icon: Clock, color: 'purple', label: 'পারশিয়াল ফিল' },
  fill: { icon: CheckCircle2, color: 'emerald', label: 'কমপ্লিট ফিল' },
  exit: { icon: ArrowUpRight, color: 'rose', label: 'এক্সিট' },
  dividend: { icon: TrendingUp, color: 'green', label: 'ডিভিডেন্ড' }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

export function PositionHistory({ userId }: PositionHistoryProps) {
  const [filters, setFilters] = useState<PositionFilters>({});
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const { positions, loading, totalCount, exportToCSV, exportToJSON } = usePositionHistory(userId, {
    ...filters,
    market: searchQuery,
    dateRange: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined
  });

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    if (format === 'csv') exportToCSV();
    else if (format === 'json') exportToJSON();
    else {
      // PDF export would require additional library
      window.print();
    }
  };

  const handleAction = (e: React.MouseEvent, action: string, positionId: string) => {
    e.stopPropagation(); // Prevents card expansion
    console.log(`Action: ${action} on position: ${positionId}`);
    // Future: Open modals or dispatch actions based on the clicked button
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📜 পজিশন হিস্টরি
          </h2>
          <p className="text-muted-foreground">
            {totalCount}টি ট্রেড • সম্পূর্ণ লাইফসাইকেল ট্র্যাকিং
          </p>
        </div>

        {/* Search & Export */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="মার্কেট খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-2">
                <p className="text-sm font-medium">এক্সপোর্ট ফরম্যাট</p>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => handleExport('csv')}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  CSV (Excel)
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => handleExport('json')}
                >
                  <FileJson className="w-4 h-4 text-blue-600" />
                  JSON
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => handleExport('pdf')}
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  PDF (Print)
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        <Select
          value={filters.orderType}
          onValueChange={(value) => setFilters(f => ({ ...f, orderType: value as OrderType }))}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="অর্ডার টাইপ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="market">Market</SelectItem>
            <SelectItem value="limit">Limit</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => setFilters(f => ({ ...f, status: value as OrderStatus }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="স্ট্যাটাস" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">চলমান</SelectItem>
            <SelectItem value="partially_filled">আংশিক</SelectItem>
            <SelectItem value="filled">সম্পন্ন</SelectItem>
            <SelectItem value="resolved">সমাধান করা</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.outcome}
          onValueChange={(value) => setFilters(f => ({ ...f, outcome: value as 'win' | 'loss' | 'pending' }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="আউটকাম" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="win">জয়</SelectItem>
            <SelectItem value="loss">পরাজয়</SelectItem>
            <SelectItem value="pending">পেন্ডিং</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              {dateRange.from && dateRange.to
                ? `${dateRange.from.toLocaleDateString('bn-BD')} - ${dateRange.to.toLocaleDateString('bn-BD')}`
                : 'তারিখ সিলেক্ট করুন'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              selected={{
                from: dateRange.from,
                to: dateRange.to
              }}
              onSelect={(range) => setDateRange({
                from: range?.from,
                to: range?.to
              })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* Position List */}
      <motion.div variants={itemVariants} className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : positions.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">কোনো পজিশন পাওয়া যায়নি</h3>
              <p className="text-muted-foreground">আপনার ফিল্টার পরিবর্তন করুন বা নতুন ট্রেড শুরু করুন</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {positions.map((position) => (
              <motion.div
                key={position.id}
                variants={itemVariants}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden transition-all duration-300 cursor-pointer",
                    "hover:shadow-lg hover:border-primary/20",
                    expandedPosition === position.id && "border-primary ring-1 ring-primary/20"
                  )}
                  onClick={() => setExpandedPosition(
                    expandedPosition === position.id ? null : position.id
                  )}
                >
                  {/* Summary Row */}
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      {/* Market Info */}
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          position.outcome === 'YES'
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                            : "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
                        )}>
                          {position.outcome === 'YES' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{position.marketName}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {position.marketCategory}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                position.outcome === 'YES'
                                  ? "border-emerald-300 text-emerald-700"
                                  : "border-rose-300 text-rose-700"
                              )}
                            >
                              {position.outcome === 'YES' ? 'হ্যাঁ' : 'না'}
                            </Badge>
                            <span>•</span>
                            <span>{formatDate(position.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Position Details & Valuation */}
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="hidden md:block">
                          <p className="text-muted-foreground text-[10px] uppercase">পরিমাণ</p>
                          <p className="font-medium text-base">{position.filledQuantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase">এন্ট্রি</p>
                          <p className="font-medium">৳{position.entryPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase">বর্তমান</p>
                          <p className="font-medium">৳{(position.exitPrice || position.currentPrice).toFixed(2)}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-muted-foreground text-[10px] uppercase">ভ্যালু</p>
                          <p className="font-medium text-emerald-600 dark:text-emerald-400">
                            ৳{((position.exitPrice || position.currentPrice) * position.filledQuantity).toFixed(2)}
                          </p>
                        </div>
                        <div className={cn(
                          "text-right",
                          position.pnl >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          <p className="text-muted-foreground text-[10px] uppercase">P&L / ROI</p>
                          <div className="flex items-baseline gap-1">
                            <p className="font-bold text-base">
                              {position.pnl >= 0 ? '+' : ''}৳{position.pnlBDT.toFixed(2)}
                            </p>
                            <p className="text-xs opacity-80">
                              ({position.returnPercentage >= 0 ? '+' : ''}{position.returnPercentage.toFixed(2)}%)
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 border-l border-border/50 pl-4 ml-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-full" onClick={(e) => handleAction(e, 'add', position.id)} title="Add to Position">
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-full" onClick={(e) => handleAction(e, 'reduce', position.id)} title="Reduce Position">
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full" onClick={(e) => handleAction(e, 'close', position.id)} title="Close Position">
                            <XSquare className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-slate-600 hover:bg-slate-500/10 rounded-full" onClick={(e) => handleAction(e, 'alert', position.id)} title="Set Price Alert">
                            <BellRing className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Expand Icon */}
                        <div className="ml-2">
                          {expandedPosition === position.id ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Expanded Timeline */}
                  <AnimatePresence>
                    {expandedPosition === position.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t bg-muted/30"
                      >
                        <CardContent className="p-6">
                          <h5 className="font-medium mb-4 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            ট্রানজেকশন টাইমলাইন
                          </h5>

                          <div className="relative pl-8 space-y-6">
                            {/* Timeline Line */}
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />

                            {position.events.map((event, index) => {
                              const config = eventTypeConfig[event.type];
                              const Icon = config.icon;

                              return (
                                <motion.div
                                  key={event.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="relative"
                                >
                                  {/* Timeline Dot */}
                                  <div className={cn(
                                    "absolute -left-5 w-4 h-4 rounded-full border-2 border-background",
                                    config.color === 'blue' && "bg-blue-500",
                                    config.color === 'emerald' && "bg-emerald-500",
                                    config.color === 'rose' && "bg-rose-500",
                                    config.color === 'purple' && "bg-purple-500",
                                    config.color === 'amber' && "bg-amber-500"
                                  )} />

                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-background border">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "p-2 rounded-lg",
                                        config.color === 'blue' && "bg-blue-100 text-blue-600",
                                        config.color === 'emerald' && "bg-emerald-100 text-emerald-600",
                                        config.color === 'rose' && "bg-rose-100 text-rose-600",
                                        config.color === 'purple' && "bg-purple-100 text-purple-600",
                                        config.color === 'amber' && "bg-amber-100 text-amber-600"
                                      )}>
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="font-medium">{config.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatDate(event.timestamp)}
                                        </p>
                                      </div>
                                    </div>

                                    {event.data.price && (
                                      <div className="text-right">
                                        <p className="font-medium">${event.data.price.toFixed(3)}</p>
                                        {event.data.quantity && (
                                          <p className="text-xs text-muted-foreground">
                                            {event.data.quantity} shares
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Tax Info */}
                          <div className="mt-6 p-4 rounded-lg bg-muted/50">
                            <div className="flex flex-wrap justify-between gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">হোল্ডিং পিরিয়ড:</span>
                                <span className="ml-2 font-medium">{position.holdingPeriodDays} দিন</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">ফিস:</span>
                                <span className="ml-2 font-medium">${position.fees.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">ট্যাক্স লট মেথড:</span>
                                <span className="ml-2 font-medium">{position.taxLotMethod}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}
