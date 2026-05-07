export type PackageManagerType = "apt" | "pacman" | "yay" | "paru";

export interface PackageInfo {
  name: string;
  description: string;
  version: string;
  installedVersion: string | null;
  size: number;
  installedSize: number | null;
  repository: string;
  maintainer: string;
  homepage: string | null;
  license: string | null;
  dependencies: string[];
  reverseDependencies: string[];
  installedDate: string | null;
  isInstalled: boolean;
  isUpgradable: boolean;
  isHeld: boolean;
  popularity: number | null;
  category: string | null;
}

export interface PackageAction {
  type: "install" | "remove" | "upgrade" | "reinstall" | "hold" | "unhold";
  packageName: string;
}

export interface BulkAction {
  type: "install" | "remove" | "upgrade";
  packages: string[];
}

export interface SystemAction {
  type: "refresh" | "fullUpgrade" | "cleanCache" | "removeOrphans";
}

export interface ExecutionResult {
  success: boolean;
  command: string;
  output: string;
  error: string | null;
}

export interface AppConfig {
  selectedManager: PackageManagerType | null;
  rememberManager: boolean;
  theme: "dark" | "light" | "system";
  autoRefreshInterval: number;
  lastRefresh: string | null;
}

export type PackageFilter = {
  search: string;
  status: "all" | "installed" | "notInstalled" | "upgradable";
  category: string | null;
  sortBy: "name" | "size" | "version" | "popularity";
  sortOrder: "asc" | "desc";
};

export type TabType = "installed" | "upgradable" | "search";
