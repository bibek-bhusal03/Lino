import { useAppStore } from "../../store/appStore";
import { invoke } from "@tauri-apps/api/core";
import { Download, Trash2, RefreshCw, X, Loader2 } from "lucide-react";
import { useState } from "react";
import Button from "../ui/Button";

export default function BulkActionBar() {
  const { selectedPackages, clearSelection, config, setPackages, setExecuting, addToast } = useAppStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingAction, setExecutingAction] = useState<"install" | "remove" | "upgrade" | null>(null);
  const [executedCount, setExecutedCount] = useState(0);

  if (selectedPackages.size === 0) return null;

  const selectedPackageNames = Array.from(selectedPackages);

  const executeAction = async (
    action: "install" | "remove" | "upgrade",
    invokeFn: (name: string) => Promise<any>
  ) => {
    if (!config.selectedManager) return;
    setIsExecuting(true);
    setExecuting(true);
    setExecutingAction(action);
    setExecutedCount(0);
    try {
      const results: any[] = [];
      for (let i = 0; i < selectedPackageNames.length; i++) {
        const result = await invokeFn(selectedPackageNames[i]);
        results.push(result);
        setExecutedCount(i + 1);
      }
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      if (failed === 0) addToast(`${succeeded} package(s) ${action}ed`, "success");
      else addToast(`${succeeded} succeeded, ${failed} failed`, "error");

      const packages = await invoke<any[]>("list_packages", { manager: config.selectedManager });
      setPackages(packages);
      clearSelection();
    } catch (error) {
      console.error(`Failed to bulk ${action}:`, error);
      addToast(`Bulk ${action} failed`, "error");
    } finally {
      setIsExecuting(false);
      setExecuting(false);
      setExecutingAction(null);
      setExecutedCount(0);
    }
  };

  const progress = selectedPackageNames.length > 0 ? (executedCount / selectedPackageNames.length) * 100 : 0;

  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800/50 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-200">
          {selectedPackageNames.length} package{selectedPackageNames.length > 1 ? "s" : ""} selected
        </span>
        <button
          onClick={clearSelection}
          disabled={isExecuting}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        {isExecuting && executingAction && (
          <div className="flex items-center gap-3 mr-3">
            <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
              {executedCount}/{selectedPackageNames.length}
            </span>
          </div>
        )}

        {isExecuting ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            {executingAction === "install" && "Installing..."}
            {executingAction === "remove" && "Removing..."}
            {executingAction === "upgrade" && "Upgrading..."}
          </div>
        ) : (
          <>
            <Button
              onClick={() => executeAction("install", (name) => invoke<any>("install_package", { manager: config.selectedManager, name }))}
              icon={<Download className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Install
            </Button>
            <Button
              onClick={() => executeAction("remove", (name) => invoke<any>("remove_package", { manager: config.selectedManager, name, purge: false }))}
              icon={<Trash2 className="w-4 h-4" />}
              variant="danger"
            >
              Remove
            </Button>
            <Button
              onClick={() => executeAction("upgrade", (name) => invoke<any>("upgrade_package", { manager: config.selectedManager, name }))}
              icon={<RefreshCw className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Upgrade
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
