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
  Box,
  Calendar,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";

interface PackageHistoryEntry {
  timestamp: string;
  action: string;
  oldVersion: string | null;
  newVersion: string | null;
}

const actionColors: Record<string, string> = {
  installed: "bg-emerald-500/10 text-emerald-400",
  upgraded: "bg-blue-500/10 text-blue-400",
  removed: "bg-red-500/10 text-red-400",
  downgraded: "bg-amber-500/10 text-amber-400",
};

export default function DetailPanel() {
  const { selectedPackage, setSelectedPackage, config, setPackages, installingPackage, setInstallingPackage, addToast } = useAppStore();
  const [rawInfo, setRawInfo] = useState("");
  const [showRawInfo, setShowRawInfo] = useState(false);
  const [history, setHistory] = useState<PackageHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!selectedPackage || !config.selectedManager) {
      setRawInfo(""); setShowRawInfo(false); setHistory([]); setShowHistory(false);
      return;
    }
    const fetchData = async () => {
      try {
        const raw = await invoke<string>(
          selectedPackage.isInstalled ? "get_package_info_raw" : "get_package_info_raw_available",
          { manager: config.selectedManager, name: selectedPackage.name }
        );
        setRawInfo(raw); setShowRawInfo(true);
      } catch { setRawInfo("Failed to load package info."); setShowRawInfo(true); }
      try {
        const hist = await invoke<PackageHistoryEntry[]>("get_package_history", { manager: config.selectedManager, name: selectedPackage.name });
        if (hist.length > 0) setHistory(hist);
      } catch {}
    };
    fetchData();
  }, [selectedPackage, config.selectedManager]);

  if (!selectedPackage) return null;

  const pkg = selectedPackage;
  const manager = config.selectedManager;

  const refreshPackages = async () => {
    if (!manager) return;
    try { setPackages(await invoke<any[]>("list_packages", { manager })); }
    catch {}
  };

  const handleInstall = async () => {
    if (!manager) return;
    setInstallingPackage(pkg.name);
    try {
      const result = await invoke<any>("install_package", { manager, name: pkg.name });
      addToast(result.success ? `${pkg.name} installed successfully` : `Failed to install ${pkg.name}`, result.success ? "success" : "error");
      await refreshPackages();
    } catch { addToast(`Failed to install ${pkg.name}`, "error"); }
    finally { setInstallingPackage(null); }
  };

  const handleRemove = async () => {
    if (!manager) return;
    setInstallingPackage(pkg.name);
    try {
      const result = await invoke<any>("remove_package", { manager, name: pkg.name, purge: false });
      addToast(result.success ? `${pkg.name} removed successfully` : `Failed to remove ${pkg.name}`, result.success ? "success" : "error");
      await refreshPackages();
    } catch { addToast(`Failed to remove ${pkg.name}`, "error"); }
    finally { setInstallingPackage(null); }
  };

  const handleUpgrade = async () => {
    if (!manager) return;
    setInstallingPackage(pkg.name);
    try {
      const result = await invoke<any>("upgrade_package", { manager, name: pkg.name });
      addToast(result.success ? `${pkg.name} upgraded successfully` : `Failed to upgrade ${pkg.name}`, result.success ? "success" : "error");
      await refreshPackages();
    } catch { addToast(`Failed to upgrade ${pkg.name}`, "error"); }
    finally { setInstallingPackage(null); }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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

  return (
    <div className="w-96 bg-zinc-900/50 border-l border-zinc-800/50 flex flex-col overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-zinc-800/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-zinc-200 truncate">{pkg.name}</h2>
            {pkg.description && (
              <p className="text-sm text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{pkg.description}</p>
            )}
          </div>
          <button onClick={() => setSelectedPackage(null)} className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all ml-3 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {pkg.isInstalled && pkg.isUpgradable && (
          <button
            onClick={handleUpgrade}
            disabled={!!installingPackage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {installingPackage === pkg.name ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Upgrading...</>
            ) : (
              <><RefreshCw className="w-4 h-4" />Upgrade to {pkg.version}</>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <Package className="w-4 h-4 text-zinc-600 shrink-0" />
              <span className="text-zinc-600 text-xs w-20 shrink-0">Version</span>
              <span className="text-zinc-300">{pkg.version}</span>
            </div>

            {pkg.installedVersion && (
              <div className="flex items-center gap-2.5 text-sm">
                <Box className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="text-zinc-600 text-xs w-20 shrink-0">Installed</span>
                <span className="text-emerald-400">{pkg.installedVersion}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 text-sm">
              <HardDrive className="w-4 h-4 text-zinc-600 shrink-0" />
              <span className="text-zinc-600 text-xs w-20 shrink-0">Repository</span>
              <span className="text-zinc-400">{pkg.repository}</span>
            </div>

            {pkg.installedSize && (
              <div className="flex items-center gap-2.5 text-sm">
                <HardDrive className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="text-zinc-600 text-xs w-20 shrink-0">Size</span>
                <span className="text-zinc-300">{formatSize(pkg.installedSize)}</span>
              </div>
            )}

            {pkg.installedDate && (
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="text-zinc-600 text-xs w-20 shrink-0">Installed</span>
                <span className="text-zinc-400">{pkg.installedDate}</span>
              </div>
            )}

            {pkg.maintainer && (
              <div className="flex items-center gap-2.5 text-sm">
                <User className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="text-zinc-600 text-xs w-20 shrink-0">Packager</span>
                <span className="text-zinc-400 truncate">{pkg.maintainer}</span>
              </div>
            )}

            {pkg.homepage && (
              <div className="flex items-center gap-2.5 text-sm">
                <ExternalLink className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="text-zinc-600 text-xs w-20 shrink-0">Homepage</span>
                <a href={pkg.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                  {pkg.homepage.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            {pkg.license && (
              <div className="flex items-center gap-2.5 text-sm">
                <span className="text-zinc-600 text-xs w-20 shrink-0 pl-6">License</span>
                <span className="text-zinc-400">{pkg.license}</span>
              </div>
            )}
          </div>

          {pkg.dependencies.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5" />
                Dependencies ({pkg.dependencies.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {pkg.dependencies.slice(0, 12).map((dep) => (
                  <span key={dep} className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/60 text-zinc-400 border border-zinc-800">
                    {dep}
                  </span>
                ))}
                {pkg.dependencies.length > 12 && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/30 text-zinc-600 border border-zinc-800/50">
                    +{pkg.dependencies.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}

          {pkg.reverseDependencies.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 rotate-180" />
                Required By ({pkg.reverseDependencies.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {pkg.reverseDependencies.slice(0, 8).map((dep) => (
                  <span key={dep} className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/60 text-zinc-400 border border-zinc-800">
                    {dep}
                  </span>
                ))}
                {pkg.reverseDependencies.length > 8 && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/30 text-zinc-600 border border-zinc-800/50">
                    +{pkg.reverseDependencies.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={handleCopyCommand}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 font-medium transition-all text-sm cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy Command
            </button>
          </div>

          {showRawInfo && rawInfo && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  Package Info
                </h3>
                <button onClick={() => navigator.clipboard.writeText(rawInfo)} className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" title="Copy">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 max-h-64 overflow-y-auto">
                <pre className="text-xs text-zinc-500 whitespace-pre-wrap font-mono leading-relaxed">{rawInfo}</pre>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  History ({history.length})
                </span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHistory && (
                <div className="mt-2.5 bg-zinc-900 border border-zinc-800 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {history.map((entry, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${actionColors[entry.action] || "bg-zinc-800 text-zinc-500"}`}>
                          {entry.action}
                        </span>
                        <span className="text-zinc-600 truncate">{entry.timestamp}</span>
                      </div>
                      {(entry.oldVersion || entry.newVersion) && (
                        <div className="text-zinc-500 mt-0.5 font-mono ml-0.5">
                          {entry.oldVersion && entry.newVersion
                            ? <>{entry.oldVersion} <span className="text-zinc-700">→</span> {entry.newVersion}</>
                            : entry.newVersion
                            ? <>{entry.newVersion}</>
                            : <>{entry.oldVersion}</>}
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

      <div className="px-5 py-4 border-t border-zinc-800/50 space-y-2">
        {!pkg.isInstalled ? (
          <button
            onClick={handleInstall}
            disabled={!!installingPackage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {installingPackage === pkg.name ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Installing...</>
            ) : (
              <><Download className="w-4 h-4" />Install</>
            )}
          </button>
        ) : (
          <button
            onClick={handleRemove}
            disabled={!!installingPackage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all shadow-sm shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {installingPackage === pkg.name ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Removing...</>
            ) : (
              <><Trash2 className="w-4 h-4" />Remove</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
