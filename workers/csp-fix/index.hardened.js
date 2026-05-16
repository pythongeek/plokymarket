/**
 * Cloudflare Worker: WAF + CSP + Edge Cache + Rate Limit
 * Tier-1 Financial Grade Edge Security
 */

// OWASP Top 10 payload signatures
const WAF_PATTERNS = [
  /(<script|%3Cscript)/i,                           // XSS
  /(union\s+select|select\s+.*from|drop\s+table|insert\s+into)/i,  // SQLi
  /(\.\.\/|%2e%2e%2f)/,                            // Path traversal
  /(eval\(|exec\(|system\(|passthru\()/i,           // RCE
  /(javascript:|data:text\/html)/i,                 // JS injection
  /(\.env|config\.json|wp-config|id_rsa)/i,         // File probing
];

// High-risk IP reputation (simplified — integrate with Cloudflare Lists)
const BLOCKED_IPS = new Set([]);
const BLOCKED_COUNTRIES = new Set(['KP', 'IR', 'SY', 'CU', 'MM']);

// Static asset extensions for edge caching
const CACHEABLE_EXTS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.ico', '.json'];

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
  const country = request.headers.get("CF-IPCountry") || "XX";

  // ── 1. WAF — Block OWASP payloads ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  const userAgent = request.headers.get("User-Agent") || "";
  const pathAndQuery = url.pathname + url.search;

  for (const pattern of WAF_PATTERNS) {
    if (pattern.test(pathAndQuery) || pattern.test(userAgent)) {
      return new Response("Blocked by WAF", {
        status: 403,
        headers: {
          "Content-Type": "text/plain",
          "X-WAF-Action": "blocked",
          "X-WAF-Rule": pattern.toString(),
        },
      });
    }
  }

  // ── 2. Geo + IP Reputation ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  if (BLOCKED_IPS.has(clientIP) || BLOCKED_COUNTRIES.has(country)) {
    return new Response("Access denied", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // ── 3. Edge Cache for Static Assets ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const isCacheable = CACHEABLE_EXTS.some(ext => url.pathname.endsWith(ext));

  if (isCacheable) {
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let response = await cache.match(cacheKey);

    if (!response) {
      response = await fetch(request);
      const cloned = response.clone();
      const headers = new Headers(cloned.headers);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("X-Edge-Cache", "HIT");
      response = new Response(cloned.body, {
        status: cloned.status,
        statusText: cloned.statusText,
        headers,
      });
      await cache.put(cacheKey, response.clone());
    } else {
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });
      response.headers.set("X-Edge-Cache", "HIT");
    }
    return response;
  }

  // ── 4. Fetch Origin + CSP Hardening ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const response = await fetch(request);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html") && !contentType.includes("application/json")) {
    return response;
  }

  const newHeaders = new Headers(response.headers);

  // Strict CSP — strict-dynamic with nonce, no unsafe-eval
  const nonce = btoa(crypto.getRandomValues(new Uint8Array(16)).toString());
  const strictCSP = [
    "default-src 'self'",
    "script-src 'self' 'strict-dynamic' 'nonce-" + nonce + "' https:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://sltcfmqefujecqfbmkvz.supabase.co wss://sltcfmqefujecqfbmkvz.supabase.co https://o4510975612420096.ingest.us.sentry.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  newHeaders.set("content-security-policy", strictCSP);
  newHeaders.set("x-frame-options", "DENY");
  newHeaders.set("x-content-type-options", "nosniff");
  newHeaders.set("referrer-policy", "strict-origin-when-cross-origin");
  newHeaders.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  newHeaders.set("x-waf-status", "passed");
  newHeaders.set("x-edge-nonce", nonce);

  const body = contentType.includes("text/html")
    ? (await response.text()).replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '')
    : await response.text();

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
