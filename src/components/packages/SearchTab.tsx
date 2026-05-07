import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { invoke } from "@tauri-apps/api/core";
import { Search, Loader2, History, Clock } from "lucide-react";

const PAGE_SIZE = 20;
const MAX_HISTORY = 10;
const HISTORY_KEY = "lino-search-history";

function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return;
  const history = getSearchHistory();
  const filtered = history.filter((q) => q.toLowerCase() !== trimmed);
  filtered.unshift(trimmed);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
}

function clearSearchHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export default function SearchTab() {
  const { config, searchResults, setSearchResults, setSelectedPackage, setLoading, setSearchQuery } =
    useAppStore();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const performSearch = useCallback(async (searchQuery: string, searchId: number) => {
    if (!config.selectedManager || !searchQuery.trim()) {
      setSearchResults([]);
      setDisplayedCount(PAGE_SIZE);
      return;
    }
    setIsSearching(true);
    setLoading(true);
    setDisplayedCount(PAGE_SIZE);
    try {
      const results = await invoke<any[]>("search_packages", {
        manager: config.selectedManager,
        query: searchQuery.trim(),
      });
      if (searchId === searchIdRef.current) {
        const validResults = results.filter((p) => p.name && p.name.trim());
        setSearchResults(validResults);
      }
    } catch (error) {
      if (searchId === searchIdRef.current) {
        console.error("Failed to search packages:", error);
        setSearchResults([]);
      }
    } finally {
      if (searchId === searchIdRef.current) {
        setIsSearching(false);
        setLoading(false);
      }
    }
  }, [config.selectedManager, setSearchResults, setLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(query);
      if (query.trim()) {
        searchIdRef.current += 1;
        performSearch(query, searchIdRef.current);
      } else {
        setSearchResults([]);
        setIsSearching(false);
        setLoading(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [query, performSearch, setSearchResults, setSearchQuery, setLoading]);

  const handleSearchSubmit = () => {
    if (query.trim()) {
      saveSearchHistory(query);
      setHistory(getSearchHistory());
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (item: string) => {
    setQuery(item);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
    setShowHistory(false);
  };

  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        if (displayedCount < searchResults.length) {
          setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, searchResults.length));
        }
      }
    });
  }, [displayedCount, searchResults.length]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const visibleResults = searchResults.slice(0, displayedCount);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim() && history.length > 0) {
                setShowHistory(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchSubmit();
              }
            }}
            onFocus={() => {
              if (!query.trim() && history.length > 0) {
                setShowHistory(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowHistory(false), 200);
            }}
            placeholder="Search for packages by name or description..."
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-background border border-border text-text text-sm focus:outline-none focus:border-primary placeholder:text-text-muted"
            autoFocus
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
          ) : (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
              title="Search history"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {showHistory && history.length > 0 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-medium text-text-muted">Recent Searches</span>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-text-muted hover:text-danger transition-colors"
                >
                  Clear all
                </button>
              </div>
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-2"
                >
                  <Clock className="w-3 h-3 text-text-muted shrink-0" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {isSearching && query.trim() && (
          <div className="flex items-center justify-center py-20 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Searching...
          </div>
        )}

        {!isSearching && query.trim() && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No packages found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Search className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Search for packages</p>
            <p className="text-sm mt-1">Type to search across all repositories</p>
            {history.length > 0 && (
              <div className="mt-4 w-full max-w-sm">
                <p className="text-xs font-medium text-text-muted mb-2">Recent searches</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {history.slice(0, 5).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleHistoryClick(item)}
                      className="px-2 py-1 rounded-md bg-background border border-border text-xs text-text-secondary hover:text-primary hover:border-primary transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {visibleResults.length > 0 && (
          <table className="w-full">
            <thead className="sticky top-0 bg-surface border-b border-border z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-28">
                  Version
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleResults.map((pkg) => (
                <tr
                  key={pkg.name}
                  onClick={() => setSelectedPackage(pkg)}
                  className="border-b border-border/50 cursor-pointer transition-colors hover:bg-surface-hover"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-text">
                      {pkg.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary line-clamp-1">
                      {pkg.description}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-muted font-mono">
                      {pkg.version || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {pkg.isInstalled ? (
                      <span className="text-xs text-success">Installed</span>
                    ) : (
                      <span className="text-xs text-text-muted">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {displayedCount < searchResults.length && (
          <div className="py-4 text-center text-text-muted text-sm">
            Scroll to load more ({searchResults.length - displayedCount} remaining)
          </div>
        )}
      </div>
    </div>
  );
}
