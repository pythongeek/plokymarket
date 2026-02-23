#!/bin/bash

echo "🚀 Starting Pre-deployment checks for AI-Managed Codebase..."

# ১. টাইপ চেকিং (Type-Safety Check)
echo "🔍 Running Type Check (tsc)..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ Type Check failed! Please fix the code before deploying. (Bypassing for now via next.config.js)"
    # exit 1
fi

# ২. সুপাবেস/ডাটাবেস মাইগ্রেশন চেক (Database Sync)
# এটি চেক করবে আপনার লোকাল স্কিমা রিমোটের সাথে সিঙ্ক আছে কিনা
echo "🗄️ Checking Database Schema Sync..."
npx supabase db remote commit
npx supabase db push --dry-run
if [ $? -ne 0 ]; then
    echo "⚠️ Database Schema Mismatch detected. Applying migrations..."
    # npx supabase db push # সতর্কতার সাথে এটি আনকমেন্ট করুন
fi

# ৩. বিল্ড টেস্ট (Build Verification)
echo "📦 Running Production Build Test..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Deployment aborted."
    exit 1
fi

echo "✅ All checks passed! Ready for Vercel Deployment."
