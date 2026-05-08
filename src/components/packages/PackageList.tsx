import { useState } from "react";
import { useAppStore } from "../../store/appStore";
import { PackageInfo } from "../../types";
import { Check, Download, ArrowUpCircle, Circle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { formatSize } from "../../utils/formatSize";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

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
    } else {
      useAppStore.getState().clearSelection();
    }
  };

  const allSelected = packages.length > 0 && selectedPackages.size === packages.length;

  const handleUpgrade = async (name: string) => {
    if (!config.selectedManager || upgradingPkg) return;
    setUpgradingPkg(name);
    setInstallingPackage(name);
    try {
      const result = await invoke<any>("upgrade_package", { manager: config.selectedManager, name });
      if (result.success) {
        addToast(`${name} upgraded successfully`, "success");
      } else {
        addToast(`Failed to upgrade ${name}: ${result.error || "unknown error"}`, "error");
      }
      const updatedPackages = await invoke<any[]>("list_packages", { manager: config.selectedManager });
      setPackages(updatedPackages);
    } catch (error) {
      console.error("Failed to upgrade:", error);
      addToast(`Failed to upgrade ${name}`, "error");
    } finally {
      setUpgradingPkg(null);
      setInstallingPackage(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800/50">
            <th className="w-12 px-4 py-3.5 text-left">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
                />
              </div>
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-28">
              Version
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-20">
              Size
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-32">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg, index) => {
            const isSelected = selectedPackage?.name === pkg.name;
            const isBulkSelected = selectedPackages.has(pkg.name);
            return (
              <tr
                key={pkg.name}
                onClick={() => setSelectedPackage(pkg)}
                className={`
                  border-b border-zinc-800/30 cursor-pointer transition-all duration-150
                  ${index % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"}
                  ${isSelected ? "bg-blue-500/5" : "hover:bg-zinc-800/30"}
                  ${isBulkSelected ? "bg-blue-500/10" : ""}
                `}
              >
                <td className="px-4 py-3 w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isBulkSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        togglePackageSelection(pkg.name);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-zinc-200">{pkg.name}</span>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <span className="text-sm text-zinc-500 line-clamp-1">{pkg.description || "-"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-500 font-mono">{pkg.version}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-500">{formatSize(pkg.installedSize || pkg.size || 0)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {pkg.isInstalled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400">
                        <Check className="w-3 h-3" />
                        Installed
                      </span>
                    )}
                    {pkg.isUpgradable && (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400">
                          <ArrowUpCircle className="w-3 h-3" />
                          Update
                        </span>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpgrade(pkg.name);
                          }}
                          disabled={!!upgradingPkg || !!installingPackage}
                          isLoading={upgradingPkg === pkg.name}
                          variant="secondary"
                          size="sm"
                          icon={upgradingPkg === pkg.name ? undefined : <ArrowUpCircle className="w-3.5 h-3.5" />}
                          className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                          title={`Upgrade to ${pkg.version}`}
                        >
                          Update
                        </Button>
                      </>
                    )}
                    {!pkg.isInstalled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/50 text-zinc-500">
                        <Circle className="w-3 h-3" />
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
        <div className="p-6">
          <EmptyState
            icon={<Download className="w-12 h-12 text-zinc-500" />}
            title="No packages found"
            description="Try adjusting your search, filters, or selecting a different view."
          />
        </div>
      )}
    </div>
  );
}
