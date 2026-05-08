import { useAppStore } from "../../store/appStore";
import { Filter, ArrowUpDown, ChevronDown, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { PackageFilter } from "../../types";

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
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDropdown(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusLabel = statusOptions.find((o) => o.value === filter.status)?.label || "All packages";
  const sortLabel = sortOptions.find((o) => o.value === filter.sortBy)?.label || "Name";

  return (
    <div className="px-5 py-3 border-b border-zinc-800/50">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, description, or maintainer"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-2.5 pl-4 pr-10 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/30 placeholder:text-zinc-600"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            <span>{statusLabel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-full min-w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilter({ status: option.value as PackageFilter["status"] });
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-zinc-800/50 ${
                    filter.status === option.value ? "text-blue-400 bg-blue-500/10" : "text-zinc-400"
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
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all whitespace-nowrap"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{sortLabel}</span>
            <span className="text-[11px] text-zinc-600 font-medium">{filter.sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-full min-w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
              {sortOptions.map((option) => (
                <div key={option.value}>
                  <button
                    onClick={() => setFilter({ sortBy: option.value as PackageFilter["sortBy"] })}
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-zinc-800/50 ${
                      filter.sortBy === option.value ? "text-blue-400 bg-blue-500/10" : "text-zinc-400"
                    }`}
                  >
                    {option.label}
                  </button>
                  {filter.sortBy === option.value && (
                    <div className="flex border-t border-zinc-800">
                      <button
                        onClick={() => setFilter({ sortOrder: "asc" })}
                        className={`flex-1 text-center px-4 py-2 text-xs font-medium transition hover:bg-zinc-800/50 ${
                          filter.sortOrder === "asc" ? "text-blue-400" : "text-zinc-600"
                        }`}
                      >
                        A-Z
                      </button>
                      <button
                        onClick={() => setFilter({ sortOrder: "desc" })}
                        className={`flex-1 text-center px-4 py-2 text-xs font-medium transition hover:bg-zinc-800/50 border-l border-zinc-800 ${
                          filter.sortOrder === "desc" ? "text-blue-400" : "text-zinc-600"
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
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
          <div className="w-3 h-3 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          Loading packages...
        </div>
      )}
    </div>
  );
}
