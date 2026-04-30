# Mode 3: Hybrid Creator & Resolution Systems
## Complete Implementation Guide

---

## 🎯 Mode 3: Hybrid Event Creator

### Concept
Hybrid Creator = Manual Control + AI Assistance at field level

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID CREATOR FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User Types in Field                                         │
│     └─> Debounced Auto-suggest (2s delay)                       │
│                                                                 │
│  2. AI Suggestion Appears                                       │
│     ├─ Title Suggestion                                         │
│     ├─ Question Suggestion                                      │
│     ├─ Description Suggestion                                   │
│     └─ Alternative Options                                      │
│                                                                 │
│  3. User Can:                                                   │
│     ├─ Accept Suggestion (Apply)                                │
│     ├─ Reject & Type Own                                        │
│     ├─ Request New Suggestion                                   │
│     └─ Use Auto-Fill All                                        │
│                                                                 │
│  4. Submit Event                                                │
│     └─ Same as Manual Mode                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description |
|---------|-------------|
| Field-level AI | Each field gets individual suggestion |
| Auto-suggest | Triggers after 2s of inactivity |
| Alternatives | Multiple options for each field |
| Auto-fill All | One-click complete form fill |
| Confidence Score | Shows AI certainty level |

---

## 🔧 Resolution Systems

### 1. AI Oracle System

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI ORACLE FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRIGGER: Event trading ends + resolution delay passes          │
│                                                                 │
│  STEP 1: Fetch News                                             │
│     ├─ Query: event keywords                                    │
│     ├─ Sources: Configured news sites                           │
│     └─ Filter: After event end date                             │
│                                                                 │
│  STEP 2: AI Analysis (Gemini)                                   │
│     ├─ Send articles to AI                                      │
│     ├─ Ask: YES/NO/UNCERTAIN                                    │
│     └─ Get: Confidence + Reasoning                              │
│                                                                 │
│  STEP 3: Decision                                               │
│     ├─ Confidence >= Threshold (85%)                            │
│     │   └─ AUTO-RESOLVE                                         │
│     ├─ Confidence < Threshold                                   │
│     │   └─ PENDING REVIEW                                       │
│     └─ UNCERTAIN                                                │
│         └─ FALLBACK TO MANUAL                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**API:** `POST /api/resolution/ai-oracle?event_id=xxx`

### 2. Manual Admin Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│                  MANUAL RESOLUTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STANDARD MODE:                                                 │
│  ├─ Admin selects outcome (YES/NO)                              │
│  ├─ Provides evidence URLs                                      │
│  ├─ Writes reasoning                                            │
│  ├─ Submits proposal                                            │
│  └─ Another admin approves                                       │
│      └─ Event resolved                                          │
│                                                                 │
│  EMERGENCY MODE (Red Button):                                   │
│  ├─ Same as above                                               │
│  ├─ Confirmation dialog                                         │
│  └─ IMMEDIATE RESOLUTION                                        │
│      └─ No approval needed                                      │
│                                                                 │
│  Use Emergency For:                                             │
│  • Clear government announcements                               │
│  • International match results                                  │
│  • Major disasters/events                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Page:** `/sys-cmd-7x9k2/resolution/[eventId]`

### 3. Expert Panel Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│                 EXPERT PANEL FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  EXPERT CRITERIA:                                               │
│  ├─ Verified domain expert                                      │
│  ├─ Has weight based on accuracy                                │
│  └─ Specialization matches event category                       │
│                                                                 │
│  VOTING PROCESS:                                                │
│  ├─ Each expert casts vote (YES/NO)                             │
│  ├─ Provides reasoning                                          │
│  ├─ Confidence score (0-100)                                    │
│  └─ Vote weighted by expert accuracy                            │
│                                                                 │
│  RESOLUTION:                                                    │
│  ├─ Minimum 5 votes required                                    │
│  ├─ 60% weighted majority needed                                │
│  └─ Auto-resolve when threshold met                             │
│                                                                 │
│  WEIGHT CALCULATION:                                            │
│  ├─ Base weight: 1.0                                            │
│  ├─ Accuracy bonus: +0.1 per 10% accuracy                       │
│  └─ Max weight: 2.0                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**API:** `POST /api/resolution/expert-panel`

---

## 📊 Resolution Comparison

| Method | Speed | Accuracy | Cost | Best For |
|--------|-------|----------|------|----------|
| AI Oracle | Fast (minutes) | Good | Free | Clear-cut events |
| Manual Admin | Medium (hours) | High | Free | Complex/disputed |
| Expert Panel | Slow (days) | Very High | Free | Technical topics |

---

## 🚀 Implementation Guide

### Step 1: Database Schema

```sql
-- Expert Panel Table
CREATE TABLE expert_panel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  expert_name TEXT NOT NULL,
  specializations TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  weight NUMERIC DEFAULT 1.0,
  accuracy_rate NUMERIC DEFAULT 70.0,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Votes Table
CREATE TABLE expert_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES markets(id),
  expert_id UUID REFERENCES expert_panel(id),
  vote VARCHAR(10) CHECK (vote IN ('yes', 'no')),
  reasoning TEXT,
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, expert_id)
);

-- Resolution Systems (Add columns)
ALTER TABLE resolution_systems ADD COLUMN IF NOT EXISTS 
  expert_panel_id UUID,
  min_expert_votes INTEGER DEFAULT 5,
  expert_result JSONB;
```

### Step 2: Environment Variables

```bash
# Already set from previous modes
GEMINI_API_KEY=your-key
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Step 3: Test Each System

```bash
# 1. Hybrid Creator
curl -X POST https://your-app.vercel.app/api/ai/suggest-field \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "field": "name",
    "current_data": {"name": "BPL", "category": "sports"}
  }'

# 2. AI Oracle
curl -X POST "https://your-app.vercel.app/api/resolution/ai-oracle?event_id=xxx" \
  -H "Authorization: Bearer TOKEN"

# 3. Manual Resolution
curl -X POST https://your-app.vercel.app/api/resolution/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "event_id": "xxx",
    "outcome": "yes",
    "reasoning": "Team won the match",
    "is_emergency": false
  }'
```

---

## 🎨 UI Components

### Hybrid Creator
- Field-level suggestion cards
- Confidence badges
- Alternative options
- Auto-fill button
- Real-time status

### Resolution Pages
- Outcome selection (YES/NO)
- Evidence URL input
- Reasoning textarea
- Emergency button
- Confirmation dialogs

---

## ✅ Testing Checklist

### Hybrid Creator
- [ ] Auto-suggest triggers after typing
- [ ] Suggestions show confidence score
- [ ] Apply button works
- [ ] Alternatives display
- [ ] Auto-fill all works

### AI Oracle
- [ ] Fetches news articles
- [ ] Analyzes with Gemini
- [ ] High confidence auto-resolves
- [ ] Low confidence pending review
- [ ] Telegram notification sent

### Manual Resolution
- [ ] Standard mode requires approval
- [ ] Emergency mode immediate
- [ ] Evidence URLs saved
- [ ] Reasoning logged
- [ ] Notification sent

### Expert Panel
- [ ] Expert can vote
- [ ] Weight calculated correctly
- [ ] 60% threshold works
- [ ] Auto-resolve on threshold
- [ ] Results displayed

---

## 📞 URLs

| Component | URL |
|-----------|-----|
| Hybrid Creator | `/sys-cmd-7x9k2/events/create/hybrid` |
| Manual Resolution | `/sys-cmd-7x9k2/resolution/[eventId]` |
| AI Oracle API | `/api/resolution/ai-oracle` |
| Manual API | `/api/resolution/manual` |
| Expert API | `/api/resolution/expert-panel` |

---

**Last Updated**: February 15, 2026
**Version**: 1.0
**Status**: Production Ready
