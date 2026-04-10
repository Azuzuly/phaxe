import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Appearance
  theme: 'light' | 'dark';
  accentColor: string;
  sidebarPosition: 'left' | 'right';
  fontSize: 'sm' | 'base' | 'lg';
  blurAmount: number;
  reducedMotion: boolean;

  // Proxy
  proxyTimeout: number;
  maxConnections: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  maxCacheSize: number;
  compression: { brotli: boolean; gzip: boolean; zstd: boolean };
  customHeaders: Record<string, string>;
  cssInjection: string;
  jsInjection: string;
  aclMode: 'blocklist' | 'allowlist';
  aclList: string[];

  // AI
  apiProviders: Array<{
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    format: 'openai' | 'anthropic' | 'gemini' | 'custom';
    models: string[];
    active: boolean;
  }>;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  liveScreenAutoCrop: boolean;
  screenshotQuality: 'low' | 'medium' | 'high';
  showCaptureIndicator: boolean;

  // Privacy
  incognitoMode: boolean;
  historyAutoPrune: 'off' | '30' | '60' | '90';
  screenshotRetention: 'off' | '1h' | '24h' | '7d';

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
  setSidebarPosition: (pos: 'left' | 'right') => void;
  setFontSize: (size: 'sm' | 'base' | 'lg') => void;
  setBlurAmount: (amount: number) => void;
  setReducedMotion: (val: boolean) => void;
  setProxyTimeout: (val: number) => void;
  setMaxConnections: (val: number) => void;
  setCacheEnabled: (val: boolean) => void;
  setCacheTTL: (val: number) => void;
  setMaxCacheSize: (val: number) => void;
  setCompression: (key: 'brotli' | 'gzip' | 'zstd', val: boolean) => void;
  setCustomHeader: (key: string, value: string) => void;
  removeCustomHeader: (key: string) => void;
  setCssInjection: (val: string) => void;
  setJsInjection: (val: string) => void;
  setAclMode: (mode: 'blocklist' | 'allowlist') => void;
  addAclEntry: (entry: string) => void;
  removeAclEntry: (entry: string) => void;
  addApiProvider: (provider: SettingsState['apiProviders'][0]) => void;
  updateApiProvider: (id: string, data: Partial<SettingsState['apiProviders'][0]>) => void;
  deleteApiProvider: (id: string) => void;
  setDefaultModel: (model: string) => void;
  setTemperature: (val: number) => void;
  setMaxTokens: (val: number) => void;
  setSystemPrompt: (val: string) => void;
  setLiveScreenAutoCrop: (val: boolean) => void;
  setScreenshotQuality: (val: 'low' | 'medium' | 'high') => void;
  setShowCaptureIndicator: (val: boolean) => void;
  setIncognitoMode: (val: boolean) => void;
  setHistoryAutoPrune: (val: 'off' | '30' | '60' | '90') => void;
  setScreenshotRetention: (val: 'off' | '1h' | '24h' | '7d') => void;
  resetToDefaults: () => void;
}

const defaults = {
  theme: 'dark' as const,
  accentColor: '#6366f1',
  sidebarPosition: 'left' as const,
  fontSize: 'base' as const,
  blurAmount: 12,
  reducedMotion: false,
  proxyTimeout: 30,
  maxConnections: 50,
  cacheEnabled: true,
  cacheTTL: 10,
  maxCacheSize: 500,
  compression: { brotli: true, gzip: true, zstd: false },
  customHeaders: {},
  cssInjection: '',
  jsInjection: '',
  aclMode: 'blocklist' as const,
  aclList: [],
  apiProviders: [],
  defaultModel: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4000,
  systemPrompt: '',
  liveScreenAutoCrop: true,
  screenshotQuality: 'medium' as const,
  showCaptureIndicator: false,
  incognitoMode: false,
  historyAutoPrune: '90' as const,
  screenshotRetention: '24h' as const,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      setAccentColor: (accentColor) => set({ accentColor }),
      setSidebarPosition: (sidebarPosition) => set({ sidebarPosition }),
      setFontSize: (fontSize) => set({ fontSize }),
      setBlurAmount: (blurAmount) => set({ blurAmount }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setProxyTimeout: (proxyTimeout) => set({ proxyTimeout }),
      setMaxConnections: (maxConnections) => set({ maxConnections }),
      setCacheEnabled: (cacheEnabled) => set({ cacheEnabled }),
      setCacheTTL: (cacheTTL) => set({ cacheTTL }),
      setMaxCacheSize: (maxCacheSize) => set({ maxCacheSize }),
      setCompression: (key, val) =>
        set((s) => ({ compression: { ...s.compression, [key]: val } })),
      setCustomHeader: (key, value) =>
        set((s) => ({ customHeaders: { ...s.customHeaders, [key]: value } })),
      removeCustomHeader: (key) =>
        set((s) => {
          const h = { ...s.customHeaders };
          delete h[key];
          return { customHeaders: h };
        }),
      setCssInjection: (cssInjection) => set({ cssInjection }),
      setJsInjection: (jsInjection) => set({ jsInjection }),
      setAclMode: (aclMode) => set({ aclMode }),
      addAclEntry: (entry) =>
        set((s) => ({ aclList: s.aclList.includes(entry) ? s.aclList : [...s.aclList, entry] })),
      removeAclEntry: (entry) =>
        set((s) => ({ aclList: s.aclList.filter((e) => e !== entry) })),
      addApiProvider: (provider) =>
        set((s) => ({ apiProviders: [...s.apiProviders, provider] })),
      updateApiProvider: (id, data) =>
        set((s) => ({
          apiProviders: s.apiProviders.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteApiProvider: (id) =>
        set((s) => ({ apiProviders: s.apiProviders.filter((p) => p.id !== id) })),
      setDefaultModel: (defaultModel) => set({ defaultModel }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setLiveScreenAutoCrop: (liveScreenAutoCrop) => set({ liveScreenAutoCrop }),
      setScreenshotQuality: (screenshotQuality) => set({ screenshotQuality }),
      setShowCaptureIndicator: (showCaptureIndicator) => set({ showCaptureIndicator }),
      setIncognitoMode: (incognitoMode) => set({ incognitoMode }),
      setHistoryAutoPrune: (historyAutoPrune) => set({ historyAutoPrune }),
      setScreenshotRetention: (screenshotRetention) => set({ screenshotRetention }),
      resetToDefaults: () => set(defaults),
    }),
    { name: 'phaxe-settings' }
  )
);
