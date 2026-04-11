/**
 * Phaxe Service Worker
 * Intercepts fetch requests for proxied content, rewrites URLs in HTML responses,
 * and forwards requests through the backend proxy server.
 */

const PROXY_BASE = self.location.origin;

/**
 * URL-safe base64 encoding (matches client lib/url.ts).
 */
function encodeUrl(url) {
  return btoa(encodeURIComponent(url)).replace(/\//g, '_').replace(/\+/g, '-');
}

function decodeUrl(encoded) {
  try {
    return decodeURIComponent(atob(encoded.replace(/_/g, '/').replace(/-/g, '+')));
  } catch {
    return '';
  }
}

/**
 * Rewrite HTML content to proxy all resource URLs.
 */
function rewriteHtml(html) {
  const urlPattern = /(src|href|action|data|poster|srcset|formaction)=["']?(https?:\/\/[^"'\s\)]+)["']?/gi;

  html = html.replace(urlPattern, (match, attr, url) => {
    if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) {
      return match;
    }
    const encoded = encodeUrl(url);
    return `${attr}="/proxy/${encoded}"`;
  });

  // Rewrite CSS url() without quotes
  html = html.replace(/url\((https?:\/\/[^)]+)\)/gi, (match, url) => {
    const encoded = encodeUrl(url);
    return `url(/proxy/${encoded})`;
  });

  // Inject base tag for relative URLs
  if (!html.includes('<base ')) {
    html = html.replace('<head>', '<head><base href="/">');
  }

  // Override Content Security Policy
  if (html.includes('<head>')) {
    html = html.replace(
      '<head>',
      '<head><meta http-equiv="Content-Security-Policy" content="default-src \'self\' \'unsafe-inline\' \'unsafe-eval\' data: blob:;">'
    );
  }

  return html;
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept requests to /proxy/ paths
  if (!url.pathname.startsWith('/proxy/')) {
    return;
  }

  event.respondWith(handleProxyRequest(event.request, url));
});

async function handleProxyRequest(request, url) {
  const startTime = Date.now();
  const encodedPath = url.pathname.replace('/proxy/', '');
  const targetUrl = decodeUrl(encodedPath);

  if (!targetUrl) {
    return new Response('Invalid proxy URL', { status: 400 });
  }

  try {
    // Build headers to forward
    const headers = new Headers({
      'User-Agent': getRandomUserAgent(),
      'Accept': request.headers.get('Accept') || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Upgrade-Insecure-Requests': '1',
    });

    // Forward cookies if present
    const cookie = request.headers.get('Cookie');
    if (cookie) {
      headers.set('Cookie', cookie);
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      redirect: 'manual',
    });

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const encoded = encodeUrl(location);
        return Response.redirect(`/proxy/${encoded}`, response.status);
      }
    }

    const contentType = response.headers.get('content-type') || '';
    const responseHeaders = new Headers();

    // Filter response headers
    for (const [key, value] of response.headers.entries()) {
      if (
        !['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie', 'x-frame-options', 'content-security-policy', 'x-content-type-options', 'strict-transport-security'].includes(key)
      ) {
        responseHeaders.set(key, value);
      }
    }

    responseHeaders.set('X-Response-Time', `${Date.now() - startTime}ms`);
    responseHeaders.set('X-Proxy', 'phaxe');

    // Override CSP for proxied content
    if (contentType.includes('text/html')) {
      responseHeaders.set('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;");
    }

    // Handle HTML: fetch text, rewrite, return
    if (contentType.includes('text/html')) {
      const text = await response.text();
      const rewritten = rewriteHtml(text);
      responseHeaders.set('Content-Type', contentType);
      return new Response(rewritten, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Other content types: pass through
    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Proxy Error', message: error.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
