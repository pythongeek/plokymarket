# n8n Workflow Guide

This guide details how to implement the required workflows in your n8n instance.

## 1. News Scraper (Market Intelligence)
**Goal**: Fetch news relevant to prediction markets and store/notify.

**Steps:**
1.  **Trigger**: `Schedule Trigger` (Interval: 1 hour).
2.  **Source**: `HTTP Request` or `RSS Feed Read`.
    - URL: `https://en.prothomalo.com/feed` or relevant sources.
3.  **Process**: `Code` node (JavaScript) to filter for keywords (e.g., "election", "cricket", "policy").
4.  **AI Analysis (Optional)**: `OpenAI` node.
    - Prompt: "Summarize this news and suggest a Yes/No betting market."
5.  **Output**: `Supabase` node.
    - Operation: Insert.
    - Table: `market_suggestions` (Create this table if needed) or just log to a Telegram channel.

## 2. AI Oracle (Market Resolution)
**Goal**: Automatically resolve markets based on real-world outcomes.

**Prerequisite**: A Table `markets` with `resolution_source` URL and `trading_closes_at`.

**Steps:**
1.  **Trigger**: `Webhook` (Method: POST) or `Schedule` (Every 15 mins).
    - If Schedule: Add `Supabase` node to fetch "Resolving" markets (Status: 'active', closes < now).
2.  **Loop**: `Split In Batches` (to process each market).
3.  **Fetch Evidence**: `HTTP Request`.
    - URL: `{{ $json.resolution_source }}`.
    - Return: HTML/Text.
4.  **Analyze**: `OpenAI` node.
    - Model: `gpt-4o-mini`.
    - System Message: "You are a Judge. Determine the outcome based on the text. Output YES or NO only."
    - User Message: "Market: {{ $json.question }}. Source Text: {{ $json.html_content }}."
5.  **Decision**: `If` node.
    - If output contains "YES" -> Route A.
    - If output contains "NO" -> Route B.
    - Else -> Route C (Manual Review).
6.  **Action**: `Supabase` node.
    - Route A/B: Call function `settle_market(market_id, outcome)`.
    - Route C: Send Slack/Telegram alert.

## 3. Payment Verification
**Goal**: Verify deposits from external payment gateways (bkash/nagad).

**Steps:**
1.  **Trigger**: `Webhook` (from App) or `Postgres Trigger` (on `INSERT` to `payment_transactions`).
2.  **Verify**: `HTTP Request`.
    - Call Payment Provider API with `transaction_id`.
3.  **Condition**: `If` node (Is Valid?).
    - True: Update record.
    - False: Flag as failed.
4.  **Update DB**: `Supabase` node.
    - Update `payment_transactions` set `status = 'completed'`.
    - Update `wallets` balance (handled by DB trigger or separate update).

## Next Steps
1.  Access n8n at `http://localhost:5678`.
2.  Set up Credentials for Supabase and OpenAI.
3.  Build these flows using the drag-and-drop editor.
