import { useEffect, useRef } from 'react';
import { useAppStore } from './stores/appStore';
import { useProxyStore } from './stores/proxyStore';
import { useAIStore } from './stores/aiStore';
import TopNav from './components/layout/TopNav';
import TabBar from './components/layout/TabBar';
import Sidebar from './components/layout/Sidebar';
import ProxyTab from './components/proxy-tab/ProxyTab';
import AITab from './components/ai-tab/AITab';
import SettingsTab from './components/settings/SettingsTab';
import { registerServiceWorker } from './lib/sw';
import { enablePanicKey } from './lib/panic';
import { applyCloak } from './lib/cloak';
import { db } from './db';

function App() {
  const { activeTab, sidebarOpen, theme, setActiveTab, setTheme } = useAppStore();
  const { currentUrl } = useProxyStore();
  const { liveScreenActive, setLiveScreenActive } = useAIStore();
  const panicEnabled = useRef(false);

  // Register Service Worker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Enable panic key on mount
  useEffect(() => {
    if (!panicEnabled.current) {
      enablePanicKey('`');
      panicEnabled.current = true;
    }
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply cloak when proxying content
  useEffect(() => {
    applyCloak('Google Docs');
  }, [currentUrl]);

  // Log history entry when navigating to a URL
  useEffect(() => {
    if (currentUrl) {
      const entry = {
        title: currentUrl.replace(/^https?:\/\//, '').split('/')[0],
        url: currentUrl,
        visitedAt: Date.now(),
      };
      db.history.add(entry).catch(console.error);
    }
  }, [currentUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.ctrlKey && e.key === 'l' && !e.shiftKey) {
        e.preventDefault();
        // Focus URL bar - dispatch a custom event
        window.dispatchEvent(new CustomEvent('focus-url-bar'));
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setActiveTab('ai');
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        if (liveScreenActive) {
          setLiveScreenActive(false);
        } else {
          setLiveScreenActive(true);
        }
      }

      if (e.key === 'Escape' && !isInput) {
        if (liveScreenActive) {
          setLiveScreenActive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, theme, liveScreenActive, setActiveTab, setTheme, setLiveScreenActive]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <TopNav />
      <TabBar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 overflow-auto">
          {activeTab === 'proxy' && <ProxyTab />}
          {activeTab === 'ai' && <AITab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

export default App;
