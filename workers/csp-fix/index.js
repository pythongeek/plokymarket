/**
 * Cloudflare Worker: CSP Fix for polymarketbd.com
 *
 * Intercepts all responses and fixes the Content-Security-Policy header:
 * - Adds wss://sltcfmqefujecqfbmkvz.supabase.co to connect-src
 * - Adds https://sltcfmqefujecqfbmkvz.supabase.co to connect-src
 * - Fixes bare wss:// directive that blocks Supabase Realtime
 */

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);
  return modifyResponse(response);
}

async function modifyResponse(response) {
  const newHeaders = new Headers(response.headers);
  const contentType = newHeaders.get("content-type") || "";

  // Only process HTML/json responses
  if (!contentType.includes("text/html") && !contentType.includes("application/json")) {
    return response;
  }

  const csp = newHeaders.get("content-security-policy") || "";
  if (!csp) {
    return response;
  }

  let fixedCSP = csp;

  // Fix 1: Bare wss:// has no host — add Supabase WebSocket host
  if (fixedCSP.includes("wss://") && !fixedCSP.match(/wss:\/\/[a-zA-Z0-9-.]+\//)) {
    fixedCSP = fixedCSP.replace(/wss:\/\//g, "wss://sltcfmqefujecqfbmkvz.supabase.co ");
  }

  // Fix 2: Ensure Supabase HTTPS is in connect-src
  if (!fixedCSP.includes("https://sltcfmqefujecqfbmkvz.supabase.co")) {
    fixedCSP = fixedCSP.replace(
      /(connect-src[^;]*)/,
      "$1 https://sltcfmqefujecqfbmkvz.supabase.co"
    );
  }

  // Fix 3: Add Sentry endpoint (optional — only if not already present)
  if (!fixedCSP.includes("o4510975612420096.ingest.us.sentry.io")) {
    fixedCSP = fixedCSP.replace(
      /(connect-src[^;]*)/,
      "$1 https://o4510975612420096.ingest.us.sentry.io"
    );
  }

  newHeaders.set("content-security-policy", fixedCSP);

  const body = contentType.includes("text/html")
    ? await replaceBodyCSP(await response.text(), fixedCSP)
    : await response.text();

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

async function replaceBodyCSP(html, csp) {
  // If the HTML body contains a CSP meta tag, update it too
  if (html.includes("content-security-policy")) {
    return html.replace(
      /<meta http-equiv="Content-Security-Policy"[^>]*>/i,
      `<meta http-equiv="Content-Security-Policy" content="${csp}">`
    );
  }
  return html;
}
