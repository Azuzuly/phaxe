import { useState } from 'react';
import { Sun, Moon, Monitor, Trash2, Download, Upload, Key, Shield, Palette, Keyboard, Plus, X, Check } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useProxyStore } from '../../stores/proxyStore';
import { db } from '../../db';

const categories = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'proxy', label: 'Proxy', icon: Monitor },
  { id: 'ai', label: 'AI', icon: Key },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
];

type ProviderFormat = 'openai' | 'anthropic' | 'gemini' | 'custom';

function SettingsTab() {
  const { theme, setTheme } = useAppStore();
  const settings = useSettingsStore();
  const { clearLogs, updateMetrics } = useProxyStore();

  const [showProviderForm, setShowProviderForm] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [providerBaseUrl, setProviderBaseUrl] = useState('');
  const [providerApiKey, setProviderApiKey] = useState('');
  const [providerFormat, setProviderFormat] = useState<ProviderFormat>('openai');

  const handleAddProvider = async () => {
    if (!providerName.trim() || !providerBaseUrl.trim() || !providerApiKey.trim()) return;

    const provider = {
      id: Date.now().toString(),
      name: providerName.trim(),
      baseUrl: providerBaseUrl.trim(),
      apiKey: providerApiKey.trim(),
      format: providerFormat,
      models: [],
      active: true,
    };

    settings.addApiProvider(provider);

    // Also save to Dexie for persistence across sessions
    await db.apiProviders.add({
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      format: provider.format,
      models: provider.models,
      active: provider.active,
    });

    setProviderName('');
    setProviderBaseUrl('');
    setProviderApiKey('');
    setShowProviderForm(false);
  };

  const handleDeleteProvider = async (id: string) => {
    settings.deleteApiProvider(id);
    await db.apiProviders.where('id').equals(Number(id)).delete();
  };

  const handleClearHistory = async () => {
    await db.history.clear();
  };

  const handleClearBookmarks = async () => {
    await db.bookmarks.clear();
  };

  const handleClearCache = async () => {
    try {
      await fetch('/api/cache', { method: 'DELETE' });
      clearLogs();
      updateMetrics({ total: 0, completed: 0, errors: 0, avgTime: 0, cacheHits: 0, cacheMisses: 0 });
    } catch (err) {
      console.error('Cache clear failed:', err);
    }
  };

  const handleClearConversations = async () => {
    await db.conversations.clear();
  };

  const handleExportData = async () => {
    const data = {
      bookmarks: await db.bookmarks.toArray(),
      history: await db.history.toArray(),
      conversations: await db.conversations.toArray(),
      settings: {
        theme,
        accentColor: settings.accentColor,
        sidebarPosition: settings.sidebarPosition,
        proxyTimeout: settings.proxyTimeout,
        cacheEnabled: settings.cacheEnabled,
        apiProviders: settings.apiProviders,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phaxe-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.bookmarks) {
          await db.bookmarks.clear();
          for (const bm of data.bookmarks) {
            await db.bookmarks.add(bm);
          }
        }
        if (data.history) {
          await db.history.clear();
          for (const h of data.history) {
            await db.history.add(h);
          }
        }
        if (data.conversations) {
          await db.conversations.clear();
          for (const c of data.conversations) {
            await db.conversations.add(c);
          }
        }
        if (data.settings?.apiProviders) {
          for (const p of data.settings.apiProviders) {
            await db.apiProviders.add(p);
          }
        }
        alert('Data imported successfully. Refresh to see changes.');
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to import data. Invalid file format.');
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex">
      {/* Category sidebar */}
      <div className="w-48 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-3">
        <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3 px-2">
          Settings
        </h2>
        <nav className="space-y-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  const el = document.getElementById(`settings-${cat.id}`);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-auto p-6 space-y-10">

        {/* Appearance */}
        <div id="settings-appearance" className="max-w-lg space-y-6 scroll-mt-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Appearance</h3>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Theme</label>
            <div className="flex gap-3">
              {[
                { value: 'light' as const, label: 'Light', icon: Sun },
                { value: 'dark' as const, label: 'Dark', icon: Moon },
                { value: 'system' as const, label: 'System', icon: Monitor },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = t.value === 'system'
                  ? theme === 'dark' // System doesn't have its own state, just a label
                  : theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      if (t.value === 'system') {
                        // Detect system preference
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        setTheme(prefersDark ? 'dark' : 'light');
                      } else {
                        setTheme(t.value);
                      }
                    }}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-focus)]/30'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-primary-500' : 'text-[var(--color-text-secondary)]'} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Sidebar Position</label>
            <div className="flex gap-2">
              {(['left', 'right'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => settings.setSidebarPosition(pos)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    settings.sidebarPosition === pos
                      ? 'bg-primary-500/20 text-primary-500'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Font Size
            </label>
            <div className="flex gap-2">
              {([
                { value: 'sm' as const, label: 'Small' },
                { value: 'base' as const, label: 'Medium' },
                { value: 'lg' as const, label: 'Large' },
              ]).map((s) => (
                <button
                  key={s.value}
                  onClick={() => settings.setFontSize(s.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    settings.fontSize === s.value
                      ? 'bg-primary-500/20 text-primary-500'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Blur Amount: {settings.blurAmount}px
            </label>
            <input
              type="range"
              min="0"
              max="30"
              value={settings.blurAmount}
              onChange={(e) => settings.setBlurAmount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => settings.setReducedMotion(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">Reduce motion</span>
          </div>
        </div>

        {/* Proxy */}
        <div id="settings-proxy" className="max-w-lg space-y-6 scroll-mt-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Proxy Settings</h3>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Connection Timeout: {settings.proxyTimeout}s
            </label>
            <input
              type="range"
              min="5"
              max="60"
              value={settings.proxyTimeout}
              onChange={(e) => settings.setProxyTimeout(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>5s</span>
              <span>60s</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Cache</label>
            <div className="flex gap-2">
              <button onClick={handleClearCache} className="btn btn-secondary text-xs">
                Clear Cache
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={settings.cacheEnabled}
                onChange={(e) => settings.setCacheEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">Enable caching</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Compression</label>
            <div className="space-y-2">
              {(['brotli', 'gzip', 'zstd'] as const).map((algo) => (
                <label key={algo} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={settings.compression[algo]}
                    onChange={(e) => settings.setCompression(algo, e.target.checked)}
                    className="rounded"
                  />
                  {algo.charAt(0).toUpperCase() + algo.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* AI */}
        <div id="settings-ai" className="max-w-lg space-y-6 scroll-mt-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">AI Settings</h3>

          {/* API Providers */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">API Providers</label>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Configure custom AI API endpoints. Supports OpenAI-compatible APIs, Anthropic, Google Gemini, and any custom provider.
            </p>

            {/* Existing providers */}
            {settings.apiProviders.length > 0 && (
              <div className="space-y-2 mt-3">
                {settings.apiProviders.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                        {p.baseUrl} &middot; {p.format}
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[var(--color-text-tertiary)]/20 text-[var(--color-text-tertiary)]'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleDeleteProvider(p.id)}
                      className="p-0.5 rounded hover:text-rose-500 text-[var(--color-text-tertiary)] transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Provider button / form */}
            {!showProviderForm ? (
              <button
                onClick={() => setShowProviderForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 text-xs font-medium transition-colors"
              >
                <Plus size={12} />
                Add Provider
              </button>
            ) : (
              <div className="space-y-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]">
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="Provider name (e.g., OpenAI)"
                  className="input text-xs py-1.5"
                />
                <input
                  type="text"
                  value={providerBaseUrl}
                  onChange={(e) => setProviderBaseUrl(e.target.value)}
                  placeholder="Base URL (e.g., https://api.openai.com/v1)"
                  className="input text-xs py-1.5"
                />
                <input
                  type="password"
                  value={providerApiKey}
                  onChange={(e) => setProviderApiKey(e.target.value)}
                  placeholder="API Key"
                  className="input text-xs py-1.5"
                />
                <select
                  value={providerFormat}
                  onChange={(e) => setProviderFormat(e.target.value as ProviderFormat)}
                  className="input text-xs py-1.5"
                >
                  <option value="openai">OpenAI-compatible</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="custom">Custom</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddProvider}
                    disabled={!providerName.trim() || !providerBaseUrl.trim() || !providerApiKey.trim()}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={12} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowProviderForm(false);
                      setProviderName('');
                      setProviderBaseUrl('');
                      setProviderApiKey('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Default model */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Default Model</label>
            <input
              type="text"
              value={settings.defaultModel}
              onChange={(e) => settings.setDefaultModel(e.target.value)}
              placeholder="gpt-4o"
              className="input text-sm"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Temperature: {settings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => settings.setTemperature(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Max Tokens: {settings.maxTokens}
            </label>
            <input
              type="range"
              min="256"
              max="32000"
              step="256"
              value={settings.maxTokens}
              onChange={(e) => settings.setMaxTokens(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">System Prompt</label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => settings.setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant..."
              rows={3}
              className="input text-sm resize-none"
            />
          </div>

          {/* Live Screen settings */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Live Screen</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={settings.liveScreenAutoCrop}
                  onChange={(e) => settings.setLiveScreenAutoCrop(e.target.checked)}
                  className="rounded"
                />
                Auto-crop based on prompt context
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={settings.showCaptureIndicator}
                  onChange={(e) => settings.setShowCaptureIndicator(e.target.checked)}
                  className="rounded"
                />
                Show capture indicator
              </label>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div id="settings-privacy" className="max-w-lg space-y-6 scroll-mt-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Privacy</h3>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Clear Browsing Data</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-primary)] text-sm text-[var(--color-text-secondary)] hover:text-rose-500 hover:border-rose-500/30 transition-colors"
              >
                <Trash2 size={14} />
                History
              </button>
              <button
                onClick={handleClearBookmarks}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-primary)] text-sm text-[var(--color-text-secondary)] hover:text-rose-500 hover:border-rose-500/30 transition-colors"
              >
                <Trash2 size={14} />
                Bookmarks
              </button>
              <button
                onClick={handleClearCache}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-primary)] text-sm text-[var(--color-text-secondary)] hover:text-rose-500 hover:border-rose-500/30 transition-colors"
              >
                <Trash2 size={14} />
                Cache
              </button>
              <button
                onClick={handleClearConversations}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-primary)] text-sm text-[var(--color-text-secondary)] hover:text-rose-500 hover:border-rose-500/30 transition-colors"
              >
                <Trash2 size={14} />
                AI Conversations
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.incognitoMode}
              onChange={(e) => settings.setIncognitoMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">Incognito Mode (don't save history)</span>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">History Auto-Prune</label>
            <select
              value={settings.historyAutoPrune}
              onChange={(e) => settings.setHistoryAutoPrune(e.target.value as any)}
              className="input text-sm"
            >
              <option value="off">Off</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">Data Management</label>
            <div className="flex gap-2">
              <button onClick={handleExportData} className="btn btn-secondary text-xs">
                <Download size={12} />
                Export Data
              </button>
              <button onClick={handleImportData} className="btn btn-secondary text-xs">
                <Upload size={12} />
                Import Data
              </button>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div id="settings-shortcuts" className="max-w-lg space-y-6 scroll-mt-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Keyboard Shortcuts</h3>

          <div className="space-y-2">
            {[
              { keys: 'Ctrl + T', action: 'New tab' },
              { keys: 'Ctrl + L', action: 'Focus URL bar' },
              { keys: 'Ctrl + R', action: 'Refresh page' },
              { keys: 'Ctrl + Shift + A', action: 'Open AI tab' },
              { keys: 'Ctrl + Shift + L', action: 'Toggle Live Screen' },
              { keys: 'Ctrl + Shift + P', action: 'Toggle PiP' },
              { keys: 'Ctrl + Shift + D', action: 'Toggle dark mode' },
              { keys: 'Ctrl + Enter', action: 'Send AI message' },
              { keys: 'Esc', action: 'Stop Live Screen / Close PiP' },
              { keys: '`', action: 'Panic Key (redirect to Google Classroom)' },
            ].map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center justify-between py-2 border-b border-[var(--color-border-secondary)]">
                <span className="text-sm text-[var(--color-text-secondary)]">{shortcut.action}</span>
                <kbd className="px-2 py-1 rounded text-xs font-mono bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)]">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;
