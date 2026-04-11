import { useProxyStore } from '../../stores/proxyStore';
import { encodeProxyUrl } from '../../lib/url';
import StatsCards from './StatsCards';
import RequestLog from './RequestLog';

function ProxyTab() {
  const { currentUrl } = useProxyStore();

  if (currentUrl) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 relative">
          <iframe
            src={`/proxy/${encodeProxyUrl(currentUrl)}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Proxied content"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <StatsCards />
      <RequestLog />
    </div>
  );
}

export default ProxyTab;
