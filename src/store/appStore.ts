import { create } from "zustand";
import type {
  AppConfig,
  PackageInfo,
  PackageFilter,
  PackageManagerType,
  TabType,
} from "../types";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface AppState {
  config: AppConfig;
  packages: PackageInfo[];
  filteredPackages: PackageInfo[];
  selectedPackage: PackageInfo | null;
  selectedPackages: Set<string>;
  activeTab: TabType;
  filter: PackageFilter;
  isLoading: boolean;
  isExecuting: boolean;
  installingPackage: string | null;
  lastOutput: string | null;
  searchResults: PackageInfo[];
  searchQuery: string;
  toasts: Toast[];

  setConfig: (config: Partial<AppConfig>) => void;
  setPackageManager: (manager: PackageManagerType) => void;
  setPackages: (packages: PackageInfo[]) => void;
  setSelectedPackage: (pkg: PackageInfo | null) => void;
  togglePackageSelection: (name: string) => void;
  clearSelection: () => void;
  selectAll: (names: string[]) => void;
  setActiveTab: (tab: TabType) => void;
  setFilter: (filter: Partial<PackageFilter>) => void;
  setLoading: (loading: boolean) => void;
  setExecuting: (executing: boolean) => void;
  setInstallingPackage: (name: string | null) => void;
  setLastOutput: (output: string | null) => void;
  setSearchResults: (results: PackageInfo[]) => void;
  setSearchQuery: (query: string) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  removeToast: (id: number) => void;
}

const defaultFilter: PackageFilter = {
  search: "",
  status: "all",
  category: null,
  sortBy: "name",
  sortOrder: "asc",
};

const defaultConfig: AppConfig = {
  selectedManager: null,
  rememberManager: false,
  theme: "dark",
  autoRefreshInterval: 0,
  lastRefresh: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  config: defaultConfig,
  packages: [],
  filteredPackages: [],
  selectedPackage: null,
  selectedPackages: new Set<string>(),
  activeTab: "installed",
  filter: defaultFilter,
  isLoading: false,
  isExecuting: false,
  installingPackage: null,
  lastOutput: null,
  searchResults: [],
  searchQuery: "",
  toasts: [],

  setConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),

  setPackageManager: (manager) =>
    set((state) => ({
      config: { ...state.config, selectedManager: manager },
    })),

  setPackages: (packages) => {
    const { filter, activeTab } = get();
    let filtered = packages;

    if (filter.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.maintainer.toLowerCase().includes(search)
      );
    }

    if (filter.status === "installed") {
      filtered = filtered.filter((p) => p.isInstalled);
    } else if (filter.status === "notInstalled") {
      filtered = filtered.filter((p) => !p.isInstalled);
    } else if (filter.status === "upgradable") {
      filtered = filtered.filter((p) => p.isUpgradable);
    }

    if (activeTab === "installed") {
      filtered = filtered.filter((p) => p.isInstalled);
    } else if (activeTab === "upgradable") {
      filtered = filtered.filter((p) => p.isUpgradable);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filter.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "size":
          comparison = (a.installedSize || a.size) - (b.installedSize || b.size);
          break;
        case "version":
          comparison = a.version.localeCompare(b.version);
          break;
        case "popularity":
          comparison = (a.popularity || 0) - (b.popularity || 0);
          break;
      }
      return filter.sortOrder === "desc" ? -comparison : comparison;
    });

    set({ packages, filteredPackages: filtered });
  },

  setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),

  togglePackageSelection: (name) =>
    set((state) => {
      const next = new Set(state.selectedPackages);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return { selectedPackages: next };
    }),

  clearSelection: () => set({ selectedPackages: new Set<string>() }),

  selectAll: (names) => set({ selectedPackages: new Set(names) }),

  setActiveTab: (tab) => {
    const { packages, filter } = get();
    let filtered = packages;

    if (filter.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.maintainer.toLowerCase().includes(search)
      );
    }

    if (tab === "installed") {
      filtered = filtered.filter((p) => p.isInstalled);
    }

    set({ activeTab: tab, filteredPackages: filtered });
  },

  setFilter: (newFilter) => {
    const { packages, activeTab } = get();
    const filter = { ...get().filter, ...newFilter };
    let filtered = packages;

    if (filter.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.maintainer.toLowerCase().includes(search)
      );
    }

    if (filter.status === "installed") {
      filtered = filtered.filter((p) => p.isInstalled);
    } else if (filter.status === "notInstalled") {
      filtered = filtered.filter((p) => !p.isInstalled);
    } else if (filter.status === "upgradable") {
      filtered = filtered.filter((p) => p.isUpgradable);
    }

    if (activeTab === "installed") {
      filtered = filtered.filter((p) => p.isInstalled);
    } else if (activeTab === "upgradable") {
      filtered = filtered.filter((p) => p.isUpgradable);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filter.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "size":
          comparison = (a.installedSize || a.size) - (b.installedSize || b.size);
          break;
        case "version":
          comparison = a.version.localeCompare(b.version);
          break;
        case "popularity":
          comparison = (a.popularity || 0) - (b.popularity || 0);
          break;
      }
      return filter.sortOrder === "desc" ? -comparison : comparison;
    });

    set({ filter, filteredPackages: filtered });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setExecuting: (executing) => set({ isExecuting: executing }),

  setInstallingPackage: (name) => set({ installingPackage: name }),

  setLastOutput: (output) => set({ lastOutput: output }),

  setSearchResults: (results) => set({ searchResults: results }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  addToast: (message, type) => {
    const id = Date.now();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
