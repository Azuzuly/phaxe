import { useState } from 'react';
import { Bookmark, Clock, ChevronLeft, Folder, Tag, Search } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

function Sidebar() {
  const { sidebarSection, setSidebarSection, toggleSidebar } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-primary)]">
        <div className="flex gap-1">
          <button
            onClick={() => setSidebarSection('bookmarks')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              sidebarSection === 'bookmarks'
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Bookmark size={12} />
            Bookmarks
          </button>
          <button
            onClick={() => setSidebarSection('history')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
              sidebarSection === 'history'
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Clock size={12} />
            History
          </button>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
          aria-label="Close sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)]">
          <Search size={12} className="text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 py-2">
        {sidebarSection === 'bookmarks' ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] cursor-pointer">
              <Folder size={14} className="text-[var(--color-text-tertiary)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">Default Folder</span>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] px-2 py-4 text-center">
              No bookmarks yet.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-tertiary)] px-2 py-4 text-center">
            No history yet.
          </p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
