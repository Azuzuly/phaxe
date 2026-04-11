import { useProxyStore } from '../../stores/proxyStore';
import { encodeProxyUrl } from '../../lib/url';
import { PROXY_BASE_URL, PROXY_ROUTE_PREFIX } from '../../config';
import StatsCards from './StatsCards';
import RequestLog from './RequestLog';
import Sidebar from '../layout/Sidebar';
import { Plus, X, Globe } from 'lucide-react';

function ProxyTab() {
  const {
    currentUrl,
    tabs,
    activeProxyTabId,
    setActiveProxyTab,
    createProxyTab,
    closeProxyTab,
  } = useProxyStore();

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-2 py-2 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max pr-2">
            {tabs.map((tab) => {
              const active = tab.id === activeProxyTabId;
              const tabTitle = tab.title || 'New Tab';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveProxyTab(tab.id)}
                  className={`group flex items-center gap-2 min-w-[120px] max-w-[220px] px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    active
                      ? 'bg-[var(--color-bg-primary)] border-[var(--color-border-focus)]/40 text-[var(--color-text-primary)]'
                      : 'bg-[var(--color-bg-tertiary)] border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                  title={tabTitle}
                >
                  <Globe size={12} className="flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{tabTitle}</span>
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeProxyTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center p-0.5 rounded hover:bg-[var(--color-bg-primary)]"
                  >
                    <X size={11} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => createProxyTab()}
          className="p-1.5 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          title="New proxy tab"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />

        <div className="flex-1 min-w-0 overflow-hidden">
          {currentUrl ? (
            <div className="h-full relative">
              <iframe
                src={`${PROXY_BASE_URL}${PROXY_ROUTE_PREFIX}/${encodeProxyUrl(currentUrl)}`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                title="Proxied content"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="p-6 space-y-6 overflow-auto h-full">
              <StatsCards />
              <RequestLog />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProxyTab;
