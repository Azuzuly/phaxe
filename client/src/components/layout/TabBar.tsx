import { Globe, Bot, Settings } from 'lucide-react';
import { useAppStore, TabType } from '../../stores/appStore';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'proxy', label: 'Proxy', icon: <Globe size={16} /> },
  { id: 'ai', label: 'AI', icon: <Bot size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

function TabBar() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="flex items-center justify-center gap-1 py-2 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default TabBar;
