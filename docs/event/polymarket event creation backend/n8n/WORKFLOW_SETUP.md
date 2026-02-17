# Daily AI Topics Workflow Setup Guide (HTTP Version)

## Overview
This workflow automates prediction market topic generation using Supabase and Google Gemini.
**Update:** This version uses standard HTTP Request nodes, so **no external plugins are required.**

## Features
-   **Manual Input**: You can manually provide a list of URLs to scrape for testing.
-   **Auto-Fetch**: If no manual URLs are provided, it fetches active sources from Supabase.
-   **Gemini API**: Uses the standard HTTP node to call Gemini 1.5 Flash.

## Import Instructions
1.  Open your n8n Dashboard.
2.  **Workflows** > **Add Workflow** > **Import from File**.
3.  Select: `docs/event/polymarket event creation backend/n8n/daily_ai_topics.json`.

## Configuration Steps

### 1. Configure "Config: Manual URLs (Optional)"
-   Double-click the node named **Config: Manual URLs (Optional)**.
-   In the `manual_urls` field, you can enter comma-separated URLs (e.g., `https://example.com/news1, https://example.com/news2`).
-   **Leave it empty** to fetch from your Supabase database.

### 2. Configure Supabase Credentials
-   Double-click **Fetch News Sources**.
-   Create/Select your **Postgres** credential (Host, User, Password, Database).
-   *Repeat for the **Insert into Supabase** node.*

### 3. Configure Gemini API Key
-   Double-click **Gemini API (HTTP)**.
-   Under **Authentication**, select **Query Auth**.
-   Create a new credential:
    -   **Name**: `key` (This is the query parameter name required by Google).
    -   **Value**: Your Google Gemini API Key.
    -   *(Alternatively, paste `?key=YOUR_API_KEY` directly in the URL and remove authentication).*

## Troubleshooting
-   **"Unrecognized Node"**: Should be resolved as we removed the custom plugin.
-   **"400 Bad Request" (Gemini)**: Check your API key and ensure the JSON body structure is correct.
-   **Empty Results**: Ensure your news sources in Supabase have `is_active = true` and `is_whitelisted = true`.
