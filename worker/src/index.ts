/**
 * Phaxe Cloudflare Worker Proxy + AI API
 * Handles proxy requests, AI streaming, and CORS for the Pages frontend.
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
];

const CLOAK = {
  title: 'Google Docs',
  favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="%234285F4" d="M12 4h16l12 12v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path fill="%23FFF" d="M28 4l12 12h-10a2 2 0 0 1-2-2V4z"/><path fill="%23FFF" d="M16 22h16v2H16zm0 6h16v2H16zm0 6h10v2H16z"/></svg>',
};

const METRICS = {
  total: 0,
  completed: 0,
  errors: 0,
  avgTime: 0,
  totalTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  bytesTransferred: 0,
  activeSessions: 0,
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

function rewriteHtml(html: string): string {
  html = html.replace(
    /(src|href|action|data|poster|srcset)=["']?(https?:\/\/[^"'\s>]+)["']?/gi,
    (match, attr, url) => {
      if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) return match;
      const encoded = encodeUrl(url);
      return `${attr}="/p/${encoded}"`;
    }
  );

  html = html.replace(/url\((https?:\/\/[^)]+)\)/gi, (match, url) => {
    const encoded = encodeUrl(url);
    return `url(/p/${encoded})`;
  });

  html = html.replace('<head>', `<head><title>${CLOAK.title}</title><link rel="icon" href="${CLOAK.favicon}">`);
  html = html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">`);

  return html;
}

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * CORS preflight and headers helper.
 */
function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-AI-API-Key, X-AI-Base-Url, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function getTextFromContent(content: any): string {
  if (!content) return '';

  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== 'object') return '';
        if (part.type === 'text') return part.text || part.content || '';
        if (typeof part.text === 'string') return part.text;
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  if (typeof content === 'object') {
    if (typeof content.text === 'string') return content.text;
    if (Array.isArray(content.parts)) {
      return content.parts
        .map((part: any) => part?.text || '')
        .filter(Boolean)
        .join('\n')
        .trim();
    }
  }

  return '';
}

function toDataUrl(mimeType: string, base64Data: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

function getMimeFromDataUrl(value: string): string {
  const match = value.match(/^data:(.*?);base64,/);
  return match?.[1] || 'image/jpeg';
}

function getBase64FromDataUrl(value: string): string {
  if (!value) return '';
  if (value.startsWith('data:')) {
    return value.split(',')[1] || '';
  }
  return value;
}

function getImageUrlsFromContent(content: any): string[] {
  const urls: string[] = [];

  if (!content) return urls;

  if (Array.isArray(content)) {
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;

      if (part.type === 'image_url' && part.image_url?.url) {
        urls.push(part.image_url.url);
      }

      if (part.type === 'image' && part.source?.type === 'base64' && part.source?.data) {
        const mimeType = part.source.media_type || 'image/jpeg';
        urls.push(toDataUrl(mimeType, part.source.data));
      }

      if (part.inline_data?.data) {
        const mimeType = part.inline_data.mime_type || 'image/jpeg';
        urls.push(toDataUrl(mimeType, part.inline_data.data));
      }
    }
  }

  if (typeof content === 'object' && Array.isArray(content.parts)) {
    for (const part of content.parts) {
      if (part?.inline_data?.data) {
        const mimeType = part.inline_data.mime_type || 'image/jpeg';
        urls.push(toDataUrl(mimeType, part.inline_data.data));
      }
    }
  }

  return urls;
}

function getAttachmentText(message: any): string {
  if (!Array.isArray(message?.fileAttachments)) return '';

  const chunks: string[] = [];
  for (const file of message.fileAttachments) {
    if (!file || typeof file !== 'object') continue;
    if (typeof file.type === 'string' && file.type.startsWith('image/')) continue;

    const raw = typeof file.content === 'string' ? file.content : '';
    if (!raw.trim()) continue;

    const clipped = raw.length > 12000 ? `${raw.slice(0, 12000)}\n...[truncated]` : raw;
    chunks.push(`Attached file: ${file.name || 'file'}\n${clipped}`);
  }

  return chunks.join('\n\n');
}

function normalizeMessage(message: any): { text: string; imageUrls: string[] } {
  const imageSet = new Set<string>();

  const textParts: string[] = [];
  const directText = getTextFromContent(message?.content);
  if (directText) textParts.push(directText);

  const attachmentText = getAttachmentText(message);
  if (attachmentText) textParts.push(attachmentText);

  if (message?.screenshot && typeof message.screenshot === 'string') {
    imageSet.add(message.screenshot);
  }

  if (Array.isArray(message?.imageAttachments)) {
    for (const image of message.imageAttachments) {
      if (typeof image === 'string') imageSet.add(image);
    }
  }

  if (Array.isArray(message?.fileAttachments)) {
    for (const file of message.fileAttachments) {
      if (
        file &&
        typeof file === 'object' &&
        typeof file.type === 'string' &&
        file.type.startsWith('image/') &&
        typeof file.content === 'string'
      ) {
        imageSet.add(file.content);
      }
    }
  }

  for (const image of getImageUrlsFromContent(message?.content)) {
    imageSet.add(image);
  }

  return {
    text: textParts.filter(Boolean).join('\n\n').trim(),
    imageUrls: Array.from(imageSet),
  };
}

async function handleProxy(request: Request, encodedUrl: string): Promise<Response> {
  const startedAt = Date.now();
  METRICS.total += 1;

  const markSuccess = (bytes: number) => {
    METRICS.completed += 1;
    METRICS.totalTime += Date.now() - startedAt;
    METRICS.avgTime = Math.round(METRICS.totalTime / Math.max(1, METRICS.completed));
    METRICS.bytesTransferred += Math.max(0, bytes);
  };

  const targetUrl = decodeUrl(encodedUrl);
  if (!targetUrl) {
    METRICS.errors += 1;
    return new Response('Invalid URL', { status: 400 });
  }

  try {
    const url = new URL(targetUrl);

    const headers = new Headers();
    headers.set('User-Agent', getRandomUserAgent());
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
    headers.set('Accept-Language', 'en-US,en;q=0.5');
    headers.set('Accept-Encoding', 'gzip, br');

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

    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie', 'x-frame-options', 'content-security-policy'].includes(key)) {
        responseHeaders.set(key, value);
      }
    }

    // Handle HTML
    if (contentType.includes('text/html')) {
      const text = await response.text();
      const rewritten = rewriteHtml(text);
      markSuccess(new TextEncoder().encode(rewritten).length);
      responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
      return new Response(rewritten, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Pass through for images, CSS, JS, fonts, etc.
    const contentLength = Number(response.headers.get('content-length') || 0);
    markSuccess(Number.isFinite(contentLength) ? contentLength : 0);
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    METRICS.errors += 1;
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleAIChat(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin') || '*') });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request.headers.get('Origin') || '*') },
    });
  }

  const { messages, provider: providerFormat, model, apiKey, baseUrl, temperature, maxTokens } = body;

  if (!apiKey && providerFormat !== 'puter') {
    return new Response(JSON.stringify({ error: 'API key required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request.headers.get('Origin') || '*') },
    });
  }

  // Determine the actual endpoint based on provider format
  let apiUrl: string;
  let headers: Record<string, string>;
  let requestBody: any;

  // Strip trailing /v1 from baseUrl to avoid double-prefix
  const cleanBase = baseUrl
    ? baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')
    : '';

  if (providerFormat === 'anthropic') {
    apiUrl = `${cleanBase || 'https://api.anthropic.com'}/v1/messages`;
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
    const systemMessage = messages.find((m: any) => m.role === 'system');
    const nonSystemMessages = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => {
        const normalized = normalizeMessage(m);
        const content: any[] = [];

        if (normalized.text) {
          content.push({ type: 'text', text: normalized.text });
        }

        for (const image of normalized.imageUrls) {
          const base64Data = getBase64FromDataUrl(image);
          const mimeType = getMimeFromDataUrl(image);
          if (!base64Data) continue;

          content.push({
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64Data },
          });
        }

        return {
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: content.length ? content : [{ type: 'text', text: ' ' }],
        };
      });

    const normalizedSystem = systemMessage ? normalizeMessage(systemMessage).text : '';

    requestBody = {
      model: model || 'claude-sonnet-4-20250514',
      messages: nonSystemMessages,
      max_tokens: maxTokens || 4000,
      stream: true,
      ...(normalizedSystem ? { system: normalizedSystem } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    };
  } else if (providerFormat === 'gemini') {
    const geminiModel = model || 'gemini-2.0-flash';
    apiUrl = `${cleanBase || 'https://generativelanguage.googleapis.com'}/v1beta/models/${geminiModel}:streamGenerateContent?key=${apiKey}&alt=sse`;
    headers = { 'Content-Type': 'application/json' };

    const contents = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => {
        const normalized = normalizeMessage(m);
        const parts: any[] = [];

        if (normalized.text) {
          parts.push({ text: normalized.text });
        }

        for (const image of normalized.imageUrls) {
          const base64Data = getBase64FromDataUrl(image);
          const mimeType = getMimeFromDataUrl(image);
          if (!base64Data) continue;
          parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
        }

        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });
    const systemInstructionMessage = messages.find((m: any) => m.role === 'system');
    const systemInstruction = systemInstructionMessage ? normalizeMessage(systemInstructionMessage).text : '';

    requestBody = {
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      generationConfig: {
        ...(temperature !== undefined ? { temperature } : {}),
        maxOutputTokens: maxTokens || 4000,
      },
    };
  } else {
    apiUrl = `${cleanBase || 'https://api.openai.com'}/v1/chat/completions`;
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    const formattedMessages = messages.map((m: any) => {
      const normalized = normalizeMessage(m);

      if (m.role === 'system') {
        return { role: 'system', content: normalized.text };
      }

      if (normalized.imageUrls.length > 0) {
        const content: any[] = [{ type: 'text', text: normalized.text || ' ' }];
        for (const image of normalized.imageUrls) {
          content.push({ type: 'image_url', image_url: { url: image } });
        }
        return { role: m.role, content };
      }

      return { role: m.role, content: normalized.text };
    });
    requestBody = {
      model: model || 'gpt-4o',
      messages: formattedMessages,
      stream: true,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: `Provider error: ${response.status} ${errorText.slice(0, 200)}` }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(request.headers.get('Origin') || '*') },
        }
      );
    }

    // Stream the response back
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body!.getReader();
    const encoder = new TextEncoder();

    // Determine response format based on provider
    const isGemini = providerFormat === 'gemini';
    const isAnthropic = providerFormat === 'anthropic';

    (async () => {
      try {
        if (isGemini) {
          // Gemini SSE format: data: {"candidates": [{"content": {"parts": [{"text": "..."}}]}]}
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        } else if (isAnthropic) {
          // Anthropic SSE format: event: content_block_delta, data: {"delta": {"text": "..."}}
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.delta?.text;
                  if (text) {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                  }
                } catch { /* skip */ }
              }
            }
          }
        } else {
          // OpenAI SSE format: data: {"choices": [{"delta": {"content": "..."}}]}
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        }
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (err: any) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders(request.headers.get('Origin') || '*'),
      },
    });

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request.headers.get('Origin') || '*') },
      }
    );
  }
}

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
    const origin = request.headers.get('Origin') || '*';
    const cors = corsHeaders(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Landing page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(getLandingPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...cors },
      });
    }

    // Proxy route: /p/{encoded_url}
    if (url.pathname.startsWith('/p/')) {
      const encodedUrl = url.pathname.slice(3);
      const response = await handleProxy(request, encodedUrl);
      // Add CORS headers to proxy responses too (needed for iframe access)
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', origin);
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    // AI API route: /api/ai/chat
    if (url.pathname === '/api/ai/chat' || url.pathname === '/api/ai') {
      return handleAIChat(request);
    }

    // Metrics route: /api/metrics
    if (url.pathname === '/api/metrics') {
      return new Response(JSON.stringify(METRICS), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // Cache route compatibility for settings actions
    if (url.pathname === '/api/cache' && request.method === 'GET') {
      return new Response(JSON.stringify({ size: 0, maxSize: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    if (url.pathname === '/api/cache' && request.method === 'DELETE') {
      return new Response(JSON.stringify({ message: 'No edge cache to clear' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // 404
    return new Response('Not Found', { status: 404, headers: cors });
  },
};
