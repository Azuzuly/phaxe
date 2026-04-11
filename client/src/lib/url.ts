/**
 * URL-safe base64 encoding for proxy routes.
 * Matches the worker's encodeUrl/decodeUrl implementation.
 */

export function encodeProxyUrl(url: string): string {
  return btoa(encodeURIComponent(url)).replace(/\//g, '_').replace(/\+/g, '-');
}

export function decodeProxyUrl(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded.replace(/_/g, '/').replace(/-/g, '+')));
  } catch {
    return '';
  }
}

/**
 * Detect if a string looks like a URL vs a search query.
 */
export function isUrlLike(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  // Already has protocol
  if (/^https?:\/\//i.test(trimmed)) return true;
  // Looks like a domain (contains a dot with at least 2 chars on each side)
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+\.[a-z]{2,}/i.test(trimmed)) return true;
  // localhost or IP
  if (/^(localhost|\d+\.\d+\.\d+\.\d+)(:\d+)?(\/.*)?$/i.test(trimmed)) return true;
  return false;
}

/**
 * Normalize user input into a navigable URL.
 * Returns the final URL and whether it was originally a search query.
 */
export function normalizeInput(input: string): { url: string; isSearch: boolean } {
  const trimmed = input.trim();
  if (!trimmed) return { url: '', isSearch: false };

  if (/^https?:\/\//i.test(trimmed)) {
    return { url: trimmed, isSearch: false };
  }

  if (isUrlLike(trimmed)) {
    return { url: 'https://' + trimmed, isSearch: false };
  }

  // It's a search query
  return {
    url: 'https://www.google.com/search?q=' + encodeURIComponent(trimmed),
    isSearch: true,
  };
}
