# প্লোকিরেজলুশন v2.0 — স্টেপ বাই স্টিপ প্লান
# PlokyResolution v2.0 — Step-by-Step Implementation Plan

---

## প্রিরিক্ষানীয় তথ্য

**স্টেপ কত গুলো:** 12 স্টেপ
**সময় প্রয়োজন:** 4-6 সপ্তাহ
**প্লাটফর্ম:** Polygon PoS (Amoy testnet সুদুকরিত করুন)

---

## Phase 1: মান্যারিয় তত্থ নির্ধারণ (Week 1)

### স্টেপ 1.1: সার্ভার সেটাপ
**সময়:** 1-2 দিন

```bash
# AI সার্ভার সেটাপ
pip install redis
sudo apt install redis-server
sudo systemctl enable redis-server

# AI সার্ভিস ডিপলয় করুন
cd ai-service
pip install -r requirements.txt

# .env ফাইল তৈরি করুন
cat > .env << 'EOF'
GEMINI_API_KEY=your_gemini_api_key_here
MINIMAX_API_KEY=your_minimax_api_key_here
POLYGON_RPC=https://polygon-amoy.infura.io/v3/YOUR_INFURA_KEY
PLKY_RESOLVER_ADDRESS=0x...
AI_SERVICE_PRIVATE_KEY=0x...
REDIS_URL=redis://localhost:6379/0
EOF
```

### স্টেপ 1.2: AI সার্ভিস রান করা
**সময়:** 30 মিনিট

```bash
cd ai-service
uvicorn main:app --host 0.0.0.0 --port 8081 --reload

# টেস্ট করুন
curl -X POST http://localhost:8081/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "test-123",
    "title": "শেষ ২০২৫-২০২৬ এর পর কালকের রাত থাকবে 30°C?",
    "description": "বাংলাদেশের জাতীয় উত্তাপ ক্ষেত্রে শেষ ২০২৫-২০২৬ এর পর কালকের রাত সরাসরি 30°C বা তার অধিক হবে কিনা?",
    "category": "আবহাওয়া",
    "tier": "OBJECTIVE",
    "evidence_cids": []
  }'
```

### স্টেপ 1.3: সমার্থন কনেক্ট করা
**সময়:** 15 মিনিট

```bash
# AI সার্ভার সমান্ত কিনা চলছে
curl http://localhost:8081/health
# অনুমান রিজল্ট:
# {"status":"healthy","version":"2.0.0","gemini_available":true,...}
```

---

## Phase 2: সমার্ট কন্ট্রাক্ট ডিপ্লয় (Week 1-2)

### স্টেপ 2.1: Hardhat প্রজেক্ট সেটাপ
**সময়:** 2-3 ঘন্টা

```bash
cd contracts

# Hardhat এবং dependencies ইন্সটল করুন
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init  # বেসিক সেটাপ নির্বাচন করুন

# OpenZeppelin ইন্সটল করুন
npm install @openzeppelin/contracts

# প্লাগিন এর জন্য Hardhat সেটাপ
npm install --save-dev @nomicfoundation/hardhat-verify dotenv
```

### স্টেপ 2.2: hardhat.config.ts সেটাপ
**সময়:** 30 মিনিট

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC || "https://polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    amoy: {
      url: process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};

export default config;
```

### স্টেপ 2.3: .env ফাইল
**সময়:** 5 মিনিট

```bash
cat > .env << 'EOF'
PRIVATE_KEY=your_private_key_here
POLYGON_RPC=https://polygon-mainnet.infura.io/v3/YOUR_KEY
AMOY_RPC=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your_polygonscan_key
EOF
```

### স্টেপ 2.4: PLKY Token ডিপ্লয়
**সময়:** 1 ঘন্টা

```solidity
// contracts/PlokyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PlokyToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor(address admin) ERC20("Ploky Token", "PLKY") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        _mint(admin, 1_000_000 * 10**decimals()); // 1M initial supply
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }
}
```

### স্টেপ 2.5: PlokyResolver.sol ডিপ্লয়
**সময়:** 2-3 ঘন্টা (already provided above)

```bash
# কন্ট্রাক্ট কপি করুন
cp /path/to/PlokyResolver.sol contracts/PlokyResolver.sol
```

### স্টেপ 2.6: কম্পাইল এবং টেস্ট
**সময়:** 2-3 ঘন্টা

```bash
# কম্পাইল করুন
npx hardhat compile

# টেস্ট করুন
npx hardhat test
```

### স্টেপ 2.7: ডিপ্লয় স্ক্রিপ্ট
**সময়:** 30 মিনিট

```bash
# Amoy testnet-এ ডিপ্লয় করুন
npx hardhat run scripts/deploy.ts --network amoy

# মেনেত ডিপ্লয়
# npx hardhat run scripts/deploy.ts --network polygon

# ভেরিফাই করুন
# npx hardhat verify --network amoy CONTRACT_ADDRESS constructor_args...
```

---

## Phase 3: সাম্পর্ক কনেক্ট (Week 2)

### স্টেপ 3.1: সাম্পর্ক কনেক্ট কনেক্ট
**সময়:** 1-2 ঘন্টা

```typescript
// সাম্পর্ক কনেক্ট কনেক্ট
import { PlokyResolver__factory } from "../typechain-types";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const resolver = PlokyResolver__factory.connect(
  "0xYOUR_RESOLVER_ADDRESS",
  signer
);

// প্রশ্ন তৈরি করুন
const tx = await resolver.createQuestion(
  "বিশ্বকাপ এর নিরাপেক চামপিয়ন কি হবে?",
  "QmEvidenceCID",
  "খেলাধুলা",
  Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  0 // OBJECTIVE tier
);
await tx.wait();
```

### স্টেপ 3.2: Subgraph সেটাপ
**সময়:** 1 ঘন্টা

```bash
# The Graph CLI ইন্সটল করুন
npm install -g @graphprotocol/graph-cli

# সাবরাফ সেটাপ
cd subgraph
graph init --protocol ethereum --contract-name PlokyResolver

# জিএসন টেমপ্লেট সাম্পল
cat > subgraph.yaml << 'EOF'
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: PlokyResolver
    network: polygon
    source:
      address: "0xYOUR_RESOLVER_ADDRESS"
      abi: PlokyResolver
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Question
        - Evidence
        - Dispute
        - Resolver
      abis:
        - name: PlokyResolver
          file: ./abis/PlokyResolver.json
      eventHandlers:
        - event: QuestionCreated(bytes32,string,address,uint256,string,uint8)
          handler: handleQuestionCreated
        - event: EvidenceSubmitted(bytes32,address,string,uint8,uint256)
          handler: handleEvidenceSubmitted
        - event: VerdictProposed(bytes32,bytes32,uint8,address,string,uint256)
          handler: handleVerdictProposed
        - event: DisputeRaised(bytes32,address,string,string,uint256)
          handler: handleDisputeRaised
      file: ./src/mapping.ts
EOF

# সাবত্য করুন
graph codegen && graph build

# সাবগ্রাফে ডিপ্লয় করুন
graph deploy --product hosted-service your-username/ploky-resolver
```

---

## Phase 4: ফ্রন্টেন্ড ইন্টিগ্রেশন (Week 2-3)

### স্টেপ 4.1: Next.js এপিআই রুট সেটাপ
**সময়:** 30 মিনিট

```typescript
// apps/web/src/app/api/resolution/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8081";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "AI service unavailable", fallback: true },
      { status: 503 }
    );
  }
}
```

### স্টেপ 4.2: Resolution Dashboard কম্পোনেন্ট
**সময়:** 2-3 ঘন্টা

```tsx
// components/resolution/ResolutionDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { PlokyResolver__factory } from "@/typechain-types";

export default function ResolutionDashboard() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
    const resolver = PlokyResolver__factory.connect(
      process.env.NEXT_PUBLIC_RESOLVER_ADDRESS!,
      provider
    );
    
    const ids = await resolver.getAllIds();
    const qList = await Promise.all(
      ids.map(async (id) => {
        const q = await resolver.questions(id);
        return {
          id,
          title: q.title,
          status: getStatusLabel(q.status),
          outcome: getOutcomeLabel(q.outcome),
          tier: getTierLabel(q.tier),
          disputeCount: Number(q.disputeCount),
          aiConfidence: Number(q.aiConfidenceScore) / 100,
        };
      })
    );
    
    setQuestions(qList);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">রিজলুশন ড্যাশবোর্ড</h1>
      {loading ? (
        <p>লোড হছে...</p>
      ) : (
        <div className="grid gap-4">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status: number): string {
  const labels = ["খোলা", "প্রস্তাবিত", "টাইমলাক", "সমাধান", "বাতিল", "AI রিভিউ", "কমিসিটি ভোট"];
  return labels[status] || "অজানা";
}

function getOutcomeLabel(outcome: number): string {
  const labels = ["সমাধান হয়নি", "YES", "NO", "ডিসপুটেড", "বাতিল", "AI অপেক্ষা", "UMA অপেক্ষা"];
  return labels[outcome] || "অজানা";
}

function getTierLabel(tier: number): string {
  const labels = ["স্বতন্ত্র", "সেমি-সাবিজেক্টিভ", "পূর্ণপারে সাবিজেক্টিভ"];
  return labels[tier] || "অজানা";
}

function QuestionCard({ question }: { question: any }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{question.title}</h3>
        <span className={`px-2 py-1 rounded text-sm ${
          question.status === "সমাধান" ? "bg-green-100 text-green-800" :
          question.status === "বাতিল" ? "bg-red-100 text-red-800" :
          "bg-yellow-100 text-yellow-800"
        }`}>
          {question.status}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600 flex gap-4">
        <span>টিয়ার: {question.tier}</span>
        <span>সমাধান: {question.outcome}</span>
        <span>ডিসপুট: {question.disputeCount}</span>
        <span>AI কন্ফিডেন্স: {question.aiConfidence}%</span>
      </div>
    </div>
  );
}
```

### স্টেপ 4.3: Evidence Viewer কম্পোনেন্ট
**সময়:** 1-2 ঘন্টা

```tsx
// components/resolution/EvidenceViewer.tsx
"use client";

import { useState } from "react";

interface Evidence {
  ipfsCID: string;
  description: string;
  submitter: string;
  timestamp: number;
  evidenceType: number;
}

export default function EvidenceViewer({ evidence }: { evidence: Evidence[] }) {
  const [selectedCID, setSelectedCID] = useState<string | null>(null);

  const getTypeColor = (type: number) => {
    const colors = ["bg-green-100 text-green-800", "bg-red-100 text-red-800", "bg-gray-100 text-gray-800"];
    return colors[type] || colors[2];
  };

  const getTypeLabel = (type: number) => {
    const labels = ["সাপোর্টিং", "অপোজিঙ", "নিউট্রাল"];
    return labels[type] || "নিউট্রাল";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">এভিডেন্স সমূহ</h2>
      {evidence.length === 0 ? (
        <p className="text-gray-500">কোনো evidence জমা করা হয়নি</p>
      ) : (
        evidence.map((e, i) => (
          <div key={i} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-2 py-1 rounded text-xs ${getTypeColor(e.evidenceType)}`}>
                  {getTypeLabel(e.evidenceType)}
                </span>
                <p className="mt-2 text-sm">{e.description}</p>
                <p className="mt-1 text-xs text-gray-500">
                  সাবমিটার: {e.submitter.slice(0, 6)}...{e.submitter.slice(-4)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCID(e.ipfsCID)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                IPFS দেখুন
              </button>
            </div>
            {selectedCID === e.ipfsCID && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <iframe
                  src={`https://gateway.pinata.cloud/ipfs/${e.ipfsCID}`}
                  className="w-full h-64 border rounded"
                  title="Evidence"
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
```

---

## Phase 5: টেস্টনেট এবং লাউন্চ (Week 3)

### স্টেপ 5.1: আর্দরাতে রিজলভার সেটাপ
**সময়:** 1-2 ঘন্টা

```bash
# প্লকি টোকেন করে রিজলভারের স্টেক করুন
cd contracts

# Hardhat console
npx hardhat console --network amoy

# Console commands:
# const resolver = await ethers.getContractAt("PlokyResolver", "0x...")
# const plky = await ethers.getContractAt("PlokyToken", "0x...")
# 
# // Stake as resolver
# await plky.approve(resolver.address, ethers.parseEther("5000"))
# await resolver.stakeAsResolver(ethers.parseEther("1000"))
#
# // Create a test question
# await resolver.createQuestion(
#   "Test Question",
#   "QmTestCID",
#   "Test",
#   Math.floor(Date.now()/1000) + 86400,
#   0 // OBJECTIVE
# )
```

### স্টেপ 5.2: End-to-End টেস্ট
**সময়:** 2-3 ঘন্টা

```typescript
// test/integration/ResolutionFlow.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("PlokyResolution Integration", () => {
  let resolver, plky;
  let admin, resolver1, resolver2, resolver3;

  before(async () => {
    [admin, resolver1, resolver2, resolver3] = await ethers.getSigners();
    
    const PLKYToken = await ethers.getContractFactory("PlokyToken");
    plky = await PLKYToken.deploy(admin.address);
    
    const PlokyResolver = await ethers.getContractFactory("PlokyResolver");
    resolver = await PlokyResolver.deploy(plky.address, admin.address, 2);
    
    // Mint and stake
    for (const r of [resolver1, resolver2, resolver3]) {
      await plky.mint(r.address, ethers.parseEther("5000"));
      await plky.connect(r).approve(resolver.address, ethers.parseEther("5000"));
      await resolver.connect(r).stakeAsResolver(ethers.parseEther("1000"));
    }
  });

  it("should create and resolve an objective question with AI", async () => {
    // Create question
    const tx = await resolver.createQuestion(
      "Is the sky blue?",
      "QmTestCID",
      "Test",
      Math.floor(Date.now() / 1000) + 86400,
      0 // OBJECTIVE
    );
    const receipt = await tx.wait();
    const event = receipt.logs[0];
    const qId = event.topics[1];

    // Submit AI analysis
    await resolver.grantRole(await resolver.AI_ORACLE_ROLE(), admin.address);
    await resolver.submitAIAnalysis(
      qId,
      9000, // 90% confidence
      1, // YES
      "QmAICID",
      8000, // sentiment
      8500, // fact check
      2000  // low bias
    );

    // Check auto-resolution
    const q = await resolver.questions(qId);
    expect(q.outcome).to.equal(1); // YES
    expect(q.status).to.equal(3); // RESOLVED
  });

  it("should handle disputes correctly", async () => {
    // Create subjective question
    const tx = await resolver.createQuestion(
      "Will BD win the World Cup?",
      "QmTestCID",
      "Cricket",
      Math.floor(Date.now() / 1000) + 86400,
      2 // FULLY_SUBJECTIVE
    );
    const receipt = await tx.wait();
    const qId = receipt.logs[0].topics[1];

    // Propose verdict
    await plky.connect(resolver1).approve(resolver.address, ethers.parseEther("100"));
    await resolver.connect(resolver1).proposeVerdict(qId, 1, "QmReasonCID", "BD will win");

    // Approve
    const q = await resolver.questions(qId);
    await resolver.connect(resolver2).approveVerdict(qId, q.activeProposalId);
    await resolver.connect(resolver3).approveVerdict(qId, q.activeProposalId);

    // Fast forward timelock
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine");

    // Execute
    await resolver.executeVerdict(qId);

    // Raise dispute
    const disputer = admin;
    await plky.mint(disputer.address, ethers.parseEther("100"));
    await plky.connect(disputer).approve(resolver.address, ethers.parseEther("50"));
    await resolver.connect(disputer).raiseDispute(qId, "Wrong verdict", "QmEvidenceCID");

    // Resolve dispute
    await resolver.connect(admin).resolveDispute(qId, 0, "Dispute valid", true);
  });
});
```

### স্টেপ 5.3: Amoy Testnet লাউন্চ
**সময়:** 1 দিন

```bash
# Deploy to Amoy
npx hardhat run scripts/deploy.ts --network amoy

# Get test MATIC from Amoy faucet
# https://amoy.polygonscan.com/faucet

# Test interactions
npx hardhat console --network amoy

# Frontend connection test
# Update .env.local:
NEXT_PUBLIC_RESOLVER_ADDRESS=0x...
NEXT_PUBLIC_PLKY_ADDRESS=0x...
NEXT_PUBLIC_AI_SERVICE_URL=http://your-ai-server:8081
```

---

## Phase 6: প্রোডাকশন ডিপ্লয় (Week 4)

### স্টেপ 6.1: প্লানিং এবং চেকলিস্ট
**সময়:** 2-3 দিন

```bash
# Security audit checklist
# 1. Access control checks
# 2. Reentrancy protection
# 3. Integer overflow/underflow
# 4. Gas optimization
# 5. Front-running protection
# 6. Timelock verification

# Run Slither analysis
pip install slither-analyzer
slither contracts/PlokyResolver.sol

# Run Mythril
pip install mythril
myth analyze contracts/PlokyResolver.sol

# Manual review points:
# - Check all onlyRole modifiers
# - Verify timelock cannot be bypassed
# - Verify dispute threshold auto-freeze
# - Check bond return/seize logic
```

### স্টেপ 6.2: সার্ভার কনফিগারেশন
**সময়:** 2-3 ঘন্টা

```bash
# AI Service PM2 config
cat > ai-service.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ploky-ai',
    script: './main.py',
    interpreter: 'python3',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8081
    },
    log_file: './logs/ai-service.log',
    out_file: './logs/ai-service-out.log',
    error_file: './logs/ai-service-error.log'
  }]
};
EOF

# Start with PM2
pm2 start ai-service.config.js
pm2 save
pm2 startup

# Nginx reverse proxy
cat > /etc/nginx/sites-available/ploky-ai << 'EOF'
server {
    listen 443 ssl;
    server_name ai.plokymarket.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/ploky-ai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### স্টেপ 6.3: মেনেট ডিপ্লয়
**সময়:** 2-3 ঘন্টা

```bash
# Polygon mainnet deploy
npx hardhat run scripts/deploy.ts --network polygon

# Verify on PolygonScan
npx hardhat verify --network polygon RESOLVER_ADDRESS PLKY_ADDRESS ADMIN_ADDRESS QUORUM

# Set AI oracle role
npx hardhat run scripts/set-oracle.ts --network polygon

# Configure treasury
npx hardhat run scripts/set-treasury.ts --network polygon
```

---

## Phase 7: মানিটরিং (Ongoing)

### স্টেপ 7.1: মোনিটরিং সেটাপ
**সময়:** 2-3 ঘন্টা

```bash
# Prometheus + Grafana setup
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards

  alertmanager:
    image: prom/alertmanager
    ports:
      - "9093:9093"

volumes:
  prometheus_data:
  grafana_data:
```

### স্টেপ 7.2: লগিং এবং সিগনালিং
**সময়:** 1 ঘন্টা

```bash
# AI Service logs
tail -f logs/ai-service.log

# Blockchain events monitoring
npx hardhat run scripts/monitor-events.ts --network polygon

# Set up alerts for:
# - High dispute rates
# - Low resolver activity
# - AI service downtime
# - Large bond seizures
```

---

## প্রয়োজনীয় সময়সূচি

| Phase | স্টেপ | সময় | অবস্থা |
|-------|------|-------|--------|
| Phase 1 | AI Service সেটাপ | 2-3 দিন | সাম্পর্ক কনেক্ট করা |
| Phase 2 | Smart Contract ডিপ্লয় | 4-5 দিন | কম্পাইল + টেস্ট |
| Phase 3 | Subgraph + SDK | 2-3 দিন | সাবগ্রাফ ডিপ্লয় |
| Phase 4 | Frontend Integration | 4-5 দিন | UI কম্পোনেন্ট কম্পলিট |
| Phase 5 | Testing + Launch | 3-4 দিন | Amoy লাউন্চ |
| Phase 6 | Production Deploy | 2-3 দি঩ | Mainnet সিকিউর |
| Phase 7 | Monitoring | Ongoing | Prometheus/Grafana |

**Total Timeline:** 4-6 সপ্তাহ

---

## অতিরিক্ত তথ্য

### API Endpoints (AI Service)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/analyze` | POST | Run AI analysis on question |
| `/analyze/evidence` | POST | Analyze single evidence piece |
| `/assess-risk` | POST | Assess dispute risk |
| `/batch-analyze` | POST | Batch analyze questions |
| `/analysis/{id}` | GET | Get cached analysis |
| `/submit-to-chain` | POST | Submit analysis to blockchain |

### Contract Functions

| Function | Access | Description |
|----------|--------|-------------|
| `createQuestion` | Public | Create new resolution question |
| `submitEvidence` | Public | Submit evidence with bond |
| `proposeVerdict` | Resolver | Propose resolution verdict |
| `approveVerdict` | Resolver | Approve proposed verdict |
| `executeVerdict` | Public | Execute after timelock |
| `raiseDispute` | Public | Raise dispute with bond |
| `resolveDispute` | Arbiter | Resolve dispute |
| `submitAIAnalysis` | AI Oracle | Submit AI analysis |
| `stakeAsResolver` | Public | Stake PLKY to become resolver |
| `requestUMAResolution` | Resolver | Escalate to UMA |

---

## সার্স কোড

### Smart Contract
- `contracts/PlokyResolver.sol` - Main resolution contract
- `contracts/PlokyToken.sol` - PLKY governance token

### AI Service
- `ai-service/main.py` - FastAPI AI analysis service
- `ai-service/requirements.txt` - Python dependencies

### Frontend
- `apps/web/src/app/api/resolution/` - API routes
- `apps/web/components/resolution/` - React components

### Deploy
- `contracts/scripts/deploy.ts` - Hardhat deploy script
- `contracts/hardhat.config.ts` - Network config

---

*সর্বশেষ তথ্য: 8 মে, 2026*
*সংস্করণ: প্লোকিরেজলুশন v2.0 টিম*
