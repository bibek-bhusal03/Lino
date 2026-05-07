import { useAppStore } from "../../store/appStore";
import { invoke } from "@tauri-apps/api/core";
import {
  X,
  ExternalLink,
  HardDrive,
  Package,
  GitBranch,
  Trash2,
  Download,
  RefreshCw,
  Copy,
  Terminal,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface PackageHistoryEntry {
  timestamp: string;
  action: string;
  oldVersion: string | null;
  newVersion: string | null;
}

export default function DetailPanel() {
  const { selectedPackage, setSelectedPackage, config, setPackages, installingPackage, setInstallingPackage, addToast } =
    useAppStore();
  const [rawInfo, setRawInfo] = useState("");
  const [showRawInfo, setShowRawInfo] = useState(false);
  const [history, setHistory] = useState<PackageHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!selectedPackage || !config.selectedManager) {
      setRawInfo("");
      setShowRawInfo(false);
      setHistory([]);
      setShowHistory(false);
      return;
    }

    const fetchData = async () => {
      try {
        const raw = await invoke<string>(
          selectedPackage.isInstalled ? "get_package_info_raw" : "get_package_info_raw_available",
          {
            manager: config.selectedManager,
            name: selectedPackage.name,
          }
        );
        setRawInfo(raw);
        setShowRawInfo(true);
      } catch (error) {
        console.error("Failed to fetch package info:", error);
        setRawInfo("Failed to load package info.");
        setShowRawInfo(true);
      }

      try {
        const hist = await invoke<PackageHistoryEntry[]>("get_package_history", {
          manager: config.selectedManager,
          name: selectedPackage.name,
        });
        if (hist.length > 0) {
          setHistory(hist);
        }
      } catch (error) {
        console.error("Failed to fetch package history:", error);
      }
    };

    fetchData();
  }, [selectedPackage, config.selectedManager]);

  if (!selectedPackage) return null;

  const pkg = selectedPackage;
  const manager = config.selectedManager;

  const refreshPackages = async () => {
    if (!manager) return;
    try {
      const packages = await invoke<any[]>("list_packages", { manager });
      setPackages(packages);
    } catch (error) {
      console.error("Failed to refresh packages:", error);
    }
  };

  const handleInstall = async () => {
    if (!manager) return;
    setInstallingPackage(pkg.name);
    try {
      const result = await invoke<any>("install_package", {
        manager,
        name: pkg.name,
      });
      if (result.success) {
        addToast(`${pkg.name} installed successfully`, "success");
      } else {
        addToast(`Failed to install ${pkg.name}: ${result.error || "unknown error"}`, "error");
      }
      await refreshPackages();
    } catch (error) {
      console.error("Failed to install:", error);
      addToast(`Failed to install ${pkg.name}`, "error");
    } finally {
      setInstallingPackage(null);
    }
  };

  const handleRemove = async () => {
    if (!manager) return;
    setInstallingPackage(pkg.name);
    try {
      const result = await invoke<any>("remove_package", {
        manager,
        name: pkg.name,
        purge: false,
      });
      if (result.success) {
        addToast(`${pkg.name} removed successfully`, "success");
      } else {
        addToast(`Failed to remove ${pkg.name}: ${result.error || "unknown error"}`, "error");
      }
      await refreshPackages();
    } catch (error) {
      console.error("Failed to remove:", error);
      addToast(`Failed to remove ${pkg.name}`, "error");
    } finally {
      setInstallingPackage(null);
    }
  };

  const handleUpgrade = async () => {
    if (!manager) return;
    setInstallingPackage(pkg.name);
    try {
      const result = await invoke<any>("upgrade_package", {
        manager,
        name: pkg.name,
      });
      if (result.success) {
        addToast(`${pkg.name} upgraded successfully`, "success");
      } else {
        addToast(`Failed to upgrade ${pkg.name}: ${result.error || "unknown error"}`, "error");
      }
      await refreshPackages();
    } catch (error) {
      console.error("Failed to upgrade:", error);
      addToast(`Failed to upgrade ${pkg.name}`, "error");
    } finally {
      setInstallingPackage(null);
    }
  };

  const handleCopyCommand = () => {
    let cmd = "";
    if (pkg.isInstalled) {
      if (manager === "apt") cmd = `sudo apt remove ${pkg.name}`;
      else cmd = `${manager} -R ${pkg.name}`;
    } else {
      if (manager === "apt") cmd = `sudo apt install ${pkg.name}`;
      else cmd = `${manager} -S ${pkg.name}`;
    }
    navigator.clipboard.writeText(cmd);
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="w-96 bg-surface border-l border-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text truncate">{pkg.name}</h2>
          {pkg.description && (
            <p className="text-sm text-text-secondary mt-1">{pkg.description}</p>
          )}
        </div>
        <button
          onClick={() => setSelectedPackage(null)}
          className="text-text-muted hover:text-text transition-colors ml-2 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            {pkg.version && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-text-muted shrink-0" />
                <span className="text-text-muted shrink-0">Version:</span>
                <span className="text-text truncate">{pkg.version}</span>
              </div>
            )}

            {pkg.installedVersion && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-text-muted shrink-0" />
                <span className="text-text-muted shrink-0">Installed:</span>
                <span className="text-success truncate">{pkg.installedVersion}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted shrink-0">Repo:</span>
              <span className="text-text truncate">{pkg.repository}</span>
            </div>

            {pkg.installedSize && (
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4 text-text-muted shrink-0" />
                <span className="text-text-muted shrink-0">Size:</span>
                <span className="text-text">{formatSize(pkg.installedSize)}</span>
              </div>
            )}

            {pkg.homepage && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4 text-text-muted shrink-0" />
                <a
                  href={pkg.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  Homepage
                </a>
              </div>
            )}

            {pkg.dependencies.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-text-muted shrink-0" />
                  Dependencies ({pkg.dependencies.length})
                </h3>
                <div className="flex flex-wrap gap-1">
                  {pkg.dependencies.slice(0, 12).map((dep) => (
                    <span
                      key={dep}
                      className="text-xs px-2 py-1 rounded-md bg-background text-text-secondary"
                    >
                      {dep}
                    </span>
                  ))}
                  {pkg.dependencies.length > 12 && (
                    <span className="text-xs px-2 py-1 rounded-md bg-background text-text-muted">
                      +{pkg.dependencies.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {pkg.reverseDependencies.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-text-muted shrink-0 rotate-180" />
                  Required By ({pkg.reverseDependencies.length})
                </h3>
                <div className="flex flex-wrap gap-1">
                  {pkg.reverseDependencies.slice(0, 8).map((dep) => (
                    <span
                      key={dep}
                      className="text-xs px-2 py-1 rounded-md bg-background text-text-secondary"
                    >
                      {dep}
                    </span>
                  ))}
                  {pkg.reverseDependencies.length > 8 && (
                    <span className="text-xs px-2 py-1 rounded-md bg-background text-text-muted">
                      +{pkg.reverseDependencies.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {showRawInfo && rawInfo && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-text-muted" />
                  Package Info
                </h3>
                <button
                  onClick={() => navigator.clipboard.writeText(rawInfo)}
                  className="text-text-muted hover:text-text transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="bg-background border border-border rounded-lg p-3 max-h-64 overflow-y-auto">
                <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                  {rawInfo}
                </pre>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between mb-2 text-sm font-semibold text-text hover:text-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-text-muted" />
                  History ({history.length})
                </span>
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showHistory && (
                <div className="bg-background border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {history.map((entry, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${
                          entry.action === "installed" ? "bg-success/20 text-success" :
                          entry.action === "upgraded" ? "bg-primary/20 text-primary" :
                          entry.action === "removed" ? "bg-danger/20 text-danger" :
                          entry.action === "downgraded" ? "bg-warning/20 text-warning" :
                          "bg-text-muted/20 text-text-muted"
                        }`}>
                          {entry.action}
                        </span>
                        <span className="text-text-muted truncate">{entry.timestamp}</span>
                      </div>
                      {(entry.oldVersion || entry.newVersion) && (
                        <div className="text-text-secondary mt-0.5 font-mono">
                          {entry.oldVersion && entry.newVersion ? (
                            <>{entry.oldVersion} → {entry.newVersion}</>
                          ) : entry.newVersion ? (
                            <>{entry.newVersion}</>
                          ) : entry.oldVersion ? (
                            <>{entry.oldVersion}</>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={handleCopyCommand}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface-hover border border-border text-text-secondary hover:text-text font-medium transition-colors text-sm"
        >
          <Copy className="w-4 h-4" />
          Copy Command
        </button>

        {!pkg.isInstalled ? (
          <button
            onClick={handleInstall}
            disabled={!!installingPackage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-background font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {installingPackage === pkg.name ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Installing…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Install
              </>
            )}
          </button>
        ) : (
          <>
            {pkg.isUpgradable && (
              <button
                onClick={handleUpgrade}
                disabled={!!installingPackage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-success hover:bg-success/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {installingPackage === pkg.name ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Upgrading…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Upgrade to {pkg.version}
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleRemove}
              disabled={!!installingPackage}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-danger hover:bg-danger/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {installingPackage === pkg.name ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Remove
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
