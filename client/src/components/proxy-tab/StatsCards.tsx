import { useState, useEffect, useCallback } from 'react';
import { Globe, Zap, Activity, Clock, Wifi, HardDrive, Server } from 'lucide-react';
import { useProxyStore } from '../../stores/proxyStore';
import { buildApiUrl } from '../../config';

function StatsCards() {
  const { metrics, updateMetrics, logs } = useProxyStore();
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchMetrics = useCallback(async () => {
    try {
      // Ping the server to measure latency
      const pingStart = performance.now();
      const response = await fetch(buildApiUrl('/api/metrics'), { cache: 'no-store' });
      const pingEnd = performance.now();
      const latency = Math.round(pingEnd - pingStart);

      if (response.ok) {
        const data = await response.json();
        updateMetrics({
          total: data.total ?? metrics.total,
          completed: data.completed ?? metrics.completed,
          errors: data.errors ?? metrics.errors,
          avgTime: data.avgTime ?? metrics.avgTime,
          cacheHits: data.cacheHits ?? metrics.cacheHits,
          cacheMisses: data.cacheMisses ?? metrics.cacheMisses,
          latency,
          activeSessions: data.activeSessions ?? 0,
          bytesTransferred: data.bytesTransferred ?? metrics.bytesTransferred,
        });
        setLastFetched(Date.now());
      }
    } catch {
      // Server may not be running in prod; keep existing metrics
      updateMetrics({ latency: -1 });
    }
  }, [metrics, updateMetrics]);

  // Fetch on mount and periodically
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 8000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Track bytes from logs
  useEffect(() => {
    // Approximate bytes from log count (would need server-side tracking for accuracy)
    if (logs.length > 0) {
      const avgBytesPerRequest = 15000; // ~15KB average
      updateMetrics({
        bytesTransferred: metrics.completed * avgBytesPerRequest,
        activeSessions: new Set(logs.map((l) => l.url.split('/')[0])).size,
      });
    }
  }, [logs, metrics.completed, updateMetrics]);

  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0
    ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const cards = [
    {
      title: 'Total Requests',
      value: metrics.total.toString(),
      subtitle: `${logs.length} logged`,
      icon: <Globe size={20} />,
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
    },
    {
      title: 'Completed',
      value: metrics.completed.toString(),
      subtitle: `${cacheHitRate}% cache hit rate`,
      icon: <Zap size={20} />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Avg Latency',
      value: metrics.avgTime > 0 ? `${metrics.avgTime}ms` : metrics.latency === -1 ? 'Offline' : '...',
      subtitle: metrics.latency > 0 ? `Ping ${metrics.latency}ms · ${formatBytes(metrics.bytesTransferred)}` : formatBytes(metrics.bytesTransferred),
      icon: <Clock size={20} />,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Errors',
      value: metrics.errors.toString(),
      subtitle: `${metrics.activeSessions} active sessions`,
      icon: <Activity size={20} />,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5 transition-all duration-200 hover:shadow-lg hover:border-[var(--color-border-focus)]/30"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">
              {card.value}
            </div>
            {card.subtitle && (
              <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {card.subtitle}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Live status bar */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)] px-1">
        <span className="flex items-center gap-1">
          <Wifi size={10} className={metrics.latency > 0 ? 'text-emerald-500' : 'text-rose-500'} />
          Server {metrics.latency > 0 ? 'connected' : metrics.latency === 0 ? 'connecting...' : 'disconnected'}
        </span>
        <span className="flex items-center gap-1">
          <HardDrive size={10} />
          {formatBytes(metrics.bytesTransferred)} transferred
        </span>
        <span className="flex items-center gap-1">
          <Server size={10} />
          {metrics.activeSessions} session{metrics.activeSessions !== 1 ? 's' : ''}
        </span>
        {lastFetched > 0 && (
          <span className="ml-auto">
            Updated {Math.round((Date.now() - lastFetched) / 1000)}s ago
          </span>
        )}
      </div>
    </div>
  );
}

export default StatsCards;
