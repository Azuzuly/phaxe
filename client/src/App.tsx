import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import TopNav from './components/layout/TopNav';
import TabBar from './components/layout/TabBar';
import Sidebar from './components/layout/Sidebar';
import ProxyTab from './components/proxy-tab/ProxyTab';
import AITab from './components/ai-tab/AITab';
import SettingsTab from './components/settings/SettingsTab';

function App() {
  const { activeTab, sidebarOpen, theme } = useAppStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
