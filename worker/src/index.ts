/**
 * Phaxe Cloudflare Worker Proxy
 * Free, fast, edge-distributed proxy with evasion techniques
 * Deploy: npx wrangler deploy
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
];

// Blocklist (configurable via KV)
const DEFAULT_BLOCKLIST = ['malware.com', 'phishing.com'];

// Cloaking config
const CLOAK = {
  title: 'Google Docs',
  favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon-2023q4-r4.ico',
};

function decodeUrl(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded.replace(/_/g, '/').replace(/-/g, '+')));
  } catch {
    return '';
  }
}

function encodeUrl(url: string): string {
  return btoa(encodeURIComponent(url)).replace(/\//g, '_').replace(/\+/g, '-');
}

function rewriteHtml(html: string, baseUrl: string): string {
  // Rewrite URLs
  html = html.replace(
    /(src|href|action|data|poster|srcset)=["']?(https?:\/\/[^"'\s>]+)["']?/gi,
    (match, attr, url) => {
      if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) return match;
      const encoded = encodeUrl(url);
      return `${attr}="/p/${encoded}"`;
    }
  );

  // Rewrite CSS url()
  html = html.replace(/url\((https?:\/\/[^)]+)\)/gi, (match, url) => {
    const encoded = encodeUrl(url);
    return `url(/p/${encoded})`;
  });

  // Cloaking: inject fake title and favicon
  html = html.replace('<head>', `<head><title>${CLOAK.title}</title><link rel="icon" href="${CLOAK.favicon}">`);

  // Inject CSP override
  html = html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">`);

  return html;
}

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function handleProxy(request: Request, encodedUrl: string): Promise<Response> {
  const targetUrl = decodeUrl(encodedUrl);
  if (!targetUrl) {
    return new Response('Invalid URL', { status: 400 });
  }

  try {
    const url = new URL(targetUrl);

    // Check blocklist
    const blocklist = DEFAULT_BLOCKLIST;
    if (blocklist.some(domain => url.hostname.includes(domain))) {
      return new Response('Blocked', { status: 403 });
    }

    const headers = new Headers();
    headers.set('User-Agent', getRandomUserAgent());
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
    headers.set('Accept-Language', 'en-US,en;q=0.5');
    headers.set('Accept-Encoding', 'gzip, br');
    headers.set('Connection', 'keep-alive');

    // Forward cookies from original request
    const cookie = request.headers.get('Cookie');
    if (cookie) headers.set('Cookie', cookie);

    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      redirect: 'manual',
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    });

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const newUrl = new URL(location, targetUrl).toString();
        const encoded = encodeUrl(newUrl);
        return Response.redirect(`/p/${encoded}`, 302);
      }
    }

    const contentType = response.headers.get('content-type') || '';
    const responseHeaders = new Headers();

    // Filter response headers
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie', 'x-frame-options', 'content-security-policy'].includes(key)) {
        responseHeaders.set(key, value);
      }
    }

    // Handle HTML
    if (contentType.includes('text/html')) {
      const text = await response.text();
      const rewritten = rewriteHtml(text, targetUrl);
      responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
      responseHeaders.set('X-Cache', 'MISS');
      return new Response(rewritten, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Handle images, CSS, JS, fonts - pass through
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Landing page (cloaked)
function getLandingPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${CLOAK.title}</title>
  <link rel="icon" href="${CLOAK.favicon}">
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; color: #202124; margin-bottom: 1rem; }
    p { color: #5f6368; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${CLOAK.title}</h1>
    <p>Ready to browse</p>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Landing page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(getLandingPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Proxy route: /p/{encoded_url}
    if (url.pathname.startsWith('/p/')) {
      const encodedUrl = url.pathname.slice(3);
      return handleProxy(request, encodedUrl);
    }

    // AI API route: /api/ai
    if (url.pathname.startsWith('/api/ai')) {
      // Forward to AI provider
      const apiKey = request.headers.get('X-AI-API-Key');
      const baseUrl = request.headers.get('X-AI-Base-Url') || 'https://api.openai.com';

      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const targetUrl = new URL(url.pathname.replace('/api/ai', ''), baseUrl);
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: request.body,
      });

      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 404
    return new Response('Not Found', { status: 404 });
  },
};
