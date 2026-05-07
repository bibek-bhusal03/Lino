import { useAppStore } from "../../store/appStore";
import { invoke } from "@tauri-apps/api/core";
import { Download, Trash2, RefreshCw, X, Loader2 } from "lucide-react";
import { useState } from "react";

export default function BulkActionBar() {
  const {
    selectedPackages,
    clearSelection,
    config,
    setPackages,
    setExecuting,
    addToast,
  } = useAppStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingAction, setExecutingAction] = useState<"install" | "remove" | "upgrade" | null>(null);
  const [executedCount, setExecutedCount] = useState(0);

  if (selectedPackages.length === 0) return null;

  const handleBulkInstall = async () => {
    if (!config.selectedManager) return;
    setIsExecuting(true);
    setExecuting(true);
    setExecutingAction("install");
    setExecutedCount(0);
    try {
      const results: any[] = [];
      for (let i = 0; i < selectedPackages.length; i++) {
        const result = await invoke<any>("install_package", {
          manager: config.selectedManager,
          name: selectedPackages[i],
        });
        results.push(result);
        setExecutedCount(i + 1);
      }
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        addToast(`${succeeded} package(s) installed`, "success");
      } else {
        addToast(`${succeeded} succeeded, ${failed} failed`, "error");
      }
      const packages = await invoke<any[]>("list_packages", {
        manager: config.selectedManager,
      });
      setPackages(packages);
      clearSelection();
    } catch (error) {
      console.error("Failed to bulk install:", error);
      addToast("Bulk install failed", "error");
    } finally {
      setIsExecuting(false);
      setExecuting(false);
      setExecutingAction(null);
      setExecutedCount(0);
    }
  };

  const handleBulkRemove = async () => {
    if (!config.selectedManager) return;
    setIsExecuting(true);
    setExecuting(true);
    setExecutingAction("remove");
    setExecutedCount(0);
    try {
      const results: any[] = [];
      for (let i = 0; i < selectedPackages.length; i++) {
        const result = await invoke<any>("remove_package", {
          manager: config.selectedManager,
          name: selectedPackages[i],
          purge: false,
        });
        results.push(result);
        setExecutedCount(i + 1);
      }
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        addToast(`${succeeded} package(s) removed`, "success");
      } else {
        addToast(`${succeeded} succeeded, ${failed} failed`, "error");
      }
      const packages = await invoke<any[]>("list_packages", {
        manager: config.selectedManager,
      });
      setPackages(packages);
      clearSelection();
    } catch (error) {
      console.error("Failed to bulk remove:", error);
      addToast("Bulk remove failed", "error");
    } finally {
      setIsExecuting(false);
      setExecuting(false);
      setExecutingAction(null);
      setExecutedCount(0);
    }
  };

  const handleBulkUpgrade = async () => {
    if (!config.selectedManager) return;
    setIsExecuting(true);
    setExecuting(true);
    setExecutingAction("upgrade");
    setExecutedCount(0);
    try {
      const results: any[] = [];
      for (let i = 0; i < selectedPackages.length; i++) {
        const result = await invoke<any>("upgrade_package", {
          manager: config.selectedManager,
          name: selectedPackages[i],
        });
        results.push(result);
        setExecutedCount(i + 1);
      }
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) {
        addToast(`${succeeded} package(s) upgraded`, "success");
      } else {
        addToast(`${succeeded} succeeded, ${failed} failed`, "error");
      }
      const packages = await invoke<any[]>("list_packages", {
        manager: config.selectedManager,
      });
      setPackages(packages);
      clearSelection();
    } catch (error) {
      console.error("Failed to bulk upgrade:", error);
      addToast("Bulk upgrade failed", "error");
    } finally {
      setIsExecuting(false);
      setExecuting(false);
      setExecutingAction(null);
      setExecutedCount(0);
    }
  };

  return (
    <div className="bg-primary/10 border-t border-primary/20 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-primary">
          {selectedPackages.length} package{selectedPackages.length > 1 ? "s" : ""} selected
        </span>
        <button
          onClick={clearSelection}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        {isExecuting ? (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            {executingAction === "install" && `Installing ${executedCount}/${selectedPackages.length}...`}
            {executingAction === "remove" && `Removing ${executedCount}/${selectedPackages.length}...`}
            {executingAction === "upgrade" && `Upgrading ${executedCount}/${selectedPackages.length}...`}
          </div>
        ) : (
          <>
            <button
              onClick={handleBulkInstall}
              disabled={isExecuting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-background text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
            <button
              onClick={handleBulkRemove}
              disabled={isExecuting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-danger hover:bg-danger/90 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
            <button
              onClick={handleBulkUpgrade}
              disabled={isExecuting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success hover:bg-success/90 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              Upgrade
            </button>
          </>
        )}
      </div>
    </div>
  );
}
