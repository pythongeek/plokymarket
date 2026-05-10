# প্লোকিরেজলুশ঩ সার্ভিস পাইয়া বনাম ওপেন সোর্স অল্টারনেটিভ

> সব কিছু পাইয়া নাওয়া যায় — ওপেন সোর্সে সমাধান হবে। বাংলাদেশের জন্য খরচ কমাতার সমাধান।

---

## সার্ভিস তালিকা

| ক্রম | সার্ভিস | পাইয়া সমাধান | ওপেন সোর্স সমাধান | সার্ভার দরকার থাকলে কিনা |
|------|--------|----------------|---------------------|--------------------------|
| 1 | AI LLM (Gemini/MiniMax) | Google AI Studio / MiniMax API | **Ollama + Llama 3/Mistral** লোকালি চলানো | হ্যাতসার সার্ভারে সমাধান |
| 2 | Polygon RPC | Infura/Alchemy ($0-$49/মাস) | **পাবলিক Polygon RPC** + সেল্ফ-হোস্ট নোড | লোকাল নোড চলানো |
| 3 | IPFS Pinning | Pinata ($20/মাস) / Filebase ($5/মাস) | **Kubo (go-ipfs)** লোকাল নোড | সার্ভারে স্টোরেজ থাকা |
| 4 | Redis Cache | Upstash ($10/মাস) | **Redis** লোকাল ইনস্টল | লোকালি রান করা |
| 5 | Blockchain ভেরিফাই | Polygonscan API (free) | পাবলিক API থেকে সার্ভার ডেটা নিজে | সেখানে থাকা |
| 6 | ঵ালেট / Private Key | সম্পূর্ণ ফ্রি | MetaMask / Rabby ডাউনলোড করা | সম্পূর্ণ ফ্রি |
| 7 | সমর্থন ক্লাউড | AWS/GCP ($50-200/মাস) | **Hetzner VPS** (€5/মাস) + সেল্ফ-হোস্ট | সার্ভারে চলানো |

---

## 1. AI LLM — Gemini/MiniMax বনাম ওপেন সোর্স

### পাইয়া রাস্তা

| প্রোভাইডার | ফ্রি টিয়ার | পেধ টিয়ার | দর |
|------------|-----------|----------|-----|
| **Google Gemini 2.0 Flash** | 1,500 req/day | $0.075 / 1M input tokens | [ai.google.dev](https://ai.google.dev) |
| **Google Gemini 2.5 Pro** | 50 req/day | $1.25 / 1M input tokens | [ai.google.dev](https://ai.google.dev) |
| **MiniMax M2.7** | নেই | $0.15 / 1M tokens | [minimaxi.com](https://www.minimaxi.com) |
| **OpenAI GPT-4o** | নেই | $2.50 / 1M input tokens | [openai.com](https://openai.com) |

### ওপেন সোর্স অল্টারনেটিভ — **Ollama + Llama 3/Mistral**

```bash
# স্টেপ 1: Ollama ইন্সটল করা (সম্পূর্ণ ফ্রি)
curl -fsSL https://ollama.com/install.sh | sh

# স্টেপ 2: Llama 3 মডেল ডাউনলোড
ollama pull llama3.1:8b

# স্টেপ 3: Mistral মডেল ডাউনলোড (বাঙ্গলায় ভালো হয়)
ollama pull mistral:7b

# স্টেপ 4: রান করা
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Analyze: Will Bangladesh win the next cricket match?",
  "stream": false
}'
```

**Ollama কিছু কসে চলবে:**
- CPU-এ চলে (slow, 10-30 sec/response)
- GPU-এ চললে 1-3 sec/response
- লোকাল সার্ভারে চলে — কোনো API key লাগে না
- কোনিউস সার্ভার দরকার থাকে না
- ডেটা বাহিরে যায় না

**GPU লাগলে কি লাগবে:**
- কম হলে: 8GB RAM CPU-only (স্লো হবে, কিন্তু কাজ করবে)
- ভালো: 16GB RAM + 8GB VRAM GPU (RTX 3060/4060)
- ভালো: RTX 4090 24GB (সব মডেল চলবে)

### সুপারিশ সার্ভিস — **Groq API (Free Tier)**

```bash
# Groq-এ ফ্রি টিয়ার অনুরোধ থাকে
# Llama 3, Mixtral আরামি চলানো যায়
# 20 req/min ফ্রি, তারপরে $0.05/1M tokens
# https://console.groq.com
```

### সার্ভার দরকার থাকলে কি কিনা লাগে
- **Hetzner AX102** (€38.15/মাস): AMD Ryzen 9 7950X3D, 128GB RAM, 2x1TB NVMe — CPU-এ Ollama ভালো চলবে
- **RunPod GPU Cloud**: RTX 4090 $0.44/ঘন্টা — জত কম সময়ের জন্য

---

## 2. Polygon RPC — পাইয়া বনাম ওপেন সোর্স

### পাইয়া রাস্তা

| প্রোভাইডার | ফ্রি টিয়ার | পেধ টিয়ার | দর |
|------------|-----------|----------|-----|
| **Infura** | 100k req/day | $49/মাস | [infura.io](https://infura.io) |
| **Alchemy** | নেই | $49/মাস | [alchemy.com](https://alchemy.com) |
| **QuickNode** | নেই | $10/মাস | [quicknode.com](https://quicknode.com) |

### ওপেন সোর্স অল্টারনেটিভ — **পাবলিক Polygon RPC + সেল্ফ নোড**

```bash
# পাবলিক Polygon RPC (ছড়িয়া রেট-লিমিট থাকে)
https://polygon-rpc.com
https://polygon.llamarpc.com
https://polygon.drpc.org

# সেল্ফ-হোস্ট Polygon নোড (সম্পূর্ণ ফ্রি)
docker run -d \
  --name polygon-node \
  -p 8545:8545 \
  -v /data/polygon:/data \
  0xpolygon/bor:latest \
  --http --http.addr 0.0.0.0 --http.port 8545
```

**কিন্তু সেল্ফ নোড লাগবে:**
- SSD: 2TB+ NVMe (নোড সিঙ্ক করা লাগে)
- RAM: 32GB+ (সিন্ক করার জন্য)
- CPU: 8+ cores
- Bandwidth: অনেক থাকে

**সারাহ**: সেল্ফ নোড কারেক্টার জন্য থাগবে বড় সার্ভার। শুরুতে পাবলিক RPC ব্যবহার করুন।

---

## 3. IPFS Pinning — পাইয়া বনাম ওপেন সোর্স

### পাইয়া রাস্তা

| প্রোভাইডার | ফ্রি টিয়ার | পেধ টিয়ার | দর |
|------------|-----------|----------|-----|
| **Pinata** | 100 files, 1GB | $20/মাস | [pinata.cloud](https://pinata.cloud) |
| **Filebase** | 1GB storage | $5.99/মাস | [filebase.com](https://filebase.com) |
| **Lighthouse** | 1GB | $1/মাস | [lighthouse.storage](https://lighthouse.storage) |

### ওপেন সোর্স অল্টারনেটিভ — **Kubo (go-ipfs)**

```bash
# Kubo IPFS নোড সেটাপ (সম্পূর্ণ ফ্রি)
wget https://dist.ipfs.io/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz
tar -xzf kubo_v0.29.0_linux-amd64.tar.gz
cd kubo && sudo bash install.sh

# রান করা
ipfs init
ipfs daemon

# ফাইল অপলোড করা
ipfs add evidence.pdf
# রিজল্ট: QmXxxxxx... (এই CID কন্ট্রাক্টে সেভ করা)
```

**Kubo কিন্তু লাগবে:**
- সার্ভারে চলাতে হবে (অতিরিক্ত নিজে থাকে)
- স্টোরেজ: 50-100GB SSD (অতিরিক্ত তথ্য বেশি হলে)
- র্যাম: 4GB+

**সারাহ**: পাবলিক IPFS gateway (যেমন `https://ipfs.io/ipfs/Qm...`) ব্যবহার করুন কিন্তু পিন করুন সার্ভারে। কিন্তু সার্ভারে পিন করা লাগলে জত সময়ে কনেক্ট হতে পারে।

---

## 4. Redis Cache — পাইয়া বনাম ওপেন সোর্স

### পাইয়া রাস্তা

| প্রোভাইডার | ফ্রি টিয়ার | পেধ টিয়ার | দর |
|------------|-----------|----------|-----|
| **Upstash** | 10k req/day | $10/মাস | [upstash.com](https://upstash.com) |
| **Redis Cloud** | 30MB | $0-7/মাস | [redis.io/cloud](https://redis.io/cloud) |

### ওপেন সোর্স অল্টারনেটিভ — **Redis লোকাল ইনস্টল**

```bash
# Redis ইন্সটল (সম্পূর্ণ ফ্রি)
sudo apt update
sudo apt install redis-server -y

# কনফিগারেশ঩
sudo nano /etc/redis/redis.conf
# bind 127.0.0.1 ::1  →  লোকালহোস্ট মাত্র
# maxmemory 256mb
# maxmemory-policy allkeys-lru

sudo systemctl enable redis-server
sudo systemctl start redis-server

# টেস্ট
redis-cli ping
# PONG
```

**KeyDB** (Redis-এর থেকে দ্বিগুন ফরক): 
```bash
# KeyDB ইন্সটল করুন (মাল্টি-থ্রেড সাপোর্ট করে)
sudo apt install keydb -y
```

---

## 5. Blockchain ভেরিফাই — পাইয়া বনাম ওপে঩ সোর্স

### পাইয়া রাস্তা

| প্রোভাইডার | ফ্রি টিয়ার | পেধ টিয়ার | দর |
|------------|-----------|----------|-----|
| **Polygonscan API** | 5 calls/sec | $199/মাস (Pro) | [polygonscan.com](https://polygonscan.com) |

### ওপেন সোর্স অল্টারনেটিভ

- **সেল্ফ-হোস্ট Subgraph** (সার্ভারে চলানো যায়): The Graph সাবরাফ সেটাপ করুন
- **সেল্ফ-হোস্ট সার্ভার**: সার্ভারে চলানো সেল্ফ নোড ব্যবহার করুন, কোনো API দরকার থাকে না
- **পাবলিক Polygonscan**: সারাহিত ট্রানজাকশ঩ সমযয় দেখার জন্য পাবলিক API যায় কিন্তু রেট লিমিট অনেক্ থাকে

---

## 6. ওয়ালেট / Private Key — সম্পূর্ণ ফ্রি

**কোনো খরচ লাগে না**। মেটামাস্ক বা র্যাবি ব্রাউজার ডাউনলোড করুন, স্ব অ্যাকাউন্ট তৈরি করুন। কোনো কস্ট নেই।

---

## 7. সার্ভার ক্লাউড — পাইয়া বনাম ওপেন সোর্স

### পাইয়া রাস্তা

| প্রোভাইডার | দর | সার্ভার |
|------------|-----|--------|
| **AWS EC2** | $50-200/মাস | t3.large / t3.xlarge |
| **Google Cloud** | $50-200/মাস | e2-standard-4 |
| **DigitalOcean** | $24-48/মাস | 4GB/8GB RAM |

### ওপেন সোর্স অল্টারনেটিভ — **Hetzner VPS (আপনার ইতিমধ্যে ব্যবহার করছেন)**

|সার্ভার | দর | RAM | CPU | SSD |
|--------|-----|-----|-----|-----|
| **CX22** | €4.51/মাস | 4GB | 2 vCPU | 40GB |
| **CPX21** | €8.21/মাস | 8GB | 4 vCPU | 80GB |
| **CPX31** | €14.76/মাস | 16GB | 8 vCPU | 160GB |
| **AX42** | €20.60/মাস | 64GB | 8 vCPU | 512GB |
| **AX102** | €38.15/মাস | 128GB | 16 vCPU | 2x1TB |

**আপনার বর্তমান সার্ভার**: Hetzner Helsinki .195 — তাই আরো কিছু খরচ লাগবে না।

---

## সমপূর্ণ ওপেন সোর্স সেটাপ (সমপূর্ণ ফ্রি সার্ভার)

আপনার হেত্জনার সার্ভারে সমপূর্ণ ওপেন সোর্স সেটাপ করা যাবে:

```bash
#!/bin/bash
# setup_open_source_stack.sh

# 1. Redis
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 2. IPFS (Kubo)
wget https://dist.ipfs.io/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz
tar -xzf kubo_v0.29.0_linux-amd64.tar.gz
sudo cp kubo/ipfs /usr/local/bin/
ipfs init
nohup ipfs daemon > /var/log/ipfs.log 2>&1 &

# 3. Ollama (AI)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1:8b
nohup ollama serve > /var/log/ollama.log 2>&1 &

# 4. PostgreSQL (Supabase এর জন্র লাগে)
# Supabase CLI ব্যবহার করুন

# 5. Nginx reverse proxy
sudo apt install nginx -y

# 6. PM2 for process management
sudo npm install -g pm2

echo "সমপূর্ণ! সমস্ত সার্ভিস সেটাপ হয়ে গেছে"
```

---

## মাসিক খরচ তুলনা

| সার্স | পাইয়া (মাসিক) | ওপেন সোর্স (মাসিক) | সিলিয়াম |
|--------|----------------|---------------------|--------|
| AI LLM | $10-50 | $0 (Ollama) | **$600+/বছর** |
| RPC | $49 | $0 (পাবলিক) | **$588/বছর** |
| IPFS | $20 | $0 (Kubo) | **$240/বছর** |
| Redis | $10 | $0 (লোকাল) | **$120/বছর** |
| সার্ভার | $50 | $0 (Hetzner ইতিমধ্যে) | **$600/বছর** |
| **মোট** | **$140+** | **$0** | **$1,680+/বছর** |

---

## সারাহ সার্ভার কনফিগারেশন

```bash
# আপনার .env ফাইল (ওপে঩ সোর্স সেটাপ)
cat > .env << 'ENV'
# AI (Ollama লোকাল)
AI_SERVICE_URL=http://127.0.0.1:11434
AI_MODEL=llama3.1:8b

# RPC (পাবলিক Polygon)
POLYGON_RPC=https://polygon-rpc.com
AMOY_RPC=https://rpc-amoy.polygon.technology

# IPFS (লোকাল Kubo)
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY=http://127.0.0.1:8080

# Redis (লোকাল)
REDIS_URL=redis://127.0.0.1:6379/0

# Contract addresses (ডিপ্লয় পরে)
PLKY_TOKEN_ADDRESS=0x...
RESOLVER_ADDRESS=0x...

# Admin wallet
PRIVATE_KEY=0x...
ENV
```

---

## সারাহ সার্ভার দরকার থাকলে কি কিনা লাগে

| সার্ভার | লাগে কি | কারণ |
|--------|---------|--------|
| Ollama (AI) | Hetzner AX102 বা CPX31 | CPU সাপোর্ট করতে হবে |
| Kubo (IPFS) | যেকোন সার্ভারে | Storage 50-100GB থাকে |
| Redis | লোকালহোস্ট মাত্র | লোকালি রান করে |
| PostgreSQL | Hetzner-এ লাগে | Supabase লোকাল স্টেক চলায় |

---

## সিদ্ধান্ত সার্ভার কনফিগারেশন (প্রোডাকশ঩)

```yaml
# docker-compose.yml — সমপূর্ণ ওপেন সোর্স স্ট্যাক
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

  ipfs:
    image: ipfs/kubo:latest
    ports:
      - "4001:4001"
      - "5001:5001"
      - "8080:8080"
    volumes:
      - ipfs_data:/data/ipfs

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # GPU থাকলে:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  ai-service:
    build: ./ai-service
    ports:
      - "8081:8081"
    environment:
      - REDIS_URL=redis://redis:6379/0
      - AI_SERVICE_URL=http://ollama:11434
      - AI_MODEL=llama3.1:8b
    depends_on:
      - redis
      - ollama

volumes:
  redis_data:
  ipfs_data:
  ollama_data:
```

---

## সারাহ সমস্যা তালিকা

| সমস্যা | কিভাবে সমাধান |
|---------|----------------|
| Ollama স্লো | CPU-এ চললে GPU লাগান |
| IPFS নোড সিন্ক | সার্ভার রিস্টার্ট করুন |
| Redis ডেটা হারিয়ে যায় | ব্যাকাপ রাখুন |
| AI রিজল্ট ভালো | সারাহ সার্ভার দরকার জন্য |

---

*সর্বশেষ তথ্য: 8 মে, 2026*
