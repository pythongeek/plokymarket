# n8n Automation Workflows for Plokymarket

## Overview

This document provides complete n8n workflow configurations for automating key processes in Plokymarket.

---

## 📰 Workflow 1: News Scraper (Bangladesh)

**Purpose**: Scrape local news sources and identify potential prediction markets

**Trigger**: Schedule (every 6 hours)

### Nodes Configuration

#### 1. Schedule Trigger
```json
{
  "mode": "everyX",
  "value": 6,
  "unit": "hours"
}
```

#### 2. HTTP Request - Prothom Alo
```json
{
  "method": "GET",
  "url": "https://www.prothomalo.com/",
  "options": {
    "headers": {
      "User-Agent": "Mozilla/5.0"
    }
  }
}
```

#### 3. HTML Extract
```json
{
  "extractionMode": "css",
  "cssSelector": ".story-card",
  "extractionValues": [
    {
      "key": "title",
      "cssSelector": ".title",
      "returnValue": "text"
    },
    {
      "key": "url",
      "cssSelector": "a",
      "returnValue": "attribute",
      "attribute": "href"
    },
    {
      "key": "category",
      "cssSelector": ".category",
      "returnValue": "text"
    }
  ]
}
```

#### 4. Function - Filter Relevant News
```javascript
// Filter news articles relevant for prediction markets
const keywords = [
  'নির্বাচন', 'election',
  'ক্রিকেট', 'cricket',
  'অর্থনীতি', 'economy',
  'জিডিপি', 'GDP',
  'মূল্যস্ফীতি', 'inflation',
  'বাজেট', 'budget',
  'বিশ্বকাপ', 'world cup'
];

const articles = $input.all();
const relevant = [];

articles.forEach(article => {
  const title = article.json.title.toLowerCase();
  const isRelevant = keywords.some(keyword => 
    title.includes(keyword.toLowerCase())
  );
  
  if (isRelevant) {
    relevant.push({
      json: {
        ...article.json,
        scraped_at: new Date().toISOString(),
        source: 'prothom_alo'
      }
    });
  }
});

return relevant;
```

#### 5. AI Analysis (OpenAI)
```json
{
  "resource": "chat",
  "model": "gpt-4",
  "messages": {
    "messageType": "message",
    "values": [
      {
        "role": "system",
        "content": "You are a prediction market analyzer for Bangladesh. Analyze news articles and suggest binary prediction market questions. Return JSON: {suggested_question: string, question_bn: string, category: string, deadline: string, confidence: number}"
      },
      {
        "role": "user",
        "content": "Article: {{ $json.title }}\nSuggest a prediction market question."
      }
    ]
  }
}
```

#### 6. Function - Parse AI Response
```javascript
const response = $input.first().json;
let suggestion;

try {
  const content = response.choices[0].message.content;
  suggestion = JSON.parse(content);
} catch (error) {
  return [];
}

// Only return high-confidence suggestions
if (suggestion.confidence >= 0.7) {
  return [{
    json: {
      ...suggestion,
      article_url: $node["HTTP Request"].json.url,
      article_title: $node["HTTP Request"].json.title,
      created_at: new Date().toISOString()
    }
  }];
}

return [];
```

#### 7. Supabase - Store Suggestions
```json
{
  "operation": "insert",
  "table": "market_suggestions",
  "data": "={{ $json }}"
}
```

#### 8. Slack/Email Notification (Optional)
```json
{
  "text": "New market suggestion: {{ $json.suggested_question }}",
  "channel": "#market-suggestions"
}
```

---

## 🤖 Workflow 2: AI Oracle (Market Resolution)

**Purpose**: Automatically verify market outcomes using AI

**Trigger**: Webhook (triggered when market closes)

### Nodes Configuration

#### 1. Webhook Trigger
```json
{
  "path": "market-resolution",
  "method": "POST",
  "responseMode": "lastNode"
}
```

#### 2. Supabase - Get Market Details
```json
{
  "operation": "get",
  "table": "markets",
  "filters": {
    "field": "id",
    "operator": "eq",
    "value": "={{ $json.market_id }}"
  }
}
```

#### 3. HTTP Request - Search News
```json
{
  "method": "GET",
  "url": "https://www.google.com/search",
  "parameters": {
    "q": "={{ $node['Supabase'].json.question }} site:prothomalo.com OR site:thedailystar.net",
    "num": "10"
  }
}
```

#### 4. Function - Extract Search Results
```javascript
const html = $input.first().json.body;
const results = [];

// Simple regex to extract article titles and URLs
const titlePattern = /<h3[^>]*>(.*?)<\/h3>/g;
const urlPattern = /href="(https:\/\/[^"]+)"/g;

let match;
while ((match = titlePattern.exec(html)) !== null) {
  results.push({
    title: match[1].replace(/<[^>]*>/g, '')
  });
}

return results.map(r => ({ json: r }));
```

#### 5. HTTP Request - Fetch Article Content
```json
{
  "method": "GET",
  "url": "={{ $json.url }}"
}
```

#### 6. Function - Extract Article Text
```javascript
const html = $input.first().json.body;

// Remove HTML tags and extract text
const text = html
  .replace(/<script[^>]*>.*?<\/script>/gi, '')
  .replace(/<style[^>]*>.*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Take first 3000 characters
const excerpt = text.substring(0, 3000);

return [{
  json: {
    content: excerpt,
    url: $node['HTTP Request 1'].json.url
  }
}];
```

#### 7. OpenAI - Verify Outcome
```json
{
  "resource": "chat",
  "model": "gpt-4",
  "messages": {
    "messageType": "message",
    "values": [
      {
        "role": "system",
        "content": "You are a fact-checker for prediction markets. Based on news articles, determine if a market question resolved YES or NO. Return JSON: {outcome: 'YES'|'NO', confidence: 0-1, reasoning: string, sources: string[]}"
      },
      {
        "role": "user",
        "content": "Market Question: {{ $node['Supabase'].json.question }}\n\nNews Article:\n{{ $json.content }}\n\nDid the event happen? Return JSON only."
      }
    ]
  }
}
```

#### 8. Function - Parse AI Verification
```javascript
const response = $input.first().json;
let verification;

try {
  const content = response.choices[0].message.content;
  // Extract JSON from markdown code blocks if present
  const jsonMatch = content.match(/```json\n(.*?)\n```/s) || 
                    content.match(/\{.*\}/s);
  verification = JSON.parse(jsonMatch[1] || jsonMatch[0]);
} catch (error) {
  console.error('Failed to parse AI response:', error);
  return [];
}

return [{
  json: {
    market_id: $node['Webhook'].json.market_id,
    ai_result: verification.outcome,
    ai_confidence: verification.confidence,
    ai_reasoning: verification.reasoning,
    scraped_data: {
      sources: verification.sources,
      article_content: $node['Function 1'].json.content
    },
    status: 'pending',
    created_at: new Date().toISOString()
  }
}];
```

#### 9. Supabase - Store Verification
```json
{
  "operation": "insert",
  "table": "oracle_verifications",
  "data": "={{ $json }}"
}
```

#### 10. Conditional - Check Confidence
```javascript
// Only auto-resolve if confidence is very high
return $json.ai_confidence >= 0.95 ? [{ json: $json }] : [];
```

#### 11. Supabase - Auto-Resolve Market (if high confidence)
```json
{
  "operation": "update",
  "table": "markets",
  "filters": {
    "field": "id",
    "operator": "eq",
    "value": "={{ $json.market_id }}"
  },
  "data": {
    "status": "resolved",
    "winning_outcome": "={{ $json.ai_result }}",
    "resolved_at": "={{ new Date().toISOString() }}"
  }
}
```

#### 12. Function - Settle Market
```javascript
// Call settle_market PostgreSQL function
return [{
  json: {
    function: 'settle_market',
    market_id: $json.market_id,
    winning_outcome: $json.ai_result
  }
}];
```

#### 13. Supabase - Execute Settlement
```json
{
  "operation": "rpc",
  "function": "settle_market",
  "parameters": {
    "p_market_id": "={{ $json.market_id }}",
    "p_winning_outcome": "={{ $json.winning_outcome }}"
  }
}
```

#### 14. Slack Notification - Admin Review Required
```json
{
  "text": "⚠️ Market requires manual review\nQuestion: {{ $node['Supabase'].json.question }}\nAI Suggestion: {{ $json.ai_result }} ({{ $json.ai_confidence * 100 }}% confidence)\nReview: https://plokymarket.com/admin/verify/{{ $json.market_id }}",
  "channel": "#admin-alerts"
}
```

---

## 💳 Workflow 3: Payment Verification (bKash/Nagad)

**Purpose**: Verify and process payment transactions

**Trigger**: Webhook (from frontend when user submits payment)

### Nodes Configuration

#### 1. Webhook Trigger
```json
{
  "path": "payment-verify",
  "method": "POST",
  "responseMode": "lastNode"
}
```

#### 2. Supabase - Get Payment Details
```json
{
  "operation": "get",
  "table": "payment_transactions",
  "filters": {
    "field": "id",
    "operator": "eq",
    "value": "={{ $json.payment_id }}"
  }
}
```

#### 3. Function - Verify Transaction
```javascript
// In production, integrate with bKash/Nagad API
// For now, simulate verification

const payment = $input.first().json;
const method = payment.method;
const transactionId = payment.transaction_id;

// Simulate API call to payment provider
const isValid = transactionId && transactionId.length > 10;
const amount = payment.amount;

return [{
  json: {
    payment_id: payment.id,
    user_id: payment.user_id,
    is_valid: isValid,
    verified_amount: amount,
    verification_time: new Date().toISOString(),
    method: method
  }
}];
```

#### 4. Conditional - Valid Payment
```javascript
return $json.is_valid ? [{ json: $json }] : [];
```

#### 5. Supabase - Update Payment Status
```json
{
  "operation": "update",
  "table": "payment_transactions",
  "filters": {
    "field": "id",
    "operator": "eq",
    "value": "={{ $json.payment_id }}"
  },
  "data": {
    "status": "completed",
    "completed_at": "={{ new Date().toISOString() }}"
  }
}
```

#### 6. Supabase - Update Wallet Balance
```json
{
  "operation": "rpc",
  "function": "update_wallet_balance",
  "parameters": {
    "p_user_id": "={{ $json.user_id }}",
    "p_amount": "={{ $json.verified_amount }}"
  }
}
```

#### 7. Supabase - Create Transaction Record
```json
{
  "operation": "insert",
  "table": "transactions",
  "data": {
    "user_id": "={{ $json.user_id }}",
    "type": "deposit",
    "amount": "={{ $json.verified_amount }}",
    "metadata": {
      "payment_method": "={{ $json.method }}",
      "transaction_id": "={{ $node['Supabase'].json.transaction_id }}"
    }
  }
}
```

#### 8. Email Notification - Success
```json
{
  "to": "={{ $node['Supabase'].json.user_email }}",
  "subject": "Payment Successful - Plokymarket",
  "body": "Your deposit of ৳{{ $json.verified_amount }} has been successfully processed.\n\nTransaction ID: {{ $node['Supabase'].json.transaction_id }}\nNew Balance: Check your wallet\n\nThank you for using Plokymarket!"
}
```

#### 9. Conditional - Invalid Payment (else branch)
```javascript
return !$node['Conditional'].json.is_valid ? [{ json: $json }] : [];
```

#### 10. Supabase - Mark Payment Failed
```json
{
  "operation": "update",
  "table": "payment_transactions",
  "filters": {
    "field": "id",
    "operator": "eq",
    "value": "={{ $json.payment_id }}"
  },
  "data": {
    "status": "failed",
    "metadata": {
      "error": "Invalid transaction ID or amount mismatch"
    }
  }
}
```

---

## 📊 Workflow 4: Daily Statistics Update

**Purpose**: Update leaderboards and market statistics

**Trigger**: Schedule (daily at midnight)

### Nodes Configuration

#### 1. Schedule Trigger
```json
{
  "mode": "cron",
  "cronExpression": "0 0 * * *"
}
```

#### 2. Supabase - Calculate Daily Leaderboard
```json
{
  "operation": "rpc",
  "function": "calculate_leaderboard",
  "parameters": {
    "p_timeframe": "daily"
  }
}
```

#### 3. Supabase - Calculate Weekly Leaderboard
```json
{
  "operation": "rpc",
  "function": "calculate_leaderboard",
  "parameters": {
    "p_timeframe": "weekly"
  }
}
```

#### 4. Supabase - Calculate Monthly Leaderboard
```json
{
  "operation": "rpc",
  "function": "calculate_leaderboard",
  "parameters": {
    "p_timeframe": "monthly"
  }
}
```

#### 5. Supabase - Update Market Trends
```json
{
  "operation": "sql",
  "query": "UPDATE markets SET is_trending = (volume_24h > 1000) WHERE status = 'active'"
}
```

#### 6. Supabase - Reset Daily Volumes
```json
{
  "operation": "sql",
  "query": "UPDATE markets SET volume_24h = 0 WHERE status = 'active'"
}
```

#### 7. Function - Generate Daily Report
```javascript
const stats = {
  date: new Date().toISOString().split('T')[0],
  total_volume: $node['Supabase'].json.total_volume,
  active_markets: $node['Supabase 1'].json.count,
  total_trades: $node['Supabase 2'].json.count,
  active_users: $node['Supabase 3'].json.count
};

return [{ json: stats }];
```

#### 8. Slack Notification - Daily Report
```json
{
  "text": "📊 Daily Report - {{ $json.date }}\n\n• Total Volume: ${{ $json.total_volume }}\n• Active Markets: {{ $json.active_markets }}\n• Total Trades: {{ $json.total_trades }}\n• Active Users: {{ $json.active_users }}",
  "channel": "#daily-stats"
}
```

---

## 🔔 Workflow 5: User Notifications

**Purpose**: Send notifications for important events

**Trigger**: Database trigger (new activity)

### Nodes Configuration

#### 1. Webhook Trigger
```json
{
  "path": "user-notification",
  "method": "POST"
}
```

#### 2. Switch - Notification Type
```javascript
// Route based on notification type
const type = $json.notification_type;

return {
  trade_executed: type === 'trade_executed' ? 0 : undefined,
  order_filled: type === 'order_filled' ? 1 : undefined,
  market_resolved: type === 'market_resolved' ? 2 : undefined
};
```

#### 3. Branch: Trade Executed
```json
{
  "message": "Your {{ $json.side }} order for {{ $json.market_question }} was executed at {{ $json.price }}"
}
```

#### 4. Branch: Order Filled
```json
{
  "message": "Your order for {{ $json.market_question }} has been completely filled!"
}
```

#### 5. Branch: Market Resolved
```json
{
  "message": "Market resolved: {{ $json.market_question }}\nOutcome: {{ $json.winning_outcome }}\nYour P&L: {{ $json.pnl }}"
}
```

#### 6. Supabase - Store Notification
```json
{
  "operation": "insert",
  "table": "notifications",
  "data": {
    "user_id": "={{ $json.user_id }}",
    "type": "={{ $json.notification_type }}",
    "message": "={{ $json.message }}",
    "read": false
  }
}
```

---

## 🚀 Deployment Instructions

### 1. Import Workflows

```bash
# Copy workflow JSON files to n8n
cp workflows/*.json /path/to/n8n/workflows/
```

### 2. Configure Credentials

In n8n UI:

1. **Supabase Credentials**
   - Type: HTTP Header Auth
   - Name: apikey
   - Value: YOUR_SUPABASE_SERVICE_ROLE_KEY

2. **OpenAI Credentials**
   - Type: OpenAI API
   - API Key: YOUR_OPENAI_API_KEY

3. **Slack Credentials** (optional)
   - Type: Slack API
   - OAuth Token: YOUR_SLACK_TOKEN

### 3. Activate Workflows

In n8n UI, enable each workflow by clicking the toggle switch.

### 4. Test Workflows

- News Scraper: Trigger manually
- AI Oracle: Send test webhook
- Payment Verification: Submit test payment
- Daily Statistics: Trigger manually

---

## 📝 Environment Variables

Add these to your n8n environment:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# App
APP_URL=https://plokymarket.com
```

---

This comprehensive guide provides all the n8n workflow configurations your AI agent needs to automate Plokymarket processes!
