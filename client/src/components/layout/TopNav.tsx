import { useState, KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Shield, Star } from 'lucide-react';
import { useProxyStore } from '../../stores/proxyStore';
import { useAppStore } from '../../stores/appStore';

function TopNav() {
  const { currentUrl, goBack, goForward, navigate } = useProxyStore();
  const { setLoadingProgress, isLoading } = useAppStore();
  const [inputValue, setInputValue] = useState(currentUrl);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleSubmit = () => {
    let url = inputValue.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    navigate(url);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
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
          onClick={() => navigate(currentUrl)}
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
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter URL..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
        />
        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`p-0.5 transition-colors ${isBookmarked ? 'text-amber-500' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
          aria-label="Bookmark this page"
        >
          <Star size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Loading bar */}
      {isLoading && (
        <div
          className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300"
          style={{ width: `${LandingProgress}%` }}
        />
      )}
    </header>
  );
}

export default TopNav;
