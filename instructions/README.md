# Polymarket BD - Prediction Marketplace

A full-stack prediction marketplace platform for trading on sports, politics, finance, and more.

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Supabase      │◀────│   Docker        │
│   (Frontend)    │     │   (Database)    │     │   (n8n)         │
│   Next.js 15    │     │   PostgreSQL    │     │   Automation    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 📁 Project Structure

```
├── 📁 apps/web/           # Next.js Frontend → Vercel
├── 📁 supabase/           # Database Schema → Supabase
├── 📁 docker/n8n/         # Automation → Docker
├── IMPLEMENTATION_GUIDE.md    # Complete setup guide
├── AI_AGENT_INSTRUCTIONS.md   # Step-by-step for AI
└── DEPLOYMENT_SCRIPT.sh       # Automated deployment
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase CLI
- Vercel CLI
- Docker (optional, for n8n)

### 1. Supabase Setup
```bash
# Create project at https://app.supabase.com
# Then run migrations:
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 2. Frontend Setup
```bash
cd apps/web
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

npm run dev
```

### 3. Deploy to Vercel
```bash
vercel --prod
```

### 4. n8n Setup (Optional)
```bash
cd docker/n8n
docker-compose up -d
```

## 📖 Documentation

- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Complete technical documentation
- **[AI_AGENT_INSTRUCTIONS.md](AI_AGENT_INSTRUCTIONS.md)** - Step-by-step AI implementation guide
- **[DEPLOYMENT_SCRIPT.sh](DEPLOYMENT_SCRIPT.sh)** - Automated deployment script

## 🔑 Environment Variables

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Vercel
Set in Vercel Dashboard > Project Settings > Environment Variables

### n8n
Set in docker-compose.yml or .env file

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State**: Zustand
- **Charts**: Recharts
- **Automation**: n8n (Docker)

## 🔒 Security

- Row Level Security (RLS) enabled
- Service role key never exposed client-side
- Input validation on all forms
- HTTPS enforced

## 📊 Features

- ✅ User Authentication (Email)
- ✅ Market Browsing & Search
- ✅ Real-time Order Book
- ✅ Price Charts
- ✅ Buy/Sell Trading
- ✅ Portfolio Tracking
- ✅ Wallet Management
- ✅ Admin Panel
- ✅ Market Creation/Resolution

## 🧪 Testing

```bash
# Run locally
npm run dev

# Build
npm run build

# Test production build
npm start
```

## 📝 License

MIT License - See LICENSE file

## 🤝 Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
