import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Shield, Star } from 'lucide-react';
import { useProxyStore } from '../../stores/proxyStore';
import { useAppStore } from '../../stores/appStore';
import { normalizeInput } from '../../lib/url';
import { db } from '../../db';

function TopNav() {
  const { currentUrl, goBack, goForward, navigate } = useProxyStore();
  const { loadingProgress, isLoading } = useAppStore();
  const [inputValue, setInputValue] = useState(currentUrl);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input when store URL changes
  useEffect(() => {
    setInputValue(currentUrl);
  }, [currentUrl]);

  // Listen for Ctrl+L focus event
  useEffect(() => {
    const handler = () => inputRef.current?.focus();
    window.addEventListener('focus-url-bar', handler);
    return () => window.removeEventListener('focus-url-bar', handler);
  }, []);

  // Check if current URL is bookmarked
  useEffect(() => {
    if (!currentUrl) {
      setIsBookmarked(false);
      return;
    }
    db.bookmarks.where('url').equals(currentUrl).first().then((bm) => {
      setIsBookmarked(!!bm);
    });
  }, [currentUrl]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    const { url } = normalizeInput(inputValue);
    if (url) {
      navigate(url);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleBookmark = async () => {
    if (!currentUrl) return;
    if (isBookmarked) {
      await db.bookmarks.where('url').equals(currentUrl).delete();
      setIsBookmarked(false);
    } else {
      await db.bookmarks.add({
        title: currentUrl.replace(/^https?:\/\//, '').split('/')[0],
        url: currentUrl,
        folder: 'Default',
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setIsBookmarked(true);
    }
  };

  return (
    <header className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={goBack}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)]"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={goForward}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)]"
          aria-label="Go forward"
        >
          <ArrowRight size={18} />
        </button>
        <button
          onClick={() => currentUrl && navigate(currentUrl)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)]"
          aria-label="Refresh"
        >
          <RotateCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* URL bar */}
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] focus-within:border-[var(--color-border-focus)] focus-within:ring-2 focus-within:ring-[var(--color-border-focus)]/20 transition-all">
        <Shield size={14} className="text-emerald-500 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter URL..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
        />
        <button
          onClick={handleBookmark}
          className={`p-0.5 transition-colors ${isBookmarked ? 'text-amber-500' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        >
          <Star size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Loading bar */}
      {isLoading && (
        <div
          className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300"
          style={{ width: `${loadingProgress}%` }}
        />
      )}
    </header>
  );
}

export default TopNav;
