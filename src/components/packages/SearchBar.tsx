import { useAppStore } from "../../store/appStore";
import { Search, Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { PackageFilter } from "../../types";

export default function SearchBar() {
  const { filter, setFilter, isLoading } = useAppStore();
  const [searchInput, setSearchInput] = useState(filter.search);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter({ search: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setFilter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusOptions = [
    { value: "all", label: "All packages" },
    { value: "installed", label: "Installed only" },
    { value: "notInstalled", label: "Not installed" },
    { value: "upgradable", label: "Upgradable only" },
  ] as const;

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "version", label: "Version" },
    { value: "size", label: "Size" },
    { value: "popularity", label: "Popularity" },
  ] as const;

  const statusLabel = statusOptions.find((o) => o.value === filter.status)?.label || "All packages";
  const sortLabel = sortOptions.find((o) => o.value === filter.sortBy)?.label || "Name";
  const sortDirLabel = filter.sortOrder === "asc" ? "A-Z" : "Z-A";

  return (
    <div className="p-4 border-b border-border space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search packages by name, description, or maintainer..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-text text-sm focus:outline-none focus:border-primary placeholder:text-text-muted"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border text-text-secondary text-sm hover:text-text hover:border-text-muted transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="max-w-20 truncate">{statusLabel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showFilterDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-48 overflow-hidden">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilter({ status: option.value as PackageFilter["status"] });
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-hover ${
                    filter.status === option.value ? "text-primary bg-primary/5" : "text-text"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border text-text-secondary text-sm hover:text-text hover:border-text-muted transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="max-w-20 truncate">{sortLabel}</span>
            <span className="text-xs text-text-muted">{sortDirLabel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-48 overflow-hidden">
              {sortOptions.map((option) => (
                <div key={option.value}>
                  <button
                    onClick={() => {
                      setFilter({ sortBy: option.value as PackageFilter["sortBy"] });
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-hover ${
                      filter.sortBy === option.value ? "text-primary bg-primary/5" : "text-text"
                    }`}
                  >
                    {option.label}
                  </button>
                  {filter.sortBy === option.value && (
                    <div className="flex border-t border-border">
                      <button
                        onClick={() => setFilter({ sortOrder: "asc" })}
                        className={`flex-1 text-left px-4 py-2 text-xs transition-colors hover:bg-surface-hover ${
                          filter.sortOrder === "asc" ? "text-primary" : "text-text-muted"
                        }`}
                      >
                        A-Z
                      </button>
                      <button
                        onClick={() => setFilter({ sortOrder: "desc" })}
                        className={`flex-1 text-left px-4 py-2 text-xs transition-colors hover:bg-surface-hover border-l border-border ${
                          filter.sortOrder === "desc" ? "text-primary" : "text-text-muted"
                        }`}
                      >
                        Z-A
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-text-muted">Loading packages...</div>
      )}
    </div>
  );
}
