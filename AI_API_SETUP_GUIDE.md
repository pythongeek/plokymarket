# AI API Setup Guide for Plokymarket

## 🔴 Current Issue

Your `GEMINI_API_KEY` is bound to a **Vertex AI Service Account** (`vertex-express@gen-lang-client-0578182636.iam.gserviceaccount.com`), which cannot be used directly with Vercel serverless functions.

## ✅ Solution: Get AI Studio API Key

### Step 1: Get Gemini API Key from AI Studio (Recommended)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select your project or create new one
5. Copy the API key (looks like: `AIzaSy...`)

### Step 2: Add to Vercel Environment Variables

```bash
# In Vercel Dashboard → Project Settings → Environment Variables
Name: GEMINI_API_KEY
Value: AIzaSyYourNewKeyHere
```

### Step 3: Remove/Update Old Key

```bash
# Remove the old service account key
vercel env rm GEMINI_API_KEY

# Add the new AI Studio key
vercel env add GEMINI_API_KEY
```

---

## 🔧 Alternative: Use Vertex AI with Service Account (Advanced)

If you must use Vertex AI Service Account, you need to:

### Option A: Use Google Cloud Run (instead of Vercel)
- Deploy your app to Google Cloud Run
- It will automatically have access to Vertex AI

### Option B: Use Service Account JSON in Vercel

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. IAM & Admin → Service Accounts
3. Create key for `vertex-express@gen-lang-client-0578182636.iam.gserviceaccount.com`
4. Download JSON key
5. Base64 encode it:
   ```bash
   cat service-account.json | base64
   ```
6. Add to Vercel:
   ```bash
   vercel env add GOOGLE_SERVICE_ACCOUNT_KEY_BASE64
   ```

---

## 🚀 Quick Fix (Recommended)

Just get a new API key from AI Studio - it's free and works immediately with Vercel.

### Test URLs:
- **AI Studio**: https://aistudio.google.com/app/apikey
- **Your Test API**: https://polymarket-bangladesh.vercel.app/api/ai/test

---

## 📊 API Comparison

| Feature | AI Studio API | Vertex AI |
|---------|--------------|-----------|
| **Setup** | Easy (just API key) | Complex (service account) |
| **Works with Vercel** | ✅ Yes | ❌ No (needs GCP) |
| **Free Tier** | ✅ Yes | ⚠️ Requires billing |
| **Model Access** | Gemini 1.5 Flash/Pro | Full Vertex AI suite |

---

## 🎯 For Your Use Case

Since you want to deploy on **Vercel**, use **AI Studio API Key**.

Your current key `AQ.Ab8RN6JG1yC4h2gS5xriJobj92yCEg7kdN4sQ0tBX42h_byrgA` is a **Vertex AI Service Account API key** - it won't work with Vercel.

**Get a new key from**: https://aistudio.google.com/app/apikey
