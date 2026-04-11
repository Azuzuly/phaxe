import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState } from 'react';
import { useProxyStore, RequestLog as RequestLogType } from '../../stores/proxyStore';

function RequestLog() {
  const { logs } = useProxyStore();
  const [filter, setFilter] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredLogs = filter
    ? logs.filter(
        (log) =>
          log.url.toLowerCase().includes(filter.toLowerCase()) ||
          log.method.toLowerCase().includes(filter.toLowerCase())
      )
    : logs;

  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString();
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'badge-success';
    if (status >= 400) return 'badge-error';
    return 'badge-neutral';
  };

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Request Log
          </h2>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {filteredLogs.length} entries
          </span>
        </div>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by URL or method..."
          className="input mt-2"
        />
      </div>
      <div ref={parentRef} className="h-80 overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const log: RequestLogType = filteredLogs[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 w-full flex items-center gap-4 px-4 py-2 border-b border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <span className="text-xs text-[var(--color-text-tertiary)] w-20 flex-shrink-0">
                  {formatTime(log.timestamp)}
                </span>
                <span className={`badge ${getStatusColor(log.status)}`}>
                  {log.status}
                </span>
                <span className="text-xs font-mono text-[var(--color-text-secondary)] w-12 flex-shrink-0">
                  {log.method}
                </span>
                <span className="text-sm text-[var(--color-text-primary)] truncate flex-1">
                  {log.url}
                </span>
                <span className="text-xs text-[var(--color-text-tertiary)] w-16 text-right flex-shrink-0">
                  {log.duration}ms
                </span>
                {log.cached && (
                  <span className="badge badge-neutral text-[10px]">cached</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RequestLog;
