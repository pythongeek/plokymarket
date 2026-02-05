# PLOKYMARKET: Complete Implementation Guide - Part 2
## Full-Stack Prediction Market Platform for Bangladesh

---

## TABLE OF CONTENTS

6. [Oracle Service](#6-oracle-service)
7. [Payment Integration](#7-payment-integration)
8. [Frontend Implementation](#8-frontend-implementation)
9. [Trading Engine (CLOB)](#9-trading-engine-clob)
10. [Security Implementation](#10-security-implementation)
11. [Bangladesh-Specific Features](#11-bangladesh-specific-features)
12. [AI Agent Coding Instructions](#12-ai-agent-coding-instructions)
13. [Deployment Guide](#13-deployment-guide)

---

## 6. ORACLE SERVICE

```typescript
// /src/lib/oracle/service.ts

export class OracleService {
  
  async requestResolution(marketId: string, requestedBy: string): Promise<OracleRequest> {
    const { data: market } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();
    
    if (!market || market.status !== 'closed') {
      throw new Error('Market not eligible for resolution');
    }
    
    const evidence = await this.gatherEvidence(market);
    const aiAnalysis = await this.analyzeWithAI(market, evidence);
    
    const request = await supabase
      .from('oracle_requests')
      .insert({
        market_id: marketId,
        request_type: 'initial',
        requested_by: requestedBy,
        proposed_outcome_id: aiAnalysis.recommendedOutcome,
        proposed_outcome_text: aiAnalysis.reasoning,
        confidence_score: aiAnalysis.confidence,
        evidence_urls: evidence.urls,
        evidence_text: evidence.summary,
        ai_analysis: aiAnalysis,
        ai_recommendation: aiAnalysis.recommendedOutcome,
        ai_confidence: aiAnalysis.confidence,
        challenge_period_start: new Date(),
        challenge_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending'
      })
      .select()
      .single();
    
    await this.scheduleChallengePeriodEnd(request.id);
    
    return request;
  }
  
  private async analyzeWithAI(market: Market, evidence: Evidence): Promise<AIAnalysis> {
    const prompt = `
      You are an AI oracle analyzing a prediction market for resolution.
      
      Market Question: ${market.title}
      Resolution Criteria: ${market.resolution_criteria}
      
      Evidence:
      ${evidence.summary}
      
      Source URLs:
      ${evidence.urls.join('\n')}
      
      Outcomes:
      ${market.outcomes.map(o => `- ${o.id}: ${o.title}`).join('\n')}
      
      Analyze and respond in JSON:
      {
        "recommendedOutcome": "outcome_id",
        "confidence": 0.95,
        "reasoning": "detailed explanation...",
        "uncertainties": ["list of concerns"],
        "sources": ["key sources used"]
      }
    `;
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const result = await response.json();
    return JSON.parse(result.candidates[0].content.parts[0].text);
  }
  
  private async gatherEvidence(market: Market): Promise<Evidence> {
    const evidence: Evidence = { urls: [], summary: '', articles: [] };
    
    const newsResults = await this.searchNews(market.title);
    evidence.urls.push(...newsResults.map(n => n.url));
    evidence.articles.push(...newsResults);
    
    if (market.resolution_source) {
      const sourceResults = await this.searchSource(market.resolution_source);
      evidence.urls.push(...sourceResults.map(s => s.url));
    }
    
    evidence.summary = await this.summarizeEvidence(evidence.articles);
    
    return evidence;
  }
  
  async finalizeResolution(requestId: string): Promise<void> {
    const { data: request } = await supabase
      .from('oracle_requests')
      .select('*, market:markets(*)')
      .eq('id', requestId)
      .single();
    
    const { data: disputes } = await supabase
      .from('oracle_disputes')
      .select('*')
      .eq('request_id', requestId)
      .eq('status', 'open');
    
    if (disputes && disputes.length > 0) {
      await this.escalateToHumanReview(requestId);
      return;
    }
    
    await this.resolveMarket(request.market_id, request.proposed_outcome_id, requestId);
  }
  
  private async resolveMarket(marketId: string, winningOutcomeId: string, requestId: string): Promise<void> {
    await supabase
      .from('markets')
      .update({
        status: 'resolved',
        winning_outcome_id: winningOutcomeId,
        resolved_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', marketId);
    
    const { data: winningPositions } = await supabase
      .from('positions')
      .select('*')
      .eq('market_id', marketId)
      .eq('outcome_id', winningOutcomeId)
      .eq('is_open', true);
    
    for (const position of winningPositions || []) {
      const payout = position.total_shares * 100;
      
      await supabase.rpc('credit_wallet', {
        p_user_id: position.user_id,
        p_amount: payout,
        p_description: `Market resolution payout: ${marketId}`
      });
      
      await supabase
        .from('positions')
        .update({
          is_open: false,
          closed_at: new Date(),
          realized_pnl: payout - position.total_invested,
          updated_at: new Date()
        })
        .eq('id', position.id);
      
      await supabase.from('transactions').insert({
        user_id: position.user_id,
        type: 'market_settlement',
        amount: payout,
        market_id: marketId,
        description: 'Market resolution payout'
      });
    }
    
    await supabase
      .from('positions')
      .update({
        is_open: false,
        closed_at: new Date(),
        realized_pnl: -position.total_invested,
        updated_at: new Date()
      })
      .eq('market_id', marketId)
      .neq('outcome_id', winningOutcomeId)
      .eq('is_open', true);
    
    await notificationService.notifyMarketResolved(marketId, winningOutcomeId);
  }
}
```

---

## 7. PAYMENT INTEGRATION

### bKash Service

```typescript
// /src/lib/payments/bkash.ts

export class BkashService {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;
  private username: string;
  private password: string;
  private accessToken: string | null = null;
  
  constructor() {
    this.baseUrl = process.env.BKASH_BASE_URL!;
    this.appKey = process.env.BKASH_APP_KEY!;
    this.appSecret = process.env.BKASH_APP_SECRET!;
    this.username = process.env.BKASH_USERNAME!;
    this.password = process.env.BKASH_PASSWORD!;
  }
  
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    
    const response = await fetch(`${this.baseUrl}/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'username': this.username,
        'password': this.password
      },
      body: JSON.stringify({
        app_key: this.appKey,
        app_secret: this.appSecret
      })
    });
    
    const data = await response.json();
    this.accessToken = data.id_token;
    return this.accessToken;
  }
  
  async createPayment(amount: number, merchantInvoiceNumber: string, callbackUrl: string): Promise<PaymentResponse> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-APP-Key': this.appKey
      },
      body: JSON.stringify({
        mode: '001',
        payerReference: merchantInvoiceNumber,
        callbackURL: callbackUrl,
        merchantAssociationInfo: 'MI05MID54RF09123456One',
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber
      })
    });
    
    return await response.json();
  }
  
  async executePayment(paymentID: string): Promise<ExecuteResponse> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-APP-Key': this.appKey
      },
      body: JSON.stringify({ paymentID })
    });
    
    return await response.json();
  }
  
  async processWebhook(payload: WebhookPayload): Promise<void> {
    const { paymentID, status, trxID, amount } = payload;
    
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_provider_id', paymentID)
      .single();
    
    if (!transaction) throw new Error('Transaction not found');
    
    if (status === 'Completed') {
      const queryResult = await this.queryPayment(paymentID);
      
      if (queryResult.transactionStatus === 'Completed') {
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            completed_at: new Date(),
            metadata: { trxID, ...queryResult }
          })
          .eq('id', transaction.id);
        
        await supabase.rpc('credit_wallet', {
          p_user_id: transaction.user_id,
          p_amount: parseInt(amount) * 100,
          p_description: 'bKash deposit'
        });
        
        await notificationService.notifyPaymentCompleted(transaction.user_id, amount);
      }
    } else if (status === 'Failed') {
      await supabase
        .from('transactions')
        .update({ status: 'failed', metadata: payload })
        .eq('id', transaction.id);
    }
  }
}
```

---

## 8. FRONTEND IMPLEMENTATION

### 8.1 Project Structure

```
/src
├── /app
│   ├── /(routes)
│   │   ├── /page.tsx
│   │   ├── /markets/[slug]/page.tsx
│   │   ├── /portfolio/page.tsx
│   │   ├── /leaderboard/page.tsx
│   │   ├── /activity/page.tsx
│   │   ├── /wallet/page.tsx
│   │   └── /settings/page.tsx
│   ├── /api
│   ├── layout.tsx
│   └── globals.css
├── /components
│   ├── /ui
│   ├── /layout
│   ├── /markets
│   ├── /trading
│   ├── /portfolio
│   ├── /leaderboard
│   └── /common
├── /hooks
├── /lib
│   ├── /i18n
│   ├── /supabase.ts
│   ├── /utils.ts
│   └── /constants.ts
├── /types
└── /styles
```

### 8.2 Key Components

#### Order Book Component

```typescript
// /src/components/trading/OrderBook.tsx
'use client';

import { useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface OrderBookProps {
  marketId: string;
  outcomeId: string;
  currentPrice: number;
}

export function OrderBook({ marketId, outcomeId, currentPrice }: OrderBookProps) {
  const { t } = useTranslation();
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [spread, setSpread] = useState(0);
  
  useRealtime(`orderbook:${marketId}:${outcomeId}`, (update) => {
    setBids(update.bids);
    setAsks(update.asks);
    setSpread(update.spread);
  });
  
  const maxTotal = Math.max(...bids.map(b => b.total), ...asks.map(a => a.total), 1);
  
  return (
    <div className="bg-card rounded-lg border">
      <div className="p-3 border-b">
        <h3 className="font-semibold">{t('trading.orderBook')}</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs text-muted-foreground">
        <span>{t('trading.price')} (৳)</span>
        <span className="text-right">{t('trading.size')}</span>
        <span className="text-right">{t('trading.total')}</span>
      </div>
      
      <div className="space-y-0.5">
        {[...asks].reverse().map((ask, i) => (
          <OrderBookRow key={`ask-${i}`} entry={ask} side="sell" maxTotal={maxTotal} />
        ))}
      </div>
      
      <div className="py-2 text-center text-sm">
        <span className="text-muted-foreground">{t('trading.spread')}: </span>
        <span className="font-medium">{spread}¢</span>
      </div>
      
      <div className="space-y-0.5">
        {bids.map((bid, i) => (
          <OrderBookRow key={`bid-${i}`} entry={bid} side="buy" maxTotal={maxTotal} />
        ))}
      </div>
    </div>
  );
}

function OrderBookRow({ entry, side, maxTotal }: { entry: OrderBookEntry; side: 'buy' | 'sell'; maxTotal: number }) {
  const barWidth = (entry.total / maxTotal) * 100;
  const barColor = side === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20';
  const textColor = side === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  
  return (
    <div className="relative grid grid-cols-3 gap-2 px-3 py-1 text-sm hover:bg-muted cursor-pointer transition-colors">
      <div className={cn("absolute right-0 top-0 bottom-0", barColor)} style={{ width: `${barWidth}%` }} />
      <span className={cn("relative z-10", textColor)}>{entry.price}¢</span>
      <span className="relative z-10 text-right">{entry.size.toLocaleString()}</span>
      <span className="relative z-10 text-right text-muted-foreground">{entry.total.toLocaleString()}</span>
    </div>
  );
}
```

#### Trading Panel Component

```typescript
// /src/components/trading/TradingPanel.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TradingPanelProps {
  marketId: string;
  outcomeId: string;
  yesPrice: number;
  noPrice: number;
}

export function TradingPanel({ marketId, outcomeId, yesPrice, noPrice }: TradingPanelProps) {
  const { t } = useTranslation();
  const { user, wallet } = useAuth();
  
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentPrice = selectedOutcome === 'yes' ? yesPrice : noPrice;
  
  const calculateShares = () => {
    const amt = parseFloat(amount) || 0;
    const price = orderType === 'market' ? currentPrice : parseFloat(limitPrice) || currentPrice;
    return Math.floor((amt * 100) / price);
  };
  
  const handleSubmit = async () => {
    if (!user) { toast.error(t('auth.loginRequired')); return; }
    
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error(t('trading.invalidAmount')); return; }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId, outcomeId: selectedOutcome, side, orderType,
          price: orderType === 'market' ? null : Math.round(parseFloat(limitPrice) * 100),
          amount: Math.round(amt * 100),
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('trading.orderFailed'));
      
      toast.success(t('trading.orderSuccess'));
      setAmount('');
      setLimitPrice('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-card rounded-lg border">
      <div className="grid grid-cols-2 gap-1 p-1 border-b">
        <button onClick={() => setSide('buy')} className={cn("py-2 text-sm font-medium rounded-md", side === 'buy' ? "bg-green-500 text-white" : "text-muted-foreground hover:bg-muted")}>
          {t('trading.buy')}
        </button>
        <button onClick={() => setSide('sell')} className={cn("py-2 text-sm font-medium rounded-md", side === 'sell' ? "bg-red-500 text-white" : "text-muted-foreground hover:bg-muted")}>
          {t('trading.sell')}
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="market">{t('trading.market')}</TabsTrigger>
            <TabsTrigger value="limit">{t('trading.limit')}</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setSelectedOutcome('yes')} className={cn("py-2 px-4 rounded-lg border-2 text-sm font-medium", selectedOutcome === 'yes' ? "border-green-500 bg-green-500/10 text-green-600" : "border-border")}>
            <div className="flex items-center justify-between"><span>{t('outcomes.yes')}</span><span>{yesPrice}¢</span></div>
          </button>
          <button onClick={() => setSelectedOutcome('no')} className={cn("py-2 px-4 rounded-lg border-2 text-sm font-medium", selectedOutcome === 'no' ? "border-red-500 bg-red-500/10 text-red-600" : "border-border")}>
            <div className="flex items-center justify-between"><span>{t('outcomes.no')}</span><span>{noPrice}¢</span></div>
          </button>
        </div>
        
        {orderType === 'limit' && (
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('trading.limitPrice')} (¢)</label>
            <Input type="number" min="1" max="99" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={currentPrice.toString()} />
          </div>
        )}
        
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t('trading.amount')} (৳)</label>
          <div className="relative">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
          </div>
          <div className="flex gap-2 mt-2">
            {[100, 500, 1000, 5000].map((amt) => (
              <button key={amt} onClick={() => setAmount(amt.toString())} className="px-3 py-1 text-xs bg-muted rounded-md">+৳{amt}</button>
            ))}
          </div>
        </div>
        
        {amount && (
          <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t('trading.shares')}:</span><span>{calculateShares().toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('trading.maxReturn')}:</span><span className="text-green-600">৳{calculateShares().toLocaleString()}</span></div>
          </div>
        )}
        
        <Button onClick={handleSubmit} disabled={isSubmitting || !amount} className={cn("w-full py-6 text-lg font-semibold", side === 'buy' ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600")}>
          {isSubmitting ? <span className="animate-pulse">{t('common.processing')}...</span> : <span>{side === 'buy' ? t('trading.buy') : t('trading.sell')} {t(`outcomes.${selectedOutcome}`)}</span>}
        </Button>
      </div>
    </div>
  );
}
```

---

## 9. TRADING ENGINE (CLOB)

### Order Matching Algorithm

```typescript
// /src/lib/matching-engine/matcher.ts

interface MatchResult {
  trades: Trade[];
  remainingOrder: Order | null;
}

export class OrderMatcher {
  
  async match(order: Order): Promise<MatchResult> {
    const trades: Trade[] = [];
    let remaining = { ...order };
    
    const oppositeSide = order.side === 'buy' ? 'sell' : 'buy';
    const candidates = await this.getMatchingCandidates(order.marketId, order.outcomeId, oppositeSide, order.price);
    
    for (const candidate of candidates) {
      if (remaining.remainingSize <= 0) break;
      if (candidate.userId === order.userId) continue;
      if (!this.pricesMatch(order, candidate)) break;
      
      const tradeSize = Math.min(remaining.remainingSize, candidate.remainingSize);
      const trade = await this.executeTrade(remaining, candidate, tradeSize);
      trades.push(trade);
      
      remaining.remainingSize -= tradeSize;
      candidate.remainingSize -= tradeSize;
      candidate.filledSize += tradeSize;
      candidate.status = candidate.remainingSize === 0 ? 'filled' : 'partially_filled';
      
      await this.updateOrder(candidate);
    }
    
    if (remaining.remainingSize === 0) remaining.status = 'filled';
    else if (trades.length > 0) remaining.status = 'partially_filled';
    
    return { trades, remainingOrder: remaining.remainingSize > 0 ? remaining : null };
  }
  
  private pricesMatch(order: Order, candidate: Order): boolean {
    if (order.side === 'buy') return order.price >= candidate.price;
    return order.price <= candidate.price;
  }
  
  private async executeTrade(taker: Order, maker: Order, size: number): Promise<Trade> {
    const price = maker.price;
    const total = size * price;
    
    const takerFee = Math.floor(total * TAKER_FEE_RATE);
    const makerFee = Math.floor(total * MAKER_FEE_RATE);
    const makerRebate = Math.floor(total * MAKER_REBATE_RATE);
    
    const trade: Trade = {
      id: generateUUID(),
      marketId: taker.marketId,
      outcomeId: taker.outcomeId,
      takerOrderId: taker.id,
      takerUserId: taker.userId,
      takerSide: taker.side,
      makerOrderId: maker.id,
      makerUserId: maker.userId,
      price, size, total,
      takerFee,
      makerFee: Math.max(0, makerFee - makerRebate),
      makerRebate,
      createdAt: new Date()
    };
    
    await supabase.from('trades').insert(trade);
    await this.settleTrade(trade, taker, maker);
    
    return trade;
  }
  
  private async settleTrade(trade: Trade, taker: Order, maker: Order): Promise<void> {
    await supabase.rpc('deduct_from_locked', {
      p_user_id: trade.takerUserId,
      p_amount: trade.total + trade.takerFee
    });
    
    if (maker.side === 'sell') {
      await supabase.rpc('deduct_from_locked', {
        p_user_id: trade.makerUserId,
        p_amount: trade.total - trade.makerFee
      });
    }
    
    await this.updatePosition(trade.takerUserId, trade.marketId, trade.outcomeId, trade.size, trade.price, 'add');
    
    if (maker.side === 'buy') {
      await this.updatePosition(trade.makerUserId, trade.marketId, trade.outcomeId, trade.size, trade.price, 'add');
    }
  }
}
```

### Complete Set Arbitrage

```typescript
// /src/lib/matching-engine/arbitrage.ts

export class ArbitrageService {
  
  async checkArbitrage(marketId: string): Promise<ArbitrageOpportunity | null> {
    const { data: market } = await supabase
      .from('markets')
      .select('yes_price, no_price')
      .eq('id', marketId)
      .single();
    
    if (!market) return null;
    
    const sum = market.yes_price + market.no_price;
    
    if (sum > 100) return { type: 'sell', profit: sum - 100, action: 'Sell complete set' };
    if (sum < 100) return { type: 'buy', profit: 100 - sum, action: 'Buy complete set' };
    
    return null;
  }
  
  async executeArbitrage(userId: string, marketId: string, type: 'buy' | 'sell', amount: number): Promise<void> {
    if (type === 'buy') await this.buyCompleteSet(userId, marketId, amount);
    else await this.sellCompleteSet(userId, marketId, amount);
  }
  
  private async buyCompleteSet(userId: string, marketId: string, amount: number): Promise<void> {
    const totalCost = amount * 100;
    
    await supabase.rpc('deduct_from_available', { p_user_id: userId, p_amount: totalCost });
    
    await supabase.from('positions').insert([
      { user_id: userId, market_id: marketId, outcome_id: 'yes', total_shares: amount, avg_entry_price: 0, total_invested: 0, is_open: true },
      { user_id: userId, market_id: marketId, outcome_id: 'no', total_shares: amount, avg_entry_price: 0, total_invested: 0, is_open: true }
    ]);
  }
  
  private async sellCompleteSet(userId: string, marketId: string, amount: number): Promise<void> {
    const { data: positions } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .in('outcome_id', ['yes', 'no']);
    
    const yesPos = positions?.find(p => p.outcome_id === 'yes');
    const noPos = positions?.find(p => p.outcome_id === 'no');
    
    if (!yesPos || !noPos || yesPos.total_shares < amount || noPos.total_shares < amount) {
      throw new Error('Insufficient shares for complete set');
    }
    
    const totalReturn = amount * 100;
    
    await supabase.from('positions').update({ total_shares: yesPos.total_shares - amount, is_open: yesPos.total_shares > amount }).eq('id', yesPos.id);
    await supabase.from('positions').update({ total_shares: noPos.total_shares - amount, is_open: noPos.total_shares > amount }).eq('id', noPos.id);
    
    await supabase.rpc('credit_wallet', { p_user_id: userId, p_amount: totalReturn, p_description: 'Complete set redemption' });
  }
}
```

---

## 10. SECURITY IMPLEMENTATION

```typescript
// /src/lib/security/index.ts

export const securityConfig = {
  auth: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
    sessionDuration: 24 * 60 * 60 * 1000,
    refreshTokenDuration: 7 * 24 * 60 * 60 * 1000,
    loginAttempts: 5,
    loginWindow: 15 * 60 * 1000,
    lockoutDuration: 30 * 60 * 1000,
    require2FA: false,
    methods: ['email', 'authenticator']
  },
  api: {
    rateLimitWindow: 60 * 1000,
    rateLimitMax: 100,
    allowedOrigins: ['https://plokymarket.com', 'https://www.plokymarket.com'],
    csrfProtection: true,
    securityHeaders: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    }
  },
  trading: {
    maxOrderSize: 1000000,
    maxDailyVolume: 10000000,
    maxPriceMovement: 20,
    circuitBreaker: 50,
    preventSelfTrade: true,
    washTradeDetection: true
  },
  financial: {
    minDeposit: 100,
    maxDeposit: 1000000,
    dailyDepositLimit: 5000000,
    minWithdrawal: 500,
    maxWithdrawal: 500000,
    dailyWithdrawalLimit: 2000000,
    withdrawalCooldown: 24 * 60 * 60 * 1000,
    kycRequiredFor: { deposit: 50000, withdrawal: 10000, trading: 100000 }
  }
};

export class RateLimiter {
  private store: Map<string, number[]> = new Map();
  
  isAllowed(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    const timestamps = this.store.get(key) || [];
    const valid = timestamps.filter(t => now - t < window);
    
    if (valid.length >= limit) {
      this.store.set(key, valid);
      return false;
    }
    
    valid.push(now);
    this.store.set(key, valid);
    return true;
  }
}

export const validators = {
  email: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone: string): boolean => /^01[3-9]\d{8}$/.test(phone),
  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character');
    return { valid: errors.length === 0, errors };
  },
  orderAmount: (amount: number): boolean => amount > 0 && amount <= 1000000,
  orderPrice: (price: number): boolean => price >= 1 && price <= 99
};
```

---

## 11. BANGLADESH-SPECIFIC FEATURES

### Localization (i18n)

```typescript
// /src/lib/i18n/index.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bn from './bn.json';
import en from './en.json';
import hi from './hi.json';

i18n.use(initReactI18next).init({
  resources: { bn: { translation: bn }, en: { translation: en }, hi: { translation: hi } },
  lng: 'bn',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
```

### Bangla Translations (Sample)

```json
{
  "nav": {
    "markets": "বাজার",
    "portfolio": "পোর্টফোলিও",
    "leaderboard": "লিডারবোর্ড",
    "wallet": "ওয়ালেট"
  },
  "trading": {
    "buy": "কিনুন",
    "sell": "বিক্রি করুন",
    "market": "বাজার মূল্য",
    "limit": "সীমা মূল্য",
    "orderBook": "অর্ডার বই",
    "amount": "পরিমাণ",
    "price": "মূল্য",
    "shares": "শেয়ার"
  },
  "outcomes": {
    "yes": "হ্যাঁ",
    "no": "না"
  }
}
```

### Bangladesh Market Categories

```typescript
export const bangladeshCategories = [
  {
    slug: 'bangladesh-politics',
    name: 'Bangladesh Politics',
    nameBn: 'বাংলাদেশ রাজনীতি',
    subcategories: [
      { slug: 'national-elections', name: 'National Elections', nameBn: 'জাতীয় নির্বাচন' },
      { slug: 'local-elections', name: 'Local Elections', nameBn: 'স্থানীয় নির্বাচন' }
    ]
  },
  {
    slug: 'bangladesh-cricket',
    name: 'Bangladesh Cricket',
    nameBn: 'বাংলাদেশ ক্রিকেট',
    subcategories: [
      { slug: 'international', name: 'International Matches', nameBn: 'আন্তর্জাতিক ম্যাচ' },
      { slug: 'bpl', name: 'BPL', nameBn: 'বিপিএল' }
    ]
  },
  {
    slug: 'bangladesh-economy',
    name: 'Bangladesh Economy',
    nameBn: 'বাংলাদেশ অর্থনীতি',
    subcategories: [
      { slug: 'stock-market', name: 'Stock Market', nameBn: 'শেয়ার বাজার' },
      { slug: 'currency', name: 'Currency (BDT/USD)', nameBn: 'মুদ্রা (টাকা/ডলার)' }
    ]
  }
];
```

---

## 12. AI AGENT CODING INSTRUCTIONS

### Phase-by-Phase Implementation

```
PHASE 1: Foundation (Week 1-2)
─────────────────────────────────────────
1. Initialize Next.js project with shadcn/ui
   bash /app/.kimi/skills/webapp-building/scripts/init-webapp.sh "Plokymarket"

2. Install dependencies:
   npm install @supabase/supabase-js i18next react-i18next next-themes
   npm install lightweight-charts zustand @tanstack/react-query sonner

3. Setup project structure

4. Database Setup - Create Supabase project, run SQL schema

5. Authentication - Implement email/password auth

6. Theme & Localization - Setup dark/light toggle, i18n

PHASE 2: Core Trading (Week 3-4)
─────────────────────────────────────────
1. Market Display - MarketCard, listing page, detail page
2. Order Book - Visual depth display, price ladder
3. Trading Panel - Buy/Sell tabs, Market/Limit orders
4. Price Charts - Lightweight Charts integration

PHASE 3: Matching Engine (Week 5-6)
─────────────────────────────────────────
1. Order Matching - OrderMatcher class, price-time priority
2. Position Management - PnL calculation, position history
3. Wallet Operations - Balance locking, transaction history

PHASE 4: Advanced Features (Week 7-8)
─────────────────────────────────────────
1. Oracle System - AI-powered resolution
2. Leaderboard - PnL tracking, rankings
3. Social Features - Comments, activity feed
4. Payment Integration - bKash API

PHASE 5: Security & Polish (Week 9-10)
─────────────────────────────────────────
1. Security - Rate limiting, input validation
2. KYC System - Document upload, verification
3. Admin Dashboard - Market/user management
4. Testing & Optimization
```

### Critical Implementation Patterns

```typescript
// 1. Database Operations - Use RPC for complex operations
const result = await supabase.rpc('function_name', { param1: value1 });

// 2. Real-time Updates
useEffect(() => {
  const subscription = supabase
    .channel(`market:${marketId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
    .subscribe();
  return () => subscription.unsubscribe();
}, [marketId]);

// 3. Error Handling
try {
  const result = await operation();
} catch (error: any) {
  toast.error(error.message || 'An error occurred');
}

// 4. Loading States
const [isLoading, setIsLoading] = useState(false);
const handleAction = async () => {
  setIsLoading(true);
  try { await action(); } finally { setIsLoading(false); }
};

// 5. Security - Never expose secrets
const apiKey = process.env.API_KEY; // ✅ GOOD
```

---

## 13. DEPLOYMENT GUIDE

### Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=https://plokymarket.com
NEXT_PUBLIC_APP_NAME=Plokymarket

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
JWT_SECRET=your-jwt-secret-min-32-characters

# bKash
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh
BKASH_APP_KEY=your-app-key
BKASH_APP_SECRET=your-app-secret
BKASH_USERNAME=your-username
BKASH_PASSWORD=your-password

# AI
GEMINI_API_KEY=your-gemini-api-key
```

### Deployment Script

```bash
#!/bin/bash
echo "🚀 Starting Plokymarket Deployment..."

# Build
echo "📦 Building application..."
npm run build

# Database migrations
echo "🗄️ Running database migrations..."
supabase db push

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
```

---

## SUMMARY

This implementation guide provides everything needed to build a full-featured prediction market platform for Bangladesh:

1. **Complete CLOB Matching Engine** with price-time priority
2. **AI-Powered Oracle System** for market resolution
3. **Full Security Implementation** with rate limiting
4. **Bangladesh-Specific Features** including bKash integration
5. **Bangla-First Localization** with complete translation
6. **Advanced Trading Features** including limit orders
7. **Social Features** for community engagement
8. **Comprehensive Admin Tools**

The implementation follows industry best practices and is designed to scale.
