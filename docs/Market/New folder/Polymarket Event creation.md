# Frontend

# Backend

## **১. সিস্টেম আর্কিটেকচার ও ওয়ার্কফ্লো (Workflow)**

আমাদের সিস্টেমটি ইভেন্ট-ড্রিভেন (Event-driven) হবে। নিচে এর ধাপগুলো দেওয়া হলো:

1. **Trigger:** Supabase-এ কোনো ইভেন্টের সময় শেষ হলে একটি `Webhook` ফায়ার হবে।  
2. **Orchestration (n8n):** লোকাল ডকার n8n এই ওয়েবহুক গ্রহণ করবে। এটি Upstash Redis থেকে বর্তমান রেট লিমিট চেক করবে।  
3. **AI Verification (Gemini):** n8n থেকে Gemini API কল করে ইন্টারনেটে সার্চ (Google Search Tool ব্যবহার করে) করা হবে এবং ইভেন্টের ফলাফল নির্ধারণ করা হবে।  
4. **Edge Function (Vercel):** রেজাল্ট প্রসেসিং এবং ডিসপিউট হ্যান্ডলিংয়ের জন্য Vercel Edge Function ব্যবহার হবে যা সরাসরি Supabase-কে আপডেট করবে।

---

## **২. লজিক অ্যালগরিদম (Logic Algorithm)**

AI Oracle-এর মাধ্যমে সত্যতা যাচাই করার জন্য নিচের অ্যালগরিদমটি অনুসরণ করুন:

Code snippet  
graph TD  
    A\[Start Resolution\] \--\> B{Check Upstash Cache}  
    B \-- Found \--\> C\[Return Cached Result\]  
    B \-- Not Found \--\> D\[Call Gemini API with Search\]  
    D \--\> E{Confidence \> 90%?}  
    E \-- Yes \--\> F\[Update Status: Resolved\]  
    E \-- No \--\> G\[Update Status: Disputed/Manual\]  
    F \--\> H\[Trigger Payouts via Edge Function\]  
    G \--\> I\[Notify Admin\]

---

## **৩. টেক স্ট্যাক (Tech Stack)**

* **Database:** Supabase (PostgreSQL)  
* **Automation:** n8n (Self-hosted on Docker)  
* **Serverless/Edge:** Vercel Edge Functions (Next.js/TS)  
* **State/Rate Limit:** Upstash Redis  
* **AI Engine:** Gemini 1.5 Flash (for speed and low cost)

---

## **৪. বিস্তারিত বাস্তবায়ন নির্দেশিকা (Step-by-Step)**

### **ক. Upstash সেটআপ (Rate Limiting & Caching)**

Vercel Free Tier-এ ফাংশন রান টাইম খুব কম থাকে। তাই একই রিকোয়েস্ট বারবার প্রসেস না করতে Upstash ব্যবহার করুন।

TypeScript  
// Vercel Edge Function-এ Upstash ব্যবহার  
import { Redis } from '@upstash/redis'

const redis \= new Redis({  
  url: process.env.UPSTASH\_REDIS\_REST\_URL,  
  token: process.env.UPSTASH\_REDIS\_REST\_TOKEN,  
})

// রেজাল্ট ক্যাশ করা  
await redis.set(\`event\_res:${eventId}\`, result, { ex: 3600 }); 

### **খ. n8n এ Gemini AI Agent সেটআপ**

n8n-এ একটি workflow তৈরি করুন:

1. **Webhook Node:** Supabase থেকে আসা রিকোয়েস্ট রিসিভ করতে।  
2. **Gemini Node:** Gemini 1.5 Flash মডেল সিলেক্ট করুন।  
   * **Prompt:** `"Verify the winner of the event: [Event Name]. Use web search to find the official result. Output JSON: {result: 1|2, confidence: 0-100, source: 'URL'}"`  
3. **HTTP Request Node:** Vercel Edge Function-কে কল করুন রেজাল্ট পুশ করার জন্য।

### **গ. Vercel-এ Deployment Verification AI Agent**

ডেপ্লয়মেন্ট সঠিক হয়েছে কি না তা চেক করার জন্য একটি স্ক্রিপ্ট ব্যবহার করুন যা Gemini-কে নির্দেশ দিবে আপনার Vercel URL চেক করতে।

**AI Instruction for Verification:**

"তোমার কাজ হলো এই Vercel deployment URL-টি ভিজিট করা এবং চেক করা যে রেজোলিউশন সিস্টেমের API এন্ডপয়েন্টগুলো (যেমন `/api/resolve`) সঠিক JSON রেসপন্স দিচ্ছে কি না। যদি কোনো ৫-সেকেন্ড টাইমআউট এরর পাও, তবে তা রিপোর্ট করো।"

---

## **৫. কেন আমরা এই পদ্ধতিতে করছি? (Optimization)**

* **Vercel Edge Function:** স্ট্যান্ডার্ড ল্যাম্বডা ফাংশনের চেয়ে দ্রুত এবং কোল্ড স্টার্ট নেই। এটি আমাদের ১০ সেকেন্ডের লিমিটের মধ্যে কাজ শেষ করতে সাহায্য করবে।  
* **n8n on Local Docker:** ক্লাউড অটোমেশন টুলের (যেমন Zapier) খরচ বাঁচাবে।  
* **Gemini 1.5 Flash:** এটি বর্তমানে বাজারের অন্যতম দ্রুততম এবং সস্তা মডেল, যা আমাদের রেজোলিউশন লজিককে রিয়েল-টাইম অনুভূতি দেবে।

# Tab 3

# **Bangladeshi Prediction Market Platform: Full Conceptual Overview (Next.js \+ Supabase \+ bKash/Nagad)**

## **1\. Event Creation Workflow (Backend)**

### **1.1 Database Schema Design in Supabase**

#### **1.1.1 Core Events Table Structure**

The events table serves as the foundation of your prediction market, requiring careful design to handle time-bound betting markets with proper audit trails and regulatory compliance. Each event needs a UUID primary key (`event_id`) generated via `gen_random_uuid()` for global uniqueness without sequential enumeration risks. The title field must support both English and Bangla Unicode (UTF-8) with 500-character limit—critical for local market engagement where users search in Banglish or Bengali script.

Temporal management demands four distinct timestamps: `created_at` (record insertion), `starts_at` (betting opens), `ends_at` (betting closes), and `resolves_at` (outcome known). These must use `TIMESTAMP WITH TIME ZONE` to handle Bangladesh Standard Time (BST, UTC+6) correctly while allowing future international expansion. The status field implements a state machine: `draft` → `pending_approval` → `active` → `suspended` → `closed` → `resolving` → `resolved` → `cancelled`. PostgreSQL CHECK constraints prevent invalid transitions—for example, blocking `active` → `draft` or `resolved` → `active`.

Financial tracking fields include `total_pool_amount` (DECIMAL(15,2)), `platform_fee_percentage` (typically 2.00–5.00%), `minimum_bet_amount` (default ৳10), and `maximum_bet_amount` (KYC-tiered, starting ৳10,000). The `creator_id` references `auth.users` with ON DELETE RESTRICT to prevent accidental deletion of event creators. Row Level Security (RLS) policies enforce: creators can modify `draft` events only; admins with `event_approval` role can transition to `active`; and only `super_admin` or dual-approved admins can modify `active` events.

TableCopy

| Field | Type | Purpose |
| :---- | :---- | :---- |
| `event_id` | UUID | Primary key, global unique |
| `title` | VARCHAR(500) | Bilingual event title (EN/BN) |
| `description` | TEXT | Resolution criteria, sources |
| `category_id` | UUID → categories | Sports, politics, finance, etc. |
| `starts_at`, `ends_at`, `resolves_at` | TIMESTAMPTZ | Betting window and resolution time |
| `status` | ENUM | State machine with 8 values |
| `total_pool_amount` | DECIMAL(15,2) | Running total of all bets |
| `platform_fee_percentage` | DECIMAL(4,2) | Revenue share (2–5%) |
| `creator_id` | UUID → auth.users | Event proposer |
| `resolution_source` | TEXT | URL/API for outcome verification |

*Table 1: Core events table structure with field specifications*

#### **1.1.2 Outcomes/Predictions Table**

The outcomes table normalizes multiple prediction options per event with `event_id` foreign key and ON DELETE CASCADE. Each outcome requires mutually exclusive, collectively exhaustive options—meaning every possible result maps to exactly one outcome. For a cricket match: "Bangladesh wins", "India wins", "Draw/Tie", "No result" (rain/abandonment).

Odds calculation uses parimutuel mechanics where displayed odds emerge from betting patterns, not fixed prices. Critical fields: `initial_probability` (admin's opening assessment, sum to 1.0), `current_probability` (dynamic), `current_odds_decimal` (e.g., 2.50 for 2.5x return), `total_bets_count`, and `total_amount_staked`. A database trigger recalculates all outcome probabilities after each bet insertion using the formula: `current_probability = total_amount_staked / event.total_pool_amount`.

The `is_winner` field remains NULL until resolution, then set TRUE/FALSE with `resolved_at` timestamp and `resolved_by` admin reference. This prevents premature leakage and enables audit trails. Color coding (`#RRGGBB`) and `position_index` control visual presentation in betting interfaces.

TableCopy

| Outcome Type | Example | Probability Handling |
| :---- | :---- | :---- |
| Binary | Yes/No referendum | Two outcomes, sum to 1.0 |
| Multiple discrete | Election candidates | N outcomes \+ "Other" |
| Range-based | Temperature bracket | Continuous discretization |
| Compound | Match score \+ MVP | Correlated outcomes (advanced) |

*Table 2: Outcome types and probability modeling approaches*

#### **1.1.3 User Bets Table**

The bets table captures every financial transaction with immutable audit trails. The composite unique constraint on `(user_id, event_id, outcome_id, placed_at)` prevents duplicate submissions while allowing additive betting (same user, same outcome, multiple times). Critical fields: `bet_amount` (DECIMAL(12,2)), `accepted_odds` (snapshot at placement), `potential_payout` (calculated as `bet_amount * accepted_odds`), and `actual_payout` (populated on resolution).

Status state machine: `pending_payment` → `confirmed` → `active` → `won`/`lost` → `paid_out`/`forfeited`. The `pending_payment` state handles the async gap between bet placement and bKash/Nagad confirmation—preventing users from betting with unconfirmed deposits. Regulatory fields: `ip_address` (INET type), `user_agent_hash`, `device_fingerprint`, and `supabase_auth_session_id` link bets to authentication logs for fraud investigation.

TableCopy

| Status | Meaning | Transition Trigger |
| :---- | :---- | :---- |
| `pending_payment` | Awaiting deposit confirmation | Payment gateway callback |
| `confirmed` | Funds verified, bet active | Automatic |
| `active` | Event live, bet locked | `starts_at` reached |
| `won` | Correct outcome selected | Admin resolution |
| `lost` | Incorrect outcome | Admin resolution |
| `paid_out` | Winnings credited | Balance update transaction |
| `cancelled` | Event voided, refunded | Admin cancellation |
| `refunded` | Manual refund processed | Support intervention |

*Table 3: Bet status lifecycle and transition triggers*

### **1.2 API Endpoints & Security**

#### **1.2.1 Admin-Only Event Creation**

Supabase Edge Functions provide the optimal execution environment for sensitive event creation—running Deno at global edge locations with direct database access and encrypted environment variables. The `create-event` function implements defense-in-depth security: JWT validation via `supabase.auth.getUser()`, role verification against `admin_roles` table, Zod schema validation for all inputs, and PostgreSQL transaction wrapping for atomic multi-table insertion.

Rate limiting prevents spam: 10 events/hour per admin IP, with exponential backoff violations. Content moderation scans titles and descriptions for prohibited content (gambling inducements, political manipulation) using keyword lists and optional ML classification. Approval workflows escalate based on pool size: automatic for \<৳10,000, single admin for \<৳100,000, dual-signature required for ≥৳100,000 with 4-hour minimum review window.

The Edge Function returns 201 Created with complete event object including generated `slug` for SEO-friendly URLs (`/events/bangladesh-india-2027-world-cup`). Image uploads use signed Supabase Storage URLs with 5-minute expiry, validating dimensions (min 800×450, max 4096×2304) and formats (JPEG, PNG, WebP).

#### **1.2.2 Real-time Updates**

Database webhooks trigger on critical state changes: `event.status` → `active` invalidates CDN caches and sends push notifications; `event.status` → `resolved` initiates payout calculation workflow. Webhooks execute asynchronously via `pg_net` HTTP extension, with dead-letter queue for failed deliveries and PagerDuty alerting on persistent failures.

Supabase Realtime provides WebSocket subscriptions for live odds updates. Channel design: `event:${event_id}` for public odds/pool updates (no auth required), `user:${user_id}` for personal bet confirmations and balance changes (JWT-authenticated). Throttling limits odds broadcasts to 10Hz per event—batching rapid changes prevents client re-render storms while maintaining perceived real-time experience.

TableCopy

| Update Type | Channel | Payload | Frequency |
| :---- | :---- | :---- | :---- |
| Odds change | `event:${id}` | `{outcome_id, new_odds, pool_delta}` | Throttled 10Hz |
| Bet confirmed | `user:${id}` | `{bet_id, status, balance_after}` | Immediate |
| Event resolved | `event:${id}` | `{winning_outcome, final_odds}` | Once |
| Balance change | `user:${id}` | `{new_balance, transaction_type}` | Immediate |

*Table 4: Realtime channel architecture and update patterns*

## **2\. Frontend Data Fetching & Display**

### **2.1 Data Retrieval Patterns**

#### **2.1.1 Server-Side Fetching (Next.js App Router)**

React Server Components execute Supabase queries during request processing, streaming HTML without client-side JavaScript for initial load. The server-client configuration uses service role key with restricted IP allowlisting—bypassing RLS for trusted internal operations while maintaining audit logging.

Parallel data fetching with `Promise.all()` optimizes event listings: active events (cached 60s), trending events (cached 10s), and user recommendations (dynamic). The query pattern uses explicit column selection and keyset pagination (`WHERE id > last_seen ORDER BY id LIMIT 20`) rather than offset pagination for consistent performance at scale.

TypeScriptCopy

*// Server Component pattern*  
const supabase \= createServerClient(  
  process.env.NEXT\_PUBLIC\_SUPABASE\_URL\!,  
  process.env.SUPABASE\_SERVICE\_ROLE\_KEY\!,  
  { cookies: { get: (name) \=\> cookieStore.get(name)?.value } }  
);

const { data: events } \= await supabase  
  .from('events')  
  .select('id, title, slug, ends\_at, total\_pool\_amount, outcomes(id, current\_odds)')  
  .eq('status', 'active')  
  .gt('ends\_at', new Date().toISOString())  
  .order('featured\_priority', { ascending: false })  
  .order('total\_pool\_amount', { ascending: false })

  .limit(24);

ISR (Incremental Static Regeneration) with `revalidate: 60` and `fallback: 'blocking'` enables pre-rendered popular events with on-demand generation for long-tail content. The `unstable_cache` API memoizes expensive queries across requests.

#### **2.1.2 Client-Side Interactivity**

TanStack Query provides sophisticated caching with stale-while-revalidate semantics: `staleTime: 10000` (10s fresh data), `refetchInterval: 30000` (30s background refresh), and `retry: 3` with exponential backoff. Optimistic updates for bet placement: immediate local state reflection with rollback on error, synchronized via `queryClient.setQueryData()`.

Supabase Realtime subscriptions complement polling for true real-time experience. The `useEventRealtime` hook manages WebSocket lifecycle: subscribe on mount, unsubscribe on unmount, exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s with jitter). Missed updates recover through periodic SWR revalidation.

### **2.2 UI Components Structure**

#### **2.2.1 Event Listing Page**

Responsive masonry grid adapts: 1 column (mobile), 2 (tablet), 3–4 (desktop). Each event card displays: hero image with lazy loading and blur placeholder, title (2-line clamp with full tooltip), category badge, live countdown (client-side animated), total pool with Bengali numeral formatting (e.g., "৳১২,৫০,০০০"), and primary action.

Filtering uses URL-synced state for shareability: `/events?category=sports&sort=ending_soon&search=cricket`. Debounced search (300ms) with PostgreSQL full-text search on `title` and `description`. Infinite scroll via Intersection Observer with 500px root margin prefetches next page before user reaches bottom.

TableCopy

| Filter Type | Implementation | Performance |
| :---- | :---- | :---- |
| Category | Multi-select pills, URL-encoded | Indexed ENUM, O(1) |
| Date range | Calendar picker, BST timezone | `ends_at` range query |
| Pool size | Slider (1K–1M+ BDT) | Materialized view |
| Search | Debounced 300ms | GIN full-text index |
| Sort | Dropdown (trending/ending/pool/new) | Composite index |

*Table 5: Event filtering implementation and optimization*

#### **2.2.2 Event Detail Page**

Hero section (server-rendered): event title, full description with Markdown rendering, resolution criteria, and official source links. Odds visualization uses Recharts area chart showing probability history (if tracked) or current distribution bar. Real-time odds panel (client component) displays all outcomes with: current decimal/fractional odds, implied probability percentage, pool contribution bar, and dynamic payout calculator updating as user selects amount.

Bet placement interface implements: amount input with quick-select buttons (৳100, ৳500, ৳1000, ৳5000), real-time validation against available balance, odds lock for 30 seconds (preventing slippage during confirmation), and modal confirmation with terms acknowledgment. Form submission triggers Supabase Edge Function with idempotency key to prevent double-spending.

#### **2.2.3 User Dashboard**

Balance overview card shows: available balance, pending bets (at risk), pending withdrawals (locked), and lifetime statistics. Active bets table with columns: event thumbnail, chosen outcome, stake, current estimated value (based on live odds), time to resolution, and cash-out option (if implemented). Transaction history integrates deposits, bets, winnings, and withdrawals with: type icons, amount with sign, running balance, and expandable details with gateway reference.

Export functionality generates CSV/PDF for tax compliance, with Bangladeshi fiscal year alignment (July–June). Pagination handles large histories with summary statistics (total deposited, total won, total fees, net profit/loss).

## **3\. Event Resolution Process**

### **3.1 Resolution Trigger Mechanisms**

#### **3.1.1 Admin Manual Resolution**

The resolution workflow prioritizes accuracy over speed, with safeguards against manipulation. When `ends_at` passes, events enter `closed` status and appear in the resolution queue for authorized admins. The interface presents: event summary with betting statistics, embedded resolution source (news article, official API, video stream), outcome selection with confidence rating (1–5 scale), and mandatory justification field (minimum 100 characters).

Progressive safeguards by pool size:

TableCopy

| Pool Size | Approval Required | Delay | Notification |
| :---- | :---- | :---- | :---- |
| \<৳10,000 | Single admin | None | Standard |
| ৳10,000–৳100,000 | Single admin \+ audit log | 15 min | Email to compliance |
| ৳100,000–৳500,000 | Dual admin signature | 4 hours | SMS to senior admin |
| ≥৳500,000 | Dual signature \+ legal review | 24 hours | Executive alert |

*Table 6: Resolution approval tiers by financial exposure*

The atomic resolution transaction: `BEGIN; UPDATE events SET status='resolved', winning_outcome_id=?, resolved_at=NOW(), resolved_by=?; UPDATE outcomes SET is_winner=TRUE WHERE id=?; CALL calculate_payouts(?); COMMIT;`. PostgreSQL's `SERIALIZABLE` isolation prevents concurrent modifications. Failed transactions log to `resolution_failures` table with automatic retry and escalation.

#### **3.1.2 Automated Resolution (Future)**

Oracle integration roadmap enables trust-minimized resolution for objective events. Phase 1 (6 months): API oracles for sports scores (CricAPI, ESPN), election results (Election Commission), weather (Bangladesh Meteorological Department). Phase 2 (12 months): multi-source aggregation requiring 2-of-3 consensus with automatic escalation on discrepancy. Phase 3 (24 months): decentralized oracle networks (Chainlink) for cryptocurrency and global financial data.

The optimistic oracle pattern from UMA: proposed resolution enters 24-hour challenge window, disputers post bond to trigger escalation, successful challengers receive bond plus bounty from incorrect resolution. This creates economic incentives for truthful reporting without requiring perfect oracle security.

### **3.2 Payout Calculation & Distribution**

#### **3.2.1 Winner Determination Logic**

Parimutuel payout formula: `payout = bet_amount × (total_pool × (1 - platform_fee)) / winning_outcome_pool`. Example: ৳100,000 total pool, 5% fee, ৳30,000 on winning outcome. Net pool \= ৳95,000; a ৳1,000 bet returns ৳95,000 × (1,000/30,000) \= ৳3,166.67 (3.17x return, including stake).

Edge case handling: no bets on winning outcome → full refunds; single winner → capped at 10x return (platform risk limit); cancelled event → full refunds minus processing fees; rounding remainder (fractional poisha) → platform reserve.

TableCopy

| Scenario | Handling | Platform Fee |
| :---- | :---- | :---- |
| Normal resolution | Proportional payout | Deducted from pool |
| No winning bets | Full refund to all | Waived |
| Single winner | Capped at 10x, remainder to reserve | Capped proportionally |
| Event cancelled | Full refund | Processing fee only |
| Disputed resolution | Escrow pending arbitration | Held in escrow |

*Table 7: Payout scenarios and fee treatment*

#### **3.2.2 Balance Update Flow**

Atomic payout execution uses PostgreSQL advisory locks to prevent race conditions: `SELECT pg_advisory_lock(event_id); BEGIN; UPDATE user_balances SET available = available + payout WHERE user_id = winner; INSERT INTO transactions (type='winning', amount=payout, ...); UPDATE bets SET status='paid_out'; COMMIT; SELECT pg_advisory_unlock(event_id);`.

Batch processing for large events (1000+ winners): queue individual payouts in `pending_payouts` table, process in 100-record chunks with 100ms delays to prevent database overload, and track progress with `processed_count/total_count`. Failed individual payouts (rare, typically from account suspension) queue for manual review without blocking others.

Real-time notification: Supabase Realtime broadcasts to `user:${winner_id}` channel; Firebase Cloud Messaging push for mobile; optional SMS for wins ≥৳10,000. Email summary batches multiple wins for active users.

## **4\. User Onboarding & Deposit Flow**

### **4.1 Account Setup & KYC**

#### **4.1.1 Registration with Supabase Auth**

Phone authentication serves as primary method for Bangladesh's mobile-first market. Flow: user enters 11-digit number (validated against `^01[3-9]\d{8}$`), Supabase sends 6-digit OTP via Twilio or local SMS gateway (Grameenphone, Robi, Banglalink routes with 99.5% delivery SLA), verification within 5-minute expiry. Rate limiting: 3 OTP requests/hour, 5 failed attempts → 24-hour lockout.

Progressive profiling minimizes abandonment: required fields (phone, display name) at signup; optional (email, full name matching NID) before first withdrawal; mandatory (NID number, date of birth, address) for tier upgrade. Email verification enables password recovery and is required for withdrawals ≥৳50,000.

TableCopy

| KYC Tier | Requirements | Limits | Features |
| :---- | :---- | :---- | :---- |
| Tier 0 (Phone only) | Phone verified | Deposit: ৳5,000/mo, No withdrawal | Demo mode only |
| Tier 1 (Basic) | \+ Email, name, DOB | Deposit: ৳50,000/mo, Withdrawal: ৳10,000/day | Full betting |
| Tier 2 (Verified) | \+ NID, address proof | Deposit: ৳500,000/mo, Withdrawal: ৳100,000/day | Priority support |
| Tier 3 (Enterprise) | \+ Source of funds, video KYC | Negotiated | Dedicated manager |

*Table 8: KYC tiers and corresponding limits*

#### **4.1.2 Initial Balance State**

Zero-balance wallet creation triggers on successful auth: `INSERT INTO user_balances (user_id, available, pending_withdrawal, locked_in_bets) VALUES (?, 0, 0, 0)`. Demo mode provides 1,000 virtual credits with clear "PRACTICE MODE" branding—non-withdrawable, separate leaderboard, no real prizes.

Welcome bonuses (if offered) credit as `bonus_balance` with 5x wagering requirement: must bet 5× bonus amount before withdrawal eligibility. This prevents bonus abuse while enabling user exploration.

### **4.2 First Deposit Journey**

Payment method selection prominently displays bKash (pink \#E2136E, \~60% market share) and Nagad (orange \#F37021, \~30% market share) with visual brand recognition. Each shows: estimated time (bKash: 1–3 min, Nagad: instant), fee (typically platform-absorbed), and limits (min ৳50, max tier-dependent).

Amount input: quick-select buttons (৳100, ৳500, ৳1000, ৳5000, ৳10000) plus custom input with validation. Confirmation screen summarizes: deposit amount, selected method, fee (if any), estimated arrival, and total balance after deposit. First-time users see educational tooltip: "Your money will be converted to platform balance for betting. Withdraw anytime to your bKash/Nagad."

## **5\. bKash Integration (Standard Merchant API Flow)**

### **5.1 Authentication & Token Management**

#### **5.1.1 Grant Token API**

bKash uses OAuth 2.0-style authentication with Base64-encoded credentials. The `Authorization: Basic base64(app_key:app_secret)` header combines with `username` and `password` in request body to obtain time-limited tokens from `https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant` .

Token response: `id_token` (JWT for API calls, 2-hour expiry), `access_token` (alternative auth), `refresh_token` (for renewal without re-credentials), `expires_in: 7200`. Sandbox credentials for testing: wallet `01667504348`, PIN `123456`, OTP `123456` .

TableCopy

| Credential | Source | Security |
| :---- | :---- | :---- |
| `app_key`, `app_secret` | bKash merchant onboarding | Supabase Vault, never client-side |
| `username`, `password` | Initial provision, changeable | Environment variables, rotated quarterly |
| `id_token`, `access_token` | Runtime grant | Edge Function memory, 90-min cache |
| `refresh_token` | Grant response | Encrypted storage, 28-day validity |

*Table 9: bKash credential lifecycle and security*

#### **5.1.2 Token Refresh Mechanism**

Proactive refresh at 90% of expiry (1h 48m) prevents mid-transaction failures. The refresh flow `POST /token/refresh` with `refresh_token` returns new token pair. Circuit breaker: after 3 consecutive refresh failures, fall back to full re-authentication with exponential backoff (5min, 15min, 1hr) and PagerDuty alert.

### **5.2 Deposit Flow (User → Platform)**

#### **5.2.1 Create Payment Request**

The `create_payment` Edge Function: validates user/KYC, checks daily limits, generates unique `merchantInvoiceNumber` (format: `PM{timestamp}{random6}{user_short}`), and calls bKash with `mode: "0011"` (checkout URL), `payerReference` (user ID), `callbackURL`, `amount`, `currency: "BDT"`, `intent: "sale"` .

Response handling: store `paymentID` and `bkashURL` in `pending_payments` with 15-minute expiry; redirect user to `bkashURL`; handle timeout/abandonment via cleanup job.

#### **5.2.2 User Authorization**

User experiences bKash-hosted checkout: enter wallet number, 5-digit PIN, receive SMS OTP, confirm transaction details, authorize. Security: PCI-DSS scope remains with bKash; platform never handles sensitive credentials. Mobile deep-link opens bKash app directly; web fallback uses responsive checkout page.

#### **5.2.3 Execute & Verify Payment**

Callback handling receives `paymentID` and `status`; immediately execute `POST /execute` with `paymentID` to finalize . Verification redundancy: `GET /payment/status` with `paymentID` confirms final state if execute response ambiguous. Atomic balance update: `BEGIN; UPDATE pending_payments SET status='completed', trx_id=?; UPDATE user_balances SET available = available + amount; INSERT INTO transactions (type='deposit', method='bkash', ...); COMMIT;`

Idempotency: `trx_id` unique constraint prevents double-credit; duplicate execute calls return consistent result without reprocessing.

### **5.3 Withdrawal Flow (Platform → User)**

#### **5.3.1 Payout API Integration**

bKash Disbursement API requires separate merchant approval with enhanced due diligence. Flow: user requests withdrawal to registered bKash number (verified against profile), platform validates balance and KYC, queues in `withdrawal_requests`, batch processes via scheduled Edge Function.

Payout request: `receiverWalletNumber`, `amount`, `transactionReference` (platform unique). Synchronous response indicates immediate success/failure; failed transactions retry with exponential backoff, escalating to manual review after 3 attempts.

#### **5.3.2 Batch Processing for Efficiency**

Hourly batch execution (10 AM–6 PM BST) aggregates pending withdrawals: `SELECT * FROM withdrawal_requests WHERE status='pending' AND method='bkash' ORDER BY created_at LIMIT 50`. Single API authentication, parallel individual payout calls with 10 TPS rate limiting, individual status tracking, and user notification on completion.

## **6\. Nagad Integration (Alternative/Different Approach)**

### **6.1 Key Architectural Differences from bKash**

TableCopy

| Aspect | bKash | Nagad |
| :---- | :---- | :---- |
| Authentication | OAuth tokens (id\_token, refresh\_token) | RSA signatures (privateKey, pgPublicKey) |
| Cryptography | HMAC-SHA256 for webhooks | RSA-SHA256 per-request signing |
| Confirmation model | Polling-based (execute \+ query) | Synchronous \+ callback |
| Typical latency | 30–120 seconds | 3–10 seconds |
| Fee structure | 1.5–2% merchant | 0.5–1% merchant (often lower) |
| Onboarding | 7–14 days via BRAC Bank | 15–30 days via Bangladesh Post Office |
| Test environment | Mature sandbox with fixed credentials | Limited staging, business hours only |

*Table 10: bKash vs Nagad architectural comparison*

#### **6.1.1 Credential Structure**

Nagad requires four credentials: `merchantID` (numeric, assigned by BPO), `terminalID` (deployment-specific), `privateKey` (RSA-2048 for signing), `pgPublicKey` (Nagad's key for verification) . Key management: private key in AWS KMS or HashiCorp Vault, never in environment variables; signing operations in isolated Edge Function with IAM-restricted access.

#### **6.1.2 Callback-Heavy Design**

Nagad's synchronous response includes preliminary status; server-to-server callback delivers definitive confirmation within seconds . This eliminates polling loops but requires robust webhook infrastructure: signature verification, idempotency, and at-least-once delivery handling.

### **6.2 Deposit Flow (Nagad Specifics)**

#### **6.2.1 Order Creation with Signature**

Server-side order generation: construct payload with `merchantId`, `terminalId`, `orderId`, `amount` (in paisha, multiply BDT by 100), `currency: "050"`, `timestamp` (ISO 8601), `challenge` (random nonce). RSA-SHA256 signature: `sign(sha256(orderedParamString), privateKey)`, base64-encode, include in request .

Response: `paymentRefId`, `deepLinkUrl` (mobile app), or QR code data. Store with 15-minute expiry; present user with deep-link button or QR scan option.

#### **6.2.2 Instant Confirmation Model**

Callback delivery to platform webhook: signed payload with `paymentRefId`, `orderId`, `amount`, `status`, `issuerPaymentRefNo` . Verification: `verify(signature, pgPublicKey)` → idempotency check → immediate balance update without additional query calls. Average 3.2 seconds from user confirmation to available balance—significantly faster than bKash.

### **6.3 Withdrawal & Disbursement**

Nagad Merchant Payout API enables direct cash-out with competitive fees—often 0.5–1% vs bKash's 1.5–2% . Implementation mirrors deposit signing pattern with `receiverMobileNumber`, `amount`, `purposeCode` (regulatory categorization: "Winnings", "Refund", "Incentive").

Daily disbursement limits: ৳500,000 standard merchant, negotiable for high-volume platforms. T+1 settlement to platform's settlement account, faster than bKash's T+2 standard.

## **7\. "Different Way" — Unified Wallet Architecture**

### **7.1 Virtual Balance System**

#### **7.1.1 Internal Ledger Design**

The core architectural innovation: bKash and Nagad serve purely as on/off-ramps, not as betting balances. All user funds exist as platform-internal liabilities with complete audit trails. This enables: instant bet placement (no gateway latency), unified experience regardless of funding source, simplified regulatory reporting, and future gateway additions without migration.

Double-entry ledger: every movement creates paired records in `ledger_entries`:

TableCopy

| Entry Type | Debit Account | Credit Account | Example |
| :---- | :---- | :---- | :---- |
| `DEPOSIT` | bKash/Nagad payable | User available | ৳1,000 deposited |
| `BET_PLACED` | User available | Event escrow | ৳500 staked on outcome |
| `BET_WON` | Event escrow \+ Platform fee | User available | ৳1,500 payout |
| `BET_LOST` | User available (forfeit) | Platform revenue | ৳500 loss |
| `WITHDRAWAL_REQUESTED` | User available | Withdrawal pending | ৳1,000 requested |
| `WITHDRAWAL_COMPLETED` | Withdrawal pending | bKash/Nagad payable | ৳1,000 paid out |

*Table 11: Double-entry ledger structure for all financial movements*

#### **7.1.2 Transaction Isolation**

Three-bucket balance model: `available_balance` (immediate use), `pending_withdrawal` (requested, not yet sent), `locked_in_bets` (active stakes). Invariant: `available + pending_withdrawal + locked_in_bets = total_deposits - total_withdrawals + total_winnings - total_losses - total_fees`.

Regulatory compliance: 7-year retention, daily reconciliation reports, automated BFIU suspicious activity reporting for thresholds (৳10,00,000+ single transaction, structuring patterns).

### **7.2 Unified Payment Orchestration**

#### **7.2.1 Single API Abstraction Layer**

TypeScript interface abstracts gateway specifics:

TypeScriptCopy

interface PaymentGateway {  
  createDeposit(amount: number, userId: string, metadata: object): Promise\<DepositSession\>;  
  verifyDeposit(sessionId: string): Promise\<DepositStatus\>;  
  createWithdrawal(amount: number, destination: string, metadata: object): Promise\<WithdrawalRequest\>;  
  getWithdrawalStatus(requestId: string): Promise\<WithdrawalStatus\>;  
  handleWebhook(payload: unknown, signature: string): Promise\<WebhookResult\>;

}

Factory pattern instantiates `BkashGateway` or `NagadGateway` based on user selection or smart routing. New gateways (Rocket, Upay, cards) add implementations without consumer changes.

#### **7.2.2 Smart Routing by Cost/Speed**

TableCopy

| Scenario | Default Route | Rationale | Override |
| :---- | :---- | :---- | :---- |
| Deposit \<৳10,000 | Nagad | Instant confirmation, lower fee | User preference |
| Deposit ≥৳10,000 | bKash | Higher limits, familiar UX | User preference |
| Withdrawal any amount | Nagad | Lower fees (0.5–1% vs 1.5–2%) | User preference |
| Nagad unavailable | bKash fallback | Automatic failover | None |
| User preference stored | As specified | Respect user choice | Manual per-transaction |

*Table 12: Smart routing logic with defaults and overrides*

Machine learning enhancement (future): train on historical success rates, latency distributions, user satisfaction to optimize routing beyond static rules.

### **7.3 Security & Compliance Layer**

#### **7.3.1 Webhook Verification**

Multi-layer verification for all callbacks: TLS certificate pinning, IP allowlisting (bKash: 103.9.185.0/24; Nagad: 182.48.64.0/22), signature validation (HMAC-SHA256 for bKash, RSA-SHA256 for Nagad), timestamp freshness (±5 minutes), and idempotency key deduplication (24-hour Redis cache).

#### **7.3.2 Anti-Fraud Measures**

TableCopy

| Control | Implementation | Threshold | Response |
| :---- | :---- | :---- | :---- |
| Deposit velocity | Per-user hourly count | \>3 attempts | Soft block, email verification |
| Deposit amount | Per-user daily total | \>৳50,000 (Tier 1\) | Require Tier 2 KYC |
| Withdrawal velocity | Per-user daily count | \>2 requests | Manual review queue |
| Withdrawal amount | Per-user daily total | \>৳100,000 (Tier 2\) | Executive approval |
| Structuring pattern | Deposit/withdrawal cycles without betting | 3+ cycles in 24h | Account freeze, SAR filing |
| Geographic anomaly | Login vs. transaction IP mismatch | Different division | Step-up authentication |

*Table 13: Anti-fraud controls and automated responses*

Supabase Analytics enables SQL-based rule creation with real-time flagging and admin review queue integration.

## **8\. Technical Implementation Stack**

### **8.1 Backend Services (Supabase)**

#### **8.1.1 Database & Auth**

PostgreSQL 15 with extensions: `pg_cron` (scheduled jobs), `pg_stat_statements` (query optimization), `pg_trgm` (fuzzy search). RLS policies: users read own data only; admins read tenant-scoped; service role bypasses for internal operations. Connection pooling: Supavisor with 200-connection limit, automatic read replica scaling.

Supabase Auth: JWT 1-hour expiry, refresh token rotation, custom claims (`role`, `kyc_tier`, `withdrawal_limits`) in payload for efficient authorization. MFA: optional for users, required for admin roles and large withdrawals.

#### **8.1.2 Edge Functions for Payments**

Deno runtime with: 400-second timeout (sufficient for API calls), 150MB memory, cold-start mitigation via scheduled keep-alive. Function structure:

TableCopy

| Function | Purpose | Trigger |
| :---- | :---- | :---- |
| `bkash-create-deposit` | Initiate bKash payment | HTTP: user deposit request |
| `bkash-webhook` | Process bKash callbacks | HTTP: bKash servers |
| `nagad-create-order` | Sign and send Nagad order | HTTP: user deposit request |
| `nagad-webhook` | Verify and process Nagad callbacks | HTTP: Nagad servers |
| `withdrawal-processor` | Batch execute queued withdrawals | Cron: every 15 minutes |
| `reconciliation-batch` | Daily ledger-gateway reconciliation | Cron: 2 AM BST |

*Table 14: Edge Functions architecture and scheduling*

Credential security: Supabase Vault encryption at rest, runtime injection via `Deno.env.get()`, never in code repository, quarterly rotation procedure documented.

### **8.2 Frontend (Next.js on Vercel)**

#### **8.2.1 App Router with Server Components**

Server Components default for 80% of content, `'use client'` only for interactivity. Caching strategy: event listings ISR 60s, user data dynamic, static assets immutable. Vercel Edge Network: Singapore PoP serves Bangladesh with \<50ms latency.

#### **8.2.2 Real-time Features**

Supabase Realtime: `event:${id}` for public odds, `user:${id}` for personal updates. Vercel Edge Config: feature flags with \<100ms global propagation for gradual rollout and emergency disable.

## **9\. Testing & Go-Live Checklist**

### **9.1 Sandbox Testing**

#### **9.1.1 bKash Sandbox Credentials**

TableCopy

| Credential | Value | Purpose |
| :---- | :---- | :---- |
| Base URL | `https://tokenized.sandbox.bka.sh/v1.2.0-beta` | All API calls |
| App Key | `ZC8ISLQBZ6GMQJFUF` | Authentication |
| App Secret | `UVG2I2D6HJKO2S4U5MIQ6WE2DUPL` | Authentication |
| Username | `sandbx@example.com` | Merchant identity |
| Password | `passw0rd` | Merchant credentials |
| Test wallet | `01667504348` | User simulation |
| Test PIN | `123456` | Authentication |
| Test OTP | `123456` | Authorization |

*Table 15: bKash sandbox environment credentials*

Test scenarios: successful payment, insufficient balance, incorrect PIN, timeout abandonment, duplicate idempotency, network failure recovery.

#### **9.1.2 Nagad Test Environment**

Separate registration with Bangladesh Post Office IT division (5–7 business days). Test credentials: merchantID prefix `STG-`, self-generated RSA key pair, limited availability (business hours only). Coverage: signature generation roundtrip, deep-link functionality, callback signature validation, error code handling.

### **9.2 Production Deployment**

#### **9.2.1 SSL & Webhook Configuration**

TableCopy

| Requirement | Implementation |
| :---- | :---- |
| TLS version | 1.3 minimum, 1.2 fallback disabled |
| Certificate | Valid CA-issued, CT monitoring |
| HSTS | max-age=31536000, includeSubDomains |
| Webhook subdomain | `webhooks.yourplatform.com` dedicated |
| DNS | A/AAAA to Vercel, CAA records restricted |
| DDoS protection | Cloudflare proxy, rate limiting 100 req/min |
| IP allowlisting | Gateway-published ranges only |

*Table 16: Production security configuration*

#### **9.2.2 Monitoring & Alerting**

TableCopy

| Metric | Threshold | Alert Channel | Response |
| :---- | :---- | :---- | :---- |
| Payment success rate | \<98% | PagerDuty critical | Immediate investigation |
| Deposit latency p99 | \>30s | Slack \#payments | Gateway escalation |
| Withdrawal queue depth | \>100 | Slack \#operations | Scale batch processing |
| Balance reconciliation drift | \>৳0.01 | PagerDuty \+ email | Freeze transactions, manual review |
| Edge Function error rate | \>1% | Slack \#dev | Rollback, hotfix |
| Database connection pool | \>80% | Slack \#infra | Scale read replicas |

*Table 17: Monitoring thresholds and escalation procedures*

Runbook documentation: gateway outage failover, suspected fraud response, regulatory inquiry data export, disaster recovery drill quarterly.

