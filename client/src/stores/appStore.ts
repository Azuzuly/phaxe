import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabType = 'proxy' | 'ai' | 'settings';

interface AppState {
  activeTab: TabType;
  sidebarOpen: boolean;
  sidebarSection: 'bookmarks' | 'history';
  theme: 'light' | 'dark';
  loadingProgress: number;
  isLoading: boolean;

  setActiveTab: (tab: TabType) => void;
  toggleSidebar: () => void;
  setSidebarSection: (section: 'bookmarks' | 'history') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoadingProgress: (progress: number) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'proxy',
      sidebarOpen: true,
      sidebarSection: 'bookmarks',
      theme: 'dark',
      loadingProgress: 0,
      isLoading: false,

      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarSection: (section) => set({ sidebarSection: section }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      setLoadingProgress: (progress) => set({ loadingProgress: progress }),
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'phaxe-app',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        sidebarSection: state.sidebarSection,
      }),
    }
  )
);
