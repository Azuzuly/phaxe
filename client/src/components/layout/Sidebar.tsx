import { useState } from 'react';
import { Bookmark, Clock, ChevronLeft, ChevronRight, Folder, Tag, Search, Trash2, Plus } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useHistory } from '../../hooks/useHistory';
import { useProxyStore } from '../../stores/proxyStore';

function Sidebar() {
  const { sidebarSection, setSidebarSection, toggleSidebar, sidebarOpen } = useAppStore();
  const { navigate } = useProxyStore();
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFolder, setNewFolder] = useState('Default');

  const {
    bookmarks, folders, allTags, searchQuery, setSearchQuery,
    selectedFolder, setSelectedFolder, selectedTag, setSelectedTag,
    addBookmark, deleteBookmark, exportBookmarks, importBookmarks,
  } = useBookmarks();

  const {
    groups, searchQuery: histSearch, setSearchQuery: setHistSearch,
    deleteEntry, clearAll,
  } = useHistory();

  const handleNavigate = (url: string) => {
    navigate(url);
  };

  const handleAddBookmark = async () => {
    if (!newTitle || !newUrl) return;
    await addBookmark({ title: newTitle, url: newUrl, folder: newFolder, tags: [] });
    setNewTitle('');
    setNewUrl('');
    setShowAddBookmark(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await importBookmarks(file);
  };

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="p-2 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        aria-label="Open sidebar"
      >
        <ChevronRight size={16} />
      </button>
    );
  }

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
            value={sidebarSection === 'bookmarks' ? searchQuery : histSearch}
            onChange={(e) => sidebarSection === 'bookmarks' ? setSearchQuery(e.target.value) : setHistSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 py-2">
        {sidebarSection === 'bookmarks' ? (
          <div className="space-y-2">
            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => setShowAddBookmark(!showAddBookmark)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Plus size={12} /> Add
              </button>
              <button
                onClick={exportBookmarks}
                className="px-2 py-1 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Export"
              >
                Export
              </button>
              <label className="px-2 py-1 rounded text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer" title="Import">
                Import
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            {/* Add bookmark form */}
            {showAddBookmark && (
              <div className="space-y-2 p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title"
                  className="input text-xs py-1"
                />
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="URL"
                  className="input text-xs py-1"
                />
                <input
                  type="text"
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  placeholder="Folder"
                  className="input text-xs py-1"
                />
                <button onClick={handleAddBookmark} className="w-full btn btn-primary text-xs py-1">
                  Save
                </button>
              </div>
            )}

            {/* Folder filter */}
            {folders.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`px-2 py-0.5 rounded text-[10px] ${!selectedFolder ? 'bg-primary-500/20 text-primary-500' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'}`}
                >
                  All
                </button>
                {folders.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFolder(f === selectedFolder ? null : f)}
                    className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${f === selectedFolder ? 'bg-primary-500/20 text-primary-500' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'}`}
                  >
                    <Folder size={8} />
                    {f}
                  </button>
                ))}
              </div>
            )}

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t === selectedTag ? null : t)}
                    className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${t === selectedTag ? 'bg-primary-500/20 text-primary-500' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'}`}
                  >
                    <Tag size={8} />
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Bookmark list */}
            {bookmarks.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] py-4 text-center">
                No bookmarks yet.
              </p>
            ) : (
              <div className="space-y-0.5">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    <button
                      onClick={() => handleNavigate(bm.url)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                        {bm.title}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                        {bm.url}
                      </div>
                    </button>
                    <button
                      onClick={() => bm.id && deleteBookmark(bm.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--color-text-tertiary)] hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Clear all */}
            <button
              onClick={clearAll}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded text-xs bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
            >
              <Trash2 size={12} />
              Clear All History
            </button>

            {/* History groups */}
            {groups.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] py-4 text-center">
                No history yet.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.label}>
                  <h4 className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                    {group.label}
                  </h4>
                  <div className="space-y-0.5">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      >
                        <button
                          onClick={() => handleNavigate(entry.url)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                            {entry.title || entry.url}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                            {new Date(entry.visitedAt).toLocaleTimeString()}
                          </div>
                        </button>
                        <button
                          onClick={() => entry.id && deleteEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--color-text-tertiary)] hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
