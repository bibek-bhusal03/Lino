import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { invoke } from "@tauri-apps/api/core";
import { Loader2, History, Clock, Package } from "lucide-react";

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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const visibleResults = searchResults.slice(0, displayedCount);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-zinc-800/50">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim() && history.length > 0) setShowHistory(false);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
            onFocus={() => { if (!query.trim() && history.length > 0) setShowHistory(true); }}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder="Search for packages by name or description..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/30 placeholder:text-zinc-600 transition-all"
            autoFocus
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
          ) : (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Search history"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {showHistory && history.length > 0 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
                <span className="text-xs font-medium text-zinc-500">Recent Searches</span>
                <button onClick={handleClearHistory} className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer">
                  Clear all
                </button>
              </div>
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <Clock className="w-3 h-3 text-zinc-600 shrink-0" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {isSearching && query.trim() && (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2.5" />
            Searching...
          </div>
        )}

        {!isSearching && query.trim() && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <Package className="w-10 h-10 mb-4 opacity-40" />
            <p className="text-base font-medium">No packages found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <Package className="w-14 h-14 mb-4 opacity-30" />
            <p className="text-base font-medium">Search for packages</p>
            <p className="text-sm mt-1">Type to search across all repositories</p>
            {history.length > 0 && (
              <div className="mt-5 w-full max-w-sm">
                <p className="text-xs font-medium text-zinc-500 mb-2.5 text-center">Recent searches</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {history.slice(0, 5).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleHistoryClick(item)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-800 text-xs text-zinc-500 hover:text-blue-400 hover:border-zinc-600 transition-all cursor-pointer"
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
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800/50">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-28">
                  Version
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-24">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleResults.map((pkg) => (
                <tr
                  key={pkg.name}
                  onClick={() => setSelectedPackage(pkg)}
                  className="border-b border-zinc-800/30 cursor-pointer transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium text-zinc-200">{pkg.name}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-zinc-500 line-clamp-1">{pkg.description || "-"}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-zinc-500 font-mono">{pkg.version || "N/A"}</span>
                  </td>
                  <td className="px-5 py-3">
                    {pkg.isInstalled ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400">Installed</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/50 text-zinc-600">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {displayedCount < searchResults.length && (
          <div className="py-4 text-center text-zinc-600 text-sm">
            Scroll to load more ({searchResults.length - displayedCount} remaining)
          </div>
        )}
      </div>
    </div>
  );
}
