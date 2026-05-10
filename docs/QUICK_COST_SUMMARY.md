# সার্ভিস খরচ সারাহশির (বাংলা)

## সার্ভিস তালিকা

| ক্রম | সার্ভিস | পাইয়া সমাধান | ওপেন সোর্স সমাধা঩ | সার্ভার দরকার থাকলে কিনা |
|------|--------|----------------|---------------------|--------------------------|
| 1 | AI LLM (Gemini/MiniMax) | Google AI Studio / MiniMax API | **Ollama + Llama 3/Mistral** লোকালি চলানো | হ্যাতসার সার্ভারে সমাধান |
| 2 | Polygon RPC | Infura/Alchemy ($0-$49/মাস) | **পাবলিক Polygon RPC** + সেল্ফ-হোস্ট নোড | লোকাল নোড চলানো |
| 3 | IPFS Pinning | Pinata ($20/মাস) / Filebase ($5/মাস) | **Kubo (go-ipfs)** লোকাল নোড | সার্হারে স্টোরেজ থাকা |
| 4 | Redis Cache | Upstash ($10/মাস) | **Redis** লোকাল ইনস্টল | লোকালি রান করা |
| 5 | Blockchain ভেরিফাই | Polygonscan API (free) | পাবলিক API থেকে সার্ভার ডেটা নিজে | সেখানে থাকা |
| 6 | ব্যালেট / Private Key | সম্পূর্ণ ফ্রি | MetaMask / Rabby ব্রাউজার ডাউনলোড করা | সম্পূর্ণ ফ্রি |
| 7 | সমর্থন ক্লাউড | AWS/GCP ($50-200/মাস) | **Hetzner VPS** (€5/মাস) + সেল্ফ-হোস্ট | সার্ভারে চলানো |

---

## মাসিক খরচ তুলনা

| সার্স | পাইয়া (মাসিক) | ওপে঩ সোর্স (মাসিক) | সিলিয়াম |
|--------|----------------|---------------------|--------|
| AI LLM | $10-50 | $0 (Ollama) | **$600+/বছর** |
| RPC | $49 | $0 (পাবলিক) | **$588/বছর** |
| IPFS | $20 | $0 (Kubo) | **$240/বছর** |
| Redis | $10 | $0 (লোকাল) | **$120/বছর** |
| সার্হার | $50 | $0 (Hetzner ইতিমধ্যে) | **$600/বছর** |
| **মোট** | **$140+** | **$0** | **$1,680+/বছর** |

---

## সারাহ সার্ভার কনফিগারেশ঩ (প্রোডাকশন)

```yaml
# docker-compose.yml — সমপূর্ণ ওপে঩ সোর্স স্ট্যাক
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

*সর্বশেষ তথ্য: 8 মে, 2026*
