const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const { LRUCache } = require('lru-cache');
const { fetch } = require('undici');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(compression({
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// LRU Cache
const cache = new LRUCache({
  max: 100,
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 100 * 1024 * 1024, // 100MB
  sizeCalculation: (value) => {
    return JSON.stringify(value).length;
  }
});

// Metrics
const metrics = {
  total: 0,
  completed: 0,
  errors: 0,
  avgTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalTime: 0,
  bytesTransferred: 0,
  activeSessions: 0,
};

// Track active WebSocket connections as proxy for active sessions
let activeWsConnections = 0;

// User agent rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
];

// URL encoding/decoding (supports both standard base64url and URL-safe with _/-)
function encodeUrl(url) {
  return btoa(encodeURIComponent(url)).replace(/\//g, '_').replace(/\+/g, '-');
}

function decodeUrl(encoded) {
  // Try URL-safe format first (_ and -)
  try {
    return decodeURIComponent(atob(encoded.replace(/_/g, '/').replace(/-/g, '+')));
  } catch {
    // Fall back to standard base64url
    try {
      return Buffer.from(encoded, 'base64url').toString('utf-8');
    } catch {
      return '';
    }
  }
}

// Content rewriting
function rewriteHtml(html, proxyBase) {
  // Rewrite absolute URLs to proxied URLs
  const urlPattern = /(src|href|action|data|poster|srcset|url\()=["']?(https?:\/\/[^"'\s\)]+)["']?/gi;
  
  html = html.replace(urlPattern, (match, attr, url) => {
    // Skip data URLs and relative URLs
    if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) {
      return match;
    }
    const encoded = encodeUrl(url);
    const proxiedUrl = `${proxyBase}/proxy/${encoded}`;
    return `${attr}="${proxiedUrl}"`;
  });

  // Rewrite CSS url() without quotes
  html = html.replace(/url\((https?:\/\/[^)]+)\)/gi, (match, url) => {
    const encoded = encodeUrl(url);
    return `url(${proxyBase}/proxy/${encoded})`;
  });

  // Inject base tag for relative URLs
  if (!html.includes('<base ')) {
    html = html.replace('<head>', '<head><base href="/">');
  }

  return html;
}

// Proxy route
app.get('/proxy/:encodedUrl', async (req, res) => {
  const startTime = Date.now();
  metrics.total++;

  try {
    const encodedUrl = req.params.encodedUrl;
    const targetUrl = decodeUrl(encodedUrl);

    // Check cache
    const cached = cache.get(targetUrl);
    if (cached) {
      metrics.cacheHits++;
      metrics.completed++;
      const duration = Date.now() - startTime;
      metrics.totalTime += duration;
      metrics.avgTime = Math.round(metrics.totalTime / metrics.completed);
      
      res.set(cached.headers);
      res.set('X-Cache', 'HIT');
      res.set('X-Response-Time', `${duration}ms`);
      const bodySize = JSON.stringify(cached.body).length;
      metrics.bytesTransferred += bodySize;
      return res.send(cached.body);
    }

    metrics.cacheMisses++;

    // Fetch target
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'manual',
    });

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const encoded = encodeUrl(location);
        return res.redirect(`/proxy/${encoded}`);
      }
    }

    const contentType = response.headers.get('content-type') || '';
    const headers = {};
    
    // Filter and set headers
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie'].includes(key)) {
        headers[key] = value;
      }
    }

    // Handle different content types
    if (contentType.includes('text/html')) {
      const text = await response.text();
      const rewritten = rewriteHtml(text, '');

      cache.set(targetUrl, {
        headers,
        body: rewritten,
      });

      metrics.bytesTransferred += Buffer.byteLength(rewritten);
      res.set(headers);
      res.set('X-Cache', 'MISS');
      res.set('X-Response-Time', `${Date.now() - startTime}ms`);
      res.set('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;");
      return res.send(rewritten);
    }

    // For non-HTML, pipe directly
    const buffer = Buffer.from(await response.arrayBuffer());

    cache.set(targetUrl, {
      headers,
      body: buffer,
    });

    metrics.bytesTransferred += buffer.length;
    res.set(headers);
    res.set('X-Cache', 'MISS');
    res.set('X-Response-Time', `${Date.now() - startTime}ms`);
    return res.send(buffer);

  } catch (error) {
    metrics.errors++;
    console.error('Proxy error:', error.message);
    res.status(502).json({
      error: 'Proxy Error',
      message: error.message,
    });
  } finally {
    const duration = Date.now() - startTime;
    if (metrics.completed + metrics.errors < metrics.total) {
      metrics.completed++;
      metrics.totalTime += duration;
      metrics.avgTime = Math.round(metrics.totalTime / metrics.completed);
    }
  }
});

// API routes
app.get('/api/metrics', (req, res) => {
  res.json({
    ...metrics,
    activeSessions: activeWsConnections,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

app.get('/api/cache', (req, res) => {
  res.json({
    size: cache.size,
    maxSize: cache.max,
  });
});

app.delete('/api/cache', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared' });
});

// AI proxy route
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, provider, model, apiKey, baseUrl } = req.body;

    // Default to OpenAI-compatible format
    const apiUrl = baseUrl || 'https://api.openai.com/v1/chat/completions';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});

module.exports = app;
