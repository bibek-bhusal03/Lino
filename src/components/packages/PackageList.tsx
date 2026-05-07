import { useAppStore } from "../../store/appStore";
import { PackageInfo } from "../../types";
import { Check, Download, ArrowUpCircle, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

interface PackageListProps {
  packages: PackageInfo[];
}

export default function PackageList({ packages }: PackageListProps) {
  const {
    selectedPackage,
    setSelectedPackage,
    selectedPackages,
    togglePackageSelection,
    config,
    setPackages,
    addToast,
    installingPackage,
    setInstallingPackage,
  } = useAppStore();
  const [upgradingPkg, setUpgradingPkg] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      useAppStore.getState().selectAll(packages.map((p) => p.name));
      addToast(`${packages.length} packages selected`, "info");
    } else {
      useAppStore.getState().clearSelection();
    }
  };

  const handleUpgrade = async (name: string) => {
    if (!config.selectedManager || upgradingPkg) return;
    setUpgradingPkg(name);
    setInstallingPackage(name);
    try {
      const result = await invoke<any>("upgrade_package", {
        manager: config.selectedManager,
        name,
      });
      if (result.success) {
        addToast(`${name} upgraded successfully`, "success");
      } else {
        addToast(`Failed to upgrade ${name}: ${result.error || "unknown error"}`, "error");
      }
      const updatedPackages = await invoke<any[]>("list_packages", {
        manager: config.selectedManager,
      });
      setPackages(updatedPackages);
    } catch (error) {
      console.error("Failed to upgrade:", error);
      addToast(`Failed to upgrade ${name}`, "error");
    } finally {
      setUpgradingPkg(null);
      setInstallingPackage(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-surface border-b border-border z-10">
          <tr>
            <th className="w-10 px-4 py-3 text-left">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border bg-background"
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-24">
              Version
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-24">
              Size
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-24">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => {
            const isSelected = selectedPackage?.name === pkg.name;
            const isBulkSelected = selectedPackages.includes(pkg.name);
            return (
              <tr
                key={pkg.name}
                onClick={() => setSelectedPackage(pkg)}
                className={`
                  border-b border-border/50 cursor-pointer transition-colors
                  ${isSelected ? "bg-primary/5" : "hover:bg-surface-hover"}
                  ${isBulkSelected ? "bg-primary/10" : ""}
                `}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isBulkSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      togglePackageSelection(pkg.name);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-border bg-background"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-text">
                    {pkg.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-text-secondary line-clamp-1">
                    {pkg.description}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-text-muted font-mono">
                    {pkg.version}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-text-muted">
                    {formatSize(pkg.installedSize || pkg.size || 0)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {pkg.isInstalled && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <Check className="w-3 h-3" />
                        Installed
                      </span>
                    )}
                    {pkg.isUpgradable && (
                      <div className="flex items-center gap-1">
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <ArrowUpCircle className="w-3 h-3" />
                          Update
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpgrade(pkg.name);
                          }}
                          disabled={!!upgradingPkg || !!installingPackage}
                          className="ml-1 p-0.5 rounded bg-warning/20 hover:bg-warning/30 text-warning disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={`Upgrade ${pkg.name} to ${pkg.version}`}
                        >
                          {upgradingPkg === pkg.name ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ArrowUpCircle className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                    {!pkg.isInstalled && (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Download className="w-3 h-3" />
                        Available
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {packages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Download className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No packages found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
