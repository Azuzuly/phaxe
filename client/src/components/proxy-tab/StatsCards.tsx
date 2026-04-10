import { Globe, Zap, Activity, Clock } from 'lucide-react';
import { useProxyStore } from '../../stores/proxyStore';

function StatsCards() {
  const { metrics } = useProxyStore();
  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0
    ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
    : 0;

  const cards = [
    {
      title: 'Total Requests',
      value: metrics.total,
      icon: <Globe size={20} />,
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
    },
    {
      title: 'Completed',
      value: metrics.completed,
      icon: <Zap size={20} />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Errors',
      value: metrics.errors,
      icon: <Activity size={20} />,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      title: 'Avg Time',
      value: `${metrics.avgTime}ms`,
      subtitle: `${cacheHitRate}% cache hit`,
      icon: <Clock size={20} />,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
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
  );
}

export default StatsCards;
