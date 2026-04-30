# Vertex AI Agent Setup Guide for Plokymarket

## 🎯 Goal
Deploy Plokymarket with **Vertex AI Agent** features on **Google Cloud Run**

---

## 📋 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Vertex AI API** enabled
3. **Service Account** with Vertex AI permissions
4. **gcloud CLI** installed locally

---

## 🚀 Deployment Steps

### Step 1: Enable APIs

```bash
gcloud services enable vertexai.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Step 2: Set Environment Variables

```bash
export PROJECT_ID=gen-lang-client-0578182636
export REGION=asia-south1
export SERVICE_NAME=plokymarket-web
```

### Step 3: Deploy to Cloud Run

```bash
# Navigate to web app
cd apps/web

# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account vertex-express@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID,VERTEX_LOCATION=$REGION,NEXT_PUBLIC_SUPABASE_URL=your-supabase-url,NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
```

### Step 4: Verify Deployment

```bash
# Get service URL
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'

# Test Vertex AI Agent
curl https://your-service-url/api/ai/vertex-agent-test
```

---

## 🔧 Local Testing with Vertex AI

### Option A: Use gcloud auth

```bash
# Login to Google Cloud
gcloud auth login
gcloud config set project gen-lang-client-0578182636

# Run locally with Application Default Credentials
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json npm run dev
```

### Option B: Use Service Account Key

```bash
# Download service account key from GCP Console
# IAM & Admin → Service Accounts → Keys → Create Key

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Run locally
npm run dev
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `Dockerfile` | Container image for Cloud Run |
| `cloudbuild.yaml` | Cloud Build configuration |
| `src/lib/ai/vertex-agent.ts` | Vertex AI Agent client |

---

## 🔗 API Endpoints

### Vertex AI Agent Test
```bash
GET /api/ai/vertex-agent-test
```

### Generate Event with Agent
```bash
POST /api/ai/generate-event
Content-Type: application/json

{
  "rawInput": "বাংলাদেশ প্রিমিয়ার লিগ ২০২৬ এর চ্যাম্পিয়ন কে হবে?"
}
```

---

## 🌐 Environment Variables (Cloud Run)

| Variable | Value |
|----------|-------|
| `GOOGLE_CLOUD_PROJECT` | `gen-lang-client-0578182636` |
| `VERTEX_LOCATION` | `asia-south1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |

---

## ⚠️ Important Notes

1. **Service Account**: Must have `roles/aiplatform.user` role
2. **Region**: `asia-south1` (Mumbai) for low latency in Bangladesh
3. **Billing**: Vertex AI charges apply
4. **Authentication**: Automatic in Cloud Run, manual locally

---

## 🆚 Vercel vs Cloud Run

| Feature | Vercel | Cloud Run |
|---------|--------|-----------|
| **Vertex AI Agent** | ❌ Not supported | ✅ Full support |
| **Serverless** | ✅ Yes | ✅ Yes |
| **Custom Domain** | ✅ Easy | ⚠️ Requires setup |
| **Cold Start** | ✅ Fast | ⚠️ Slower |
| **Bangladesh Latency** | ⚠️ Higher | ✅ Lower (asia-south1) |

---

## 🎯 Recommendation

Since you need **Vertex AI Agent**, deploy on **Google Cloud Run**.

Your app URL will be: `https://plokymarket-web-xxx.a.run.app`
