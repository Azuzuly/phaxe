/**
 * Runtime endpoint configuration.
 *
 * - Local dev uses relative routes (`/api`, `/proxy`) via Vite + local server.
 * - Deployed frontend (e.g. pages.dev) defaults to Worker endpoints.
 * - All values can be overridden with VITE_* env vars at build time.
 */

const trimSlash = (value: string) => value.replace(/\/+$/, '');
const viteEnv = ((import.meta as any).env || {}) as Record<string, string | boolean | undefined>;
const isDev = Boolean(viteEnv.DEV);

const WORKER_URL_DEFAULT = 'https://phaxe-proxy.azuzuly79.workers.dev';
const VERCEL_PROXY_URL_DEFAULT = 'https://phaxe-proxy-vercel.vercel.app';

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = browserHost === 'localhost' || browserHost === '127.0.0.1';

export const WORKER_URL = trimSlash(String(viteEnv.VITE_WORKER_URL || WORKER_URL_DEFAULT));
export const VERCEL_PROXY_URL = trimSlash(String(viteEnv.VITE_VERCEL_PROXY_URL || VERCEL_PROXY_URL_DEFAULT));

const configuredApiBase = viteEnv.VITE_API_BASE_URL
	? trimSlash(String(viteEnv.VITE_API_BASE_URL))
	: null;

const configuredProxyBase = viteEnv.VITE_PROXY_BASE_URL
	? trimSlash(String(viteEnv.VITE_PROXY_BASE_URL))
	: null;

// In production, prefer Worker so Pages can call APIs without localhost.
export const API_BASE_URL = configuredApiBase ?? (isDev || isLocalHost ? '' : WORKER_URL);
export const PROXY_BASE_URL = configuredProxyBase ?? (isDev || isLocalHost ? '' : WORKER_URL);

// Local server route is /proxy/{encoded}, Worker route is /p/{encoded}
export const PROXY_ROUTE_PREFIX = String(viteEnv.VITE_PROXY_ROUTE_PREFIX || (isDev || isLocalHost ? '/proxy' : '/p'));

export const buildApiUrl = (path: string) => {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${API_BASE_URL}${normalizedPath}`;
};
