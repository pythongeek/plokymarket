/**
 * Resolution System Health Check v2.1
 * Reports status of all open-source services
 */

import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8081";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const IPFS_API = process.env.IPFS_API || "http://127.0.0.1:5001";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTimeMs: number;
  details?: Record<string, any>;
}

async function checkService(
  name: string,
  url: string,
  timeoutMs: number = 5000
): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });
    
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        name,
        status: "healthy",
        responseTimeMs,
        details: data
      };
    }
    
    return {
      name,
      status: "degraded",
      responseTimeMs,
      details: { statusCode: response.status }
    };
  } catch (error: any) {
    return {
      name,
      status: "down",
      responseTimeMs: Date.now() - start,
      details: { error: error.message }
    };
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  // Check all services in parallel
  const [aiService, ollama, ipfs] = await Promise.all([
    checkService("ploky-ai", `${AI_SERVICE_URL}/health`, 10000),
    checkService("ollama", `${OLLAMA_HOST}/api/tags`, 5000),
    checkService("ipfs", `${IPFS_API}/api/v0/id`, 5000)
  ]);
  
  const services = [aiService, ollama, ipfs];
  const allHealthy = services.every(s => s.status === "healthy");
  const anyDown = services.some(s => s.status === "down");
  
  const overallStatus = anyDown ? "degraded" : allHealthy ? "healthy" : "degraded";
  
  return NextResponse.json({
    status: overallStatus,
    version: "2.1.0",
    stack: "open-source",
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startTime,
    services: {
      ai: aiService,
      ollama: ollama,
      ipfs: ipfs
    },
    config: {
      aiServiceUrl: AI_SERVICE_URL,
      ollamaHost: OLLAMA_HOST,
      ipfsApi: IPFS_API,
      autoResolveThreshold: 8500
    }
  });
}
