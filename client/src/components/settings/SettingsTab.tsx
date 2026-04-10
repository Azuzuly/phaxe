import { useState } from 'react';
import { Sun, Moon, Monitor, Trash2, Download, Upload, Key, Shield, Palette, Keyboard } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

const categories = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'proxy', label: 'Proxy', icon: Monitor },
  { id: 'ai', label: 'AI', icon: Key },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
];

function SettingsTab() {
  const { theme, setTheme } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('appearance');

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
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-medium'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-auto p-6">
        {activeCategory === 'appearance' && (
          <div className="max-w-lg space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Appearance</h3>

            {/* Theme */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Theme</label>
              <div className="flex gap-3">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => t.value !== 'system' && setTheme(t.value as 'light' | 'dark')}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        theme === t.value
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-focus)]/30'
                      }`}
                    >
                      <Icon size={20} className={theme === t.value ? 'text-primary-500' : 'text-[var(--color-text-secondary)]'} />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'proxy' && (
          <div className="max-w-lg space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Proxy Settings</h3>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Connection Timeout</label>
              <input type="range" min="5" max="60" defaultValue="30" className="w-full" />
              <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>5s</span>
                <span>30s</span>
                <span>60s</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Cache</label>
              <div className="flex gap-2">
                <button className="btn btn-secondary text-xs">Clear Cache</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Compression</label>
              <div className="space-y-2">
                {['Brotli', 'Gzip', 'Zstd'].map((algo) => (
                  <label key={algo} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <input type="checkbox" defaultChecked className="rounded" />
                    {algo}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'ai' && (
          <div className="max-w-lg space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">AI Settings</h3>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">API Providers</label>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Configure custom AI API endpoints. Supports OpenAI-compatible APIs, Anthropic, Google Gemini, and any custom provider.
              </p>
              <button className="btn btn-primary text-xs">+ Add Provider</button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Live Screen</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Auto-crop based on prompt context
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <input type="checkbox" className="rounded" />
                  Show capture indicator
                </label>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'privacy' && (
          <div className="max-w-lg space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Privacy</h3>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Clear Browsing Data</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'History', icon: Trash2 },
                  { label: 'Bookmarks', icon: Trash2 },
                  { label: 'Cache', icon: Trash2 },
                  { label: 'AI Conversations', icon: Trash2 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-primary)] text-sm text-[var(--color-text-secondary)] hover:text-rose-500 hover:border-rose-500/30 transition-colors">
                      <Icon size={14} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Data Management</label>
              <div className="flex gap-2">
                <button className="btn btn-secondary text-xs">
                  <Download size={12} />
                  Export Data
                </button>
                <button className="btn btn-secondary text-xs">
                  <Upload size={12} />
                  Import Data
                </button>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'shortcuts' && (
          <div className="max-w-lg space-y-6">
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
        )}
      </div>
    </div>
  );
}

export default SettingsTab;
