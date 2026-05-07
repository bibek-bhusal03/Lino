import { useAppStore } from "../../store/appStore";
import { invoke } from "@tauri-apps/api/core";
import { Settings, RefreshCw, ArrowLeft, Package } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  onChangeManager: () => void;
  onOpenSettings: () => void;
}

export default function TopBar({ onChangeManager, onOpenSettings }: TopBarProps) {
  const { config, setPackages, setLoading, isLoading, addToast } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!config.selectedManager || isLoading) return;
    setIsRefreshing(true);
    setLoading(true);
    try {
      const packages = await invoke<any[]>("list_packages", {
        manager: config.selectedManager,
      });
      setPackages(packages);
      addToast(`Loaded ${packages.length} packages`, "info");
    } catch (error) {
      console.error("Failed to refresh packages:", error);
      addToast("Failed to refresh packages", "error");
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const managerLabels: Record<string, string> = {
    apt: "apt",
    pacman: "pacman",
    yay: "yay",
    paru: "paru",
  };

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-text">Lino</h1>
        </div>

        {config.selectedManager && (
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
            <span className="px-2 py-1 rounded-md bg-background text-xs font-medium text-primary">
              {managerLabels[config.selectedManager]}
            </span>
            <button
              onClick={onChangeManager}
              className="text-text-muted hover:text-text transition-colors"
              title="Change package manager"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || !config.selectedManager}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${
              isRefreshing || !config.selectedManager
                ? "text-text-muted cursor-not-allowed"
                : "text-text hover:bg-surface-hover"
            }
          `}
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-text hover:bg-surface-hover transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </header>
  );
}
