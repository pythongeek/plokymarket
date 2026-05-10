"""
Ploky AI Resolution Service v2.1 — Open Source Stack
প্লোকি AI সমাধান সার্ভিস (ওপেন সোর্স)

FastAPI service for AI-powered evidence analysis, sentiment detection,
fact verification, and resolution recommendations.

Stack: MiniMax API (primary) → Ollama (self-hosted fallback)
       Redis (local) | Kubo IPFS (local) | Public Polygon RPC
"""

import os
import json
import hashlib
import asyncio
import ipaddress
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import redis
from web3 import Web3

# ───────────────────────────────────────────────────────────────────────────────
# CONFIG — Open Source Stack
# ───────────────────────────────────────────────────────────────────────────────

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_GROUP_ID = os.getenv("MINIMAX_GROUP_ID", "")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_FALLBACK_MODEL = os.getenv("OLLAMA_FALLBACK_MODEL", "mistral")

# Public Polygon RPC — no Infura/Alchemy needed
POLYGON_RPC = os.getenv(
    "POLYGON_RPC",
    "https://polygon-rpc.com"  # Public, free, open-source endpoint
)
AMOY_RPC = os.getenv(
    "AMOY_RPC",
    "https://rpc-amoy.polygon.technology"  # Public Amoy testnet
)

PLKY_RESOLVER_ADDRESS = os.getenv("PLKY_RESOLVER_ADDRESS", "")
PRIVATE_KEY = os.getenv("AI_SERVICE_PRIVATE_KEY", "")

# IPFS — local Kubo node
IPFS_API_HOST = os.getenv("IPFS_API_HOST", "localhost")
IPFS_API_PORT = int(os.getenv("IPFS_API_PORT", "5001"))
IPFS_GATEWAY = os.getenv("IPFS_GATEWAY", "http://localhost:8080/ipfs")

CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour
AI_AUTO_RESOLVE_THRESHOLD = int(os.getenv("AI_AUTO_RESOLVE_THRESHOLD", "8500"))  # 85%

# Bangladeshi news sources for fact-checking
BD_NEWS_SOURCES = [
    "prothomalo.com", "bdnews24.com", "thedailystar.net",
    "banglatribune.com", "jugantor.com", "kalerkantho.com",
    "samakal.com", "daily-sun.com", "dhakatribune.com"
]

# ───────────────────────────────────────────────────────────────────────────────
# REDIS
# ───────────────────────────────────────────────────────────────────────────────

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
except Exception as e:
    print(f"[WARN] Redis not available: {e}")
    redis_client = None

# ───────────────────────────────────────────────────────────────────────────────
# ENUMS & MODELS
# ───────────────────────────────────────────────────────────────────────────────

class Outcome(Enum):
    UNRESOLVED = 0
    YES = 1
    NO = 2
    DISPUTED = 3
    CANCELLED = 4
    AI_PENDING = 5
    UMA_PENDING = 6

class EvidenceType(Enum):
    SUPPORTING = 0
    OPPOSING = 1
    NEUTRAL = 2

class QuestionTier(Enum):
    OBJECTIVE = 0
    SEMI_SUBJECTIVE = 1
    FULLY_SUBJECTIVE = 2

class QuestionStatus(Enum):
    OPEN = 0
    PROPOSED = 1
    TIMELOCK = 2
    RESOLVED = 3
    CANCELLED = 4
    AI_REVIEW = 5
    COMMUNITY_VOTE = 6

@dataclass
class AIAnalysisResult:
    confidence: int           # 0-10000 (basis points)
    recommended_outcome: Outcome
    reasoning: str
    sentiment_score: int      # 0-10000
    fact_check_score: int     # 0-10000
    bias_risk_score: int      # 0-10000 (lower is better)
    manipulation_risk: int    # 0-10000 (lower is better)
    evidence_quality: int     # 0-10000
    auto_resolve_eligible: bool
    cache_key: str
    analyzed_at: str
    llm_used: str             # "minimax" | "ollama"

# Pydantic models for API
class AIAnalysisRequest(BaseModel):
    question_id: str
    title: str
    description: str = ""
    category: str = "general"
    tier: int = Field(ge=0, le=2, default=0)
    evidence: List[Dict[str, Any]] = []
    news_urls: List[str] = []

class EvidenceAnalysisRequest(BaseModel):
    evidence_text: str
    evidence_type: int = Field(ge=0, le=2, default=2)
    source_url: str = ""
    question_context: str = ""

class EvidenceAnalysisResponse(BaseModel):
    credibility_score: int
    manipulation_risk: int
    source_reliability: int
    factuality_score: int
    key_claims: List[str]
    contradictions: List[str]
    llm_used: str

class AIAnalysisResponse(BaseModel):
    question_id: str
    confidence: int
    recommended_outcome: str
    reasoning: str
    sentiment_score: int
    fact_check_score: int
    bias_risk_score: int
    manipulation_risk: int
    evidence_quality: int
    auto_resolve_eligible: bool
    analyzed_at: str
    llm_used: str

# ───────────────────────────────────────────────────────────────────────────────
# PROMPT TEMPLATES (Bengali + English)
# ───────────────────────────────────────────────────────────────────────────────

ANALYSIS_PROMPT = """You are Ploky's AI Resolution Oracle. Analyze this prediction market question for resolution.

Question: {title}
Description: {description}
Category: {category}
Tier: {tier}

Evidence:
{evidence_text}

News Sources:
{news_text}

Provide analysis in this EXACT JSON format:
{{
  "confidence": <0-10000>,
  "recommended_outcome": <"YES"|"NO"|"UNRESOLVED">,
  "reasoning": "<detailed reasoning in English>",
  "sentiment_score": <0-10000>,
  "fact_check_score": <0-10000>,
  "bias_risk_score": <0-10000>,
  "manipulation_risk": <0-10000>,
  "evidence_quality": <0-10000>,
  "key_facts": ["<fact 1>", "<fact 2>"],
  "contradictions": ["<contradiction 1>"]
}}

Rules:
- Objective questions (sports results, elections): confidence >9000 if clear facts
- Subjective questions: confidence <8000, recommend community vote
- Flag manipulation if evidence seems coordinated or fake
- Consider Bangladeshi context for local events"""

EVIDENCE_PROMPT = """Analyze this evidence piece for credibility and manipulation risk.

Evidence: {evidence_text}
Type: {evidence_type}
Source: {source_url}
Question Context: {question_context}

Return JSON:
{{
  "credibility_score": <0-10000>,
  "manipulation_risk": <0-10000>,
  "source_reliability": <0-10000>,
  "factuality_score": <0-10000>,
  "key_claims": ["<claim 1>", "<claim 2>"],
  "contradictions": ["<any contradictions>"]
}}"""

DISPUTE_RISK_PROMPT = """Assess dispute risk for this prediction market question.

Question: {title}
Description: {description}
Evidence count: {evidence_count}
Existing disputes: {dispute_count}

Return JSON:
{{
  "dispute_risk_score": <0-10000>,
  "primary_risk_factors": ["<factor 1>", "<factor 2>"],
  "mitigation_suggestions": ["<suggestion 1>"],
  "recommended_tier": <0|1|2>
}}"""

# ───────────────────────────────────────────────────────────────────────────────
# LLM CLIENTS
# ───────────────────────────────────────────────────────────────────────────────

class MiniMaxClient:
    """MiniMax API client — PRIMARY LLM"""
    
    API_BASE = "https://api.minimax.io/v1"
    
    def __init__(self, api_key: str, group_id: str = ""):
        self.api_key = api_key
        self.group_id = group_id
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def chat(self, prompt: str, model: str = "MiniMax-Text-01") -> str:
        """Send chat completion request to MiniMax"""
        if not self.api_key:
            raise RuntimeError("MiniMax API key not configured")
        
        url = f"{self.API_BASE}/text/chatcompletion_v2"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a precise AI oracle for prediction market resolution. Always respond in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 2000
        }
        
        if self.group_id:
            payload["group_id"] = self.group_id
        
        resp = await self.client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["message"]["content"]
        raise RuntimeError(f"MiniMax unexpected response: {data}")

class OllamaClient:
    """Ollama self-hosted client — FALLBACK LLM (open source)"""
    
    def __init__(self, host: str = "http://localhost:11434", model: str = "llama3.2"):
        self.host = host.rstrip("/")
        self.model = model
        self.client = httpx.AsyncClient(timeout=120.0)
    
    async def chat(self, prompt: str, model: Optional[str] = None) -> str:
        """Send chat completion to local Ollama instance"""
        use_model = model or self.model
        url = f"{self.host}/api/generate"
        
        payload = {
            "model": use_model,
            "prompt": prompt,
            "system": "You are a precise AI oracle for prediction market resolution. Always respond in valid JSON only.",
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 2000
            }
        }
        
        resp = await self.client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "")
    
    async def is_available(self) -> bool:
        """Check if Ollama server is running"""
        try:
            resp = await self.client.get(f"{self.host}/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False
    
    async def pull_model(self, model: str) -> bool:
        """Pull a model if not already available"""
        try:
            resp = await self.client.post(
                f"{self.host}/api/pull",
                json={"name": model, "stream": False},
                timeout=300.0
            )
            return resp.status_code == 200
        except Exception:
            return False

# Initialize clients
minimax = MiniMaxClient(MINIMAX_API_KEY, MINIMAX_GROUP_ID) if MINIMAX_API_KEY else None
ollama = OllamaClient(OLLAMA_HOST, OLLAMA_MODEL)

# ───────────────────────────────────────────────────────────────────────────────
# IPFS — LOCAL KUBO
# ───────────────────────────────────────────────────────────────────────────────

class IPFSService:
    """Local Kubo IPFS node client"""
    
    def __init__(self, host: str = "localhost", port: int = 5001):
        self.api_url = f"http://{host}:{port}/api/v0"
        self.gateway = os.getenv("IPFS_GATEWAY", f"http://{host}:8080/ipfs")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def add_json(self, data: Dict[str, Any]) -> str:
        """Add JSON data to IPFS, return CID"""
        json_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        files = {"file": ("data.json", json_bytes, "application/json")}
        
        resp = await self.client.post(f"{self.api_url}/add", files=files)
        resp.raise_for_status()
        result = resp.json()
        return result["Hash"]
    
    async def add_text(self, text: str) -> str:
        """Add text to IPFS, return CID"""
        files = {"file": ("data.txt", text.encode("utf-8"), "text/plain")}
        resp = await self.client.post(f"{self.api_url}/add", files=files)
        resp.raise_for_status()
        return resp.json()["Hash"]
    
    async def cat(self, cid: str) -> str:
        """Retrieve content from IPFS by CID"""
        resp = await self.client.post(f"{self.api_url}/cat?arg={cid}")
        resp.raise_for_status()
        return resp.text
    
    def get_gateway_url(self, cid: str) -> str:
        """Get HTTP gateway URL for a CID"""
        return f"{self.gateway}/{cid}"
    
    async def is_available(self) -> bool:
        try:
            resp = await self.client.post(f"{self.api_url}/id", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False

ipfs = IPFSService(IPFS_API_HOST, IPFS_API_PORT)

# ───────────────────────────────────────────────────────────────────────────────
# AI ANALYSIS ENGINE
# ───────────────────────────────────────────────────────────────────────────────

class AIAnalysisEngine:
    """Core analysis engine with MiniMax primary → Ollama fallback"""
    
    async def _call_llm(self, prompt: str) -> tuple[str, str]:
        """
        Call LLM with fallback chain:
        1. MiniMax (primary, API-based)
        2. Ollama (fallback, self-hosted)
        Returns (response_text, llm_name)
        """
        errors = []
        
        # Try MiniMax first
        if minimax:
            try:
                resp = await minimax.chat(prompt)
                return resp, "minimax"
            except Exception as e:
                errors.append(f"MiniMax: {e}")
        
        # Fallback to Ollama
        if await ollama.is_available():
            try:
                resp = await ollama.chat(prompt)
                return resp, "ollama"
            except Exception as e:
                errors.append(f"Ollama({OLLAMA_MODEL}): {e}")
            # Try fallback model
            try:
                resp = await ollama.chat(prompt, model=OLLAMA_FALLBACK_MODEL)
                return resp, "ollama"
            except Exception as e:
                errors.append(f"Ollama({OLLAMA_FALLBACK_MODEL}): {e}")
        
        raise RuntimeError(f"All LLMs failed: {'; '.join(errors)}")
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Extract JSON from LLM response (handles markdown code blocks)"""
        text = text.strip()
        
        # Remove markdown code blocks
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        text = text.strip()
        
        # Find JSON object
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start:end+1]
        
        return json.loads(text)
    
    def _get_cache_key(self, question_id: str) -> str:
        return f"ploky:analysis:{question_id}"
    
    def _get_cached_analysis(self, question_id: str) -> Optional[Dict]:
        if not redis_client:
            return None
        cached = redis_client.get(self._get_cache_key(question_id))
        if cached:
            return json.loads(cached)
        return None
    
    def _cache_analysis(self, question_id: str, data: Dict):
        if redis_client:
            redis_client.setex(
                self._get_cache_key(question_id),
                CACHE_TTL,
                json.dumps(data, ensure_ascii=False)
            )
    
    async def analyze_question(self, request: AIAnalysisRequest) -> AIAnalysisResponse:
        """Run full AI analysis on a prediction market question"""
        
        # Check cache
        cached = self._get_cached_analysis(request.question_id)
        if cached:
            return AIAnalysisResponse(**cached)
        
        # Build evidence text
        evidence_text = "\n".join([
            f"- [{e.get('type', 'neutral')}] {e.get('text', '')}"
            for e in request.evidence
        ]) or "No evidence provided"
        
        # Build news text
        news_text = "\n".join([
            f"- {url}" for url in request.news_urls
        ]) or "No news sources provided"
        
        tier_names = ["OBJECTIVE", "SEMI-SUBJECTIVE", "FULLY-SUBJECTIVE"]
        
        prompt = ANALYSIS_PROMPT.format(
            title=request.title,
            description=request.description,
            category=request.category,
            tier=tier_names[request.tier],
            evidence_text=evidence_text,
            news_text=news_text
        )
        
        # Call LLM with fallback
        raw_response, llm_used = await self._call_llm(prompt)
        
        try:
            result = self._parse_json_response(raw_response)
        except json.JSONDecodeError as e:
            # If JSON parse fails, create a safe fallback
            result = {
                "confidence": 5000,
                "recommended_outcome": "UNRESOLVED",
                "reasoning": f"JSON parse error: {str(e)}. Raw response: {raw_response[:500]}",
                "sentiment_score": 5000,
                "fact_check_score": 5000,
                "bias_risk_score": 5000,
                "manipulation_risk": 5000,
                "evidence_quality": 5000,
                "key_facts": [],
                "contradictions": []
            }
        
        # Map outcome
        outcome_map = {
            "YES": Outcome.YES,
            "NO": Outcome.NO,
            "UNRESOLVED": Outcome.UNRESOLVED
        }
        outcome = outcome_map.get(result.get("recommended_outcome", "UNRESOLVED"), Outcome.UNRESOLVED)
        
        # Determine auto-resolve eligibility
        confidence = result.get("confidence", 5000)
        auto_resolve = (
            confidence >= AI_AUTO_RESOLVE_THRESHOLD and
            outcome in (Outcome.YES, Outcome.NO) and
            request.tier == QuestionTier.OBJECTIVE.value and
            result.get("manipulation_risk", 10000) < 5000
        )
        
        response = AIAnalysisResponse(
            question_id=request.question_id,
            confidence=confidence,
            recommended_outcome=outcome.name,
            reasoning=result.get("reasoning", "No reasoning provided"),
            sentiment_score=result.get("sentiment_score", 5000),
            fact_check_score=result.get("fact_check_score", 5000),
            bias_risk_score=result.get("bias_risk_score", 5000),
            manipulation_risk=result.get("manipulation_risk", 5000),
            evidence_quality=result.get("evidence_quality", 5000),
            auto_resolve_eligible=auto_resolve,
            analyzed_at=datetime.utcnow().isoformat(),
            llm_used=llm_used
        )
        
        # Cache result
        self._cache_analysis(request.question_id, response.dict())
        
        # Optionally store analysis on IPFS
        if await ipfs.is_available():
            try:
                cid = await ipfs.add_json({
                    "question_id": request.question_id,
                    "analysis": response.dict(),
                    "timestamp": datetime.utcnow().isoformat()
                })
                print(f"[IPFS] Analysis stored: {cid}")
            except Exception as e:
                print(f"[IPFS] Store failed: {e}")
        
        return response
    
    async def analyze_evidence(self, request: EvidenceAnalysisRequest) -> EvidenceAnalysisResponse:
        """Analyze a single piece of evidence"""
        
        type_labels = ["SUPPORTING", "OPPOSING", "NEUTRAL"]
        
        prompt = EVIDENCE_PROMPT.format(
            evidence_text=request.evidence_text,
            evidence_type=type_labels[request.evidence_type],
            source_url=request.source_url,
            question_context=request.question_context
        )
        
        raw_response, llm_used = await self._call_llm(prompt)
        
        try:
            result = self._parse_json_response(raw_response)
        except json.JSONDecodeError:
            result = {
                "credibility_score": 5000,
                "manipulation_risk": 5000,
                "source_reliability": 5000,
                "factuality_score": 5000,
                "key_claims": [],
                "contradictions": []
            }
        
        return EvidenceAnalysisResponse(
            credibility_score=result.get("credibility_score", 5000),
            manipulation_risk=result.get("manipulation_risk", 5000),
            source_reliability=result.get("source_reliability", 5000),
            factuality_score=result.get("factuality_score", 5000),
            key_claims=result.get("key_claims", []),
            contradictions=result.get("contradictions", []),
            llm_used=llm_used
        )
    
    async def assess_dispute_risk(
        self,
        question_id: str,
        title: str,
        description: str,
        evidence_count: int = 0,
        dispute_count: int = 0
    ) -> Dict[str, Any]:
        """Assess risk of future disputes"""
        
        prompt = DISPUTE_RISK_PROMPT.format(
            title=title,
            description=description,
            evidence_count=evidence_count,
            dispute_count=dispute_count
        )
        
        raw_response, llm_used = await self._call_llm(prompt)
        
        try:
            result = self._parse_json_response(raw_response)
        except json.JSONDecodeError:
            result = {
                "dispute_risk_score": 5000,
                "primary_risk_factors": ["Unable to parse LLM response"],
                "mitigation_suggestions": ["Manual review recommended"],
                "recommended_tier": 1
            }
        
        return {
            "question_id": question_id,
            "dispute_risk_score": result.get("dispute_risk_score", 5000),
            "risk_factors": result.get("primary_risk_factors", []),
            "mitigations": result.get("mitigation_suggestions", []),
            "recommended_tier": result.get("recommended_tier", 1),
            "llm_used": llm_used
        }

# Initialize engine
engine = AIAnalysisEngine()

# ───────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ───────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Ploky AI Resolution Service",
    description="Open-source AI oracle for prediction market resolution",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ───────────────────────────────────────────────────────────────────────────────
# HEALTH & STATUS
# ───────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check — reports which services are available"""
    ollama_ok = await ollama.is_available()
    ipfs_ok = await ipfs.is_available()
    
    return {
        "status": "healthy",
        "version": "2.1.0",
        "stack": "open-source",
        "services": {
            "minimax": minimax is not None,
            "ollama": ollama_ok,
            "redis": redis_client is not None and redis_client.ping(),
            "ipfs": ipfs_ok,
            "blockchain": PLKY_RESOLVER_ADDRESS != ""
        },
        "models": {
            "primary": "minimax" if minimax else "unconfigured",
            "fallback": OLLAMA_MODEL,
            "fallback_alt": OLLAMA_FALLBACK_MODEL
        }
    }

@app.get("/status")
async def detailed_status():
    """Detailed service status with model info"""
    ollama_models = []
    if await ollama.is_available():
        try:
            resp = await ollama.client.get(f"{ollama.host}/api/tags")
            if resp.status_code == 200:
                ollama_models = [m["name"] for m in resp.json().get("models", [])]
        except Exception:
            pass
    
    return {
        "minimax_configured": minimax is not None,
        "ollama_host": OLLAMA_HOST,
        "ollama_models_available": ollama_models,
        "ollama_primary": OLLAMA_MODEL,
        "ollama_fallback": OLLAMA_FALLBACK_MODEL,
        "ipfs_gateway": IPFS_GATEWAY,
        "polygon_rpc": POLYGON_RPC,
        "amoy_rpc": AMOY_RPC,
        "cache_ttl_seconds": CACHE_TTL,
        "auto_resolve_threshold": AI_AUTO_RESOLVE_THRESHOLD
    }

# ───────────────────────────────────────────────────────────────────────────────
# ANALYSIS ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_question(request: AIAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Run AI analysis on a prediction market question.
    MiniMax primary → Ollama fallback.
    Results cached for 1 hour.
    """
    result = await engine.analyze_question(request)
    return result

@app.post("/analyze/evidence", response_model=EvidenceAnalysisResponse)
async def analyze_evidence(request: EvidenceAnalysisRequest):
    """Analyze individual evidence piece for credibility and manipulation risk."""
    result = await engine.analyze_evidence(request)
    return result

@app.post("/assess-risk")
async def assess_dispute_risk_endpoint(
    question_id: str,
    title: str,
    description: str,
    evidence_count: int = 0,
    dispute_count: int = 0
):
    """Assess the risk of future disputes for a question."""
    result = await engine.assess_dispute_risk(
        question_id, title, description, evidence_count, dispute_count
    )
    return result

@app.post("/batch-analyze")
async def batch_analyze(requests: List[AIAnalysisRequest]):
    """Batch analyze multiple questions."""
    results = await asyncio.gather(*[
        engine.analyze_question(req) for req in requests
    ])
    return {"results": results}

@app.get("/analysis/{question_id}")
async def get_cached_analysis(question_id: str):
    """Get cached analysis for a question."""
    cached = engine._get_cached_analysis(question_id)
    if not cached:
        raise HTTPException(404, "Analysis not found")
    return cached

@app.delete("/cache/{question_id}")
async def clear_cache(question_id: str):
    """Clear cached analysis for a question."""
    redis_client.delete(engine._get_cache_key(question_id))
    return {"message": "Cache cleared"}

# ───────────────────────────────────────────────────────────────────────────────
# IPFS ENDPOINTS
# ───────────────────────────────────────────────────────────────────────────────

@app.post("/ipfs/add")
async def ipfs_add(data: Dict[str, Any]):
    """Add JSON data to local IPFS node"""
    if not await ipfs.is_available():
        raise HTTPException(503, "IPFS not available")
    cid = await ipfs.add_json(data)
    return {"cid": cid, "gateway_url": ipfs.get_gateway_url(cid)}

@app.get("/ipfs/{cid}")
async def ipfs_get(cid: str):
    """Retrieve content from IPFS by CID"""
    if not await ipfs.is_available():
        raise HTTPException(503, "IPFS not available")
    content = await ipfs.cat(cid)
    return {"cid": cid, "content": content}

# ───────────────────────────────────────────────────────────────────────────────
# BLOCKCHAIN INTEGRATION
# ───────────────────────────────────────────────────────────────────────────────

class BlockchainService:
    """Blockchain interactions via public RPC"""
    
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))
        self.amoy_w3 = Web3(Web3.HTTPProvider(AMOY_RPC))
        self.resolver_abi = []  # Load from compiled contract
        self.resolver_contract = None
        if PLKY_RESOLVER_ADDRESS:
            self.resolver_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(PLKY_RESOLVER_ADDRESS),
                abi=self.resolver_abi
            )
    
    async def submit_ai_analysis_to_chain(
        self, 
        question_id: str,
        confidence: int,
        outcome: Outcome,
        analysis_cid: str,
        sentiment: int,
        fact_check: int,
        bias: int
    ) -> str:
        """Submit AI analysis result to blockchain"""
        
        if not self.resolver_contract or not PRIVATE_KEY:
            raise HTTPException(500, "Blockchain not configured")
        
        account = self.w3.eth.account.from_key(PRIVATE_KEY)
        
        tx = self.resolver_contract.functions.submitAIAnalysis(
            question_id.encode(),
            confidence,
            1 if outcome == Outcome.YES else (2 if outcome == Outcome.NO else 0),
            analysis_cid,
            sentiment,
            fact_check,
            bias
        ).build_transaction({
            'from': account.address,
            'nonce': self.w3.eth.get_transaction_count(account.address),
            'gas': 300000,
            'gasPrice': self.w3.eth.gas_price
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        return tx_hash.hex()

blockchain = BlockchainService()

@app.post("/submit-to-chain")
async def submit_analysis_to_chain(
    question_id: str,
    confidence: int,
    outcome: Outcome,
    analysis_cid: str,
    sentiment: int = 5000,
    fact_check: int = 5000,
    bias: int = 5000
):
    """
    Submit AI analysis result to the blockchain contract.
    Requires AI_ORACLE_ROLE on the contract.
    """
    tx_hash = await blockchain.submit_ai_analysis_to_chain(
        question_id, confidence, outcome, analysis_cid, sentiment, fact_check, bias
    )
    return {"tx_hash": tx_hash, "status": "submitted"}

# ───────────────────────────────────────────────────────────────────────────────
# ADMIN / UTILITY
# ───────────────────────────────────────────────────────────────────────────────

@app.post("/admin/pull-ollama-model")
async def pull_ollama_model(model: str):
    """Pull a new Ollama model (admin only)"""
    success = await ollama.pull_model(model)
    return {"success": success, "model": model}

@app.get("/admin/cache-stats")
async def cache_stats():
    """Redis cache statistics"""
    if not redis_client:
        return {"error": "Redis not available"}
    
    keys = redis_client.keys("ploky:analysis:*")
    return {
        "cached_analyses": len(keys),
        "keys": keys[:20]  # Show first 20
    }

# ───────────────────────────────────────────────────────────────────────────────
# MAIN
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
