import { create } from 'zustand';

export interface RequestLog {
  id: string;
  url: string;
  method: string;
  status: number;
  timestamp: number;
  duration: number;
  cached: boolean;
}

interface ProxyState {
  currentUrl: string;
  history: string[];
  historyIndex: number;
  logs: RequestLog[];
  metrics: {
    total: number;
    completed: number;
    errors: number;
    avgTime: number;
    cacheHits: number;
    cacheMisses: number;
    bytesTransferred: number;
    latency: number;
    activeSessions: number;
  };

  setCurrentUrl: (url: string) => void;
  navigate: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  addLog: (log: RequestLog) => void;
  clearLogs: () => void;
  updateMetrics: (metrics: Partial<ProxyState['metrics']>) => void;
  setMetrics: (metrics: ProxyState['metrics']) => void;
}

export const useProxyStore = create<ProxyState>((set) => ({
  currentUrl: '',
  history: [],
  historyIndex: -1,
  logs: [],
  metrics: {
    total: 0,
    completed: 0,
    errors: 0,
    avgTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    bytesTransferred: 0,
    latency: 0,
    activeSessions: 0,
  },

  setCurrentUrl: (url) => set({ currentUrl: url }),
  navigate: (url) =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(url);
      return {
        currentUrl: url,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),
  goBack: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        currentUrl: state.history[newIndex],
        historyIndex: newIndex,
      };
    }),
  goForward: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        currentUrl: state.history[newIndex],
        historyIndex: newIndex,
      };
    }),
  addLog: (log) =>
    set((state) => {
      const newLogs = [log, ...state.logs].slice(0, 100);
      return { logs: newLogs };
    }),
  clearLogs: () => set({ logs: [] }),
  updateMetrics: (metrics) =>
    set((state) => ({
      metrics: { ...state.metrics, ...metrics },
    })),
  setMetrics: (metrics) => set({ metrics }),
}));
