import { useAppStore } from "../../store/appStore";
import { invoke } from "@tauri-apps/api/core";
import { Settings, RefreshCw, ArrowLeft } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  onChangeManager: () => void;
  onOpenSettings: () => void;
}

const managerColors: Record<string, string> = {
  apt: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pacman: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  yay: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  paru: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

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

  return (
    <header className="h-14 bg-[#0c0e12] border-b border-zinc-800/50 flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm shadow-blue-500/20">
            L
          </div>
          <h1 className="text-base font-semibold tracking-tight">Lino</h1>
        </div>

        {config.selectedManager && (
          <div className="flex items-center gap-2.5 pl-4 border-l border-zinc-800">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border ${managerColors[config.selectedManager] || ""}`}>
              {config.selectedManager}
            </span>
            <button
              onClick={onChangeManager}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all cursor-pointer"
              title="Change package manager"
            >
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || !config.selectedManager}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>
    </header>
  );
}
