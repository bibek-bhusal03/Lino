import { useState, useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import { PackageManagerType } from "../../types";
import {
  Package,
  Box,
  Search,
  ArrowRight,
  Check,
} from "lucide-react";

const managers = [
  {
    id: "apt" as PackageManagerType,
    name: "apt",
    description: "Default package manager for Debian, Ubuntu, Linux Mint, and derivatives",
    icon: Package,
    color: "#EA6045",
  },
  {
    id: "pacman" as PackageManagerType,
    name: "pacman",
    description: "Default package manager for Arch Linux and derivatives",
    icon: Box,
    color: "#3584E4",
  },
  {
    id: "yay" as PackageManagerType,
    name: "yay",
    description: "AUR helper with pacman compatibility. Requires yay to be pre-installed",
    icon: Search,
    color: "#58A6FF",
  },
  {
    id: "paru" as PackageManagerType,
    name: "paru",
    description: "Feature-rich AUR helper written in Rust. Requires paru to be pre-installed",
    icon: Search,
    color: "#8959A8",
  },
];

export default function ManagerSelection() {
  const [selected, setSelected] = useState<PackageManagerType | null>(null);
  const [remember, setRemember] = useState(false);
  const { setPackageManager, setConfig, setActiveTab, setFilter } = useAppStore();

  useEffect(() => {
    const saved = localStorage.getItem("lino-manager");
    if (saved) {
      setPackageManager(saved as PackageManagerType);
    }
  }, [setPackageManager]);

  const handleContinue = () => {
    if (!selected) return;
    setPackageManager(selected);
    if (remember) {
      localStorage.setItem("lino-manager", selected);
      setConfig({ rememberManager: true });
    }
    setActiveTab("installed");
    setFilter({ status: "all", search: "" });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-text mb-3">
            Welcome to <span className="text-primary">Lino</span>
          </h1>
          <p className="text-text-secondary text-lg">
            Select your package manager to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {managers.map((manager) => {
            const Icon = manager.icon;
            const isSelected = selected === manager.id;
            return (
              <button
                key={manager.id}
                onClick={() => setSelected(manager.id)}
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-200 text-left
                  ${
                    isSelected
                      ? "border-primary bg-surface-hover shadow-lg shadow-primary/10"
                      : "border-border bg-surface hover:border-text-muted hover:bg-surface-hover"
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${manager.color}20` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: manager.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-text">
                        {manager.name}
                      </h3>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {manager.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-text-secondary text-sm">
              Remember my choice
            </span>
          </label>

          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${
                selected
                  ? "bg-primary hover:bg-primary-hover text-background"
                  : "bg-surface text-text-muted cursor-not-allowed"
              }
            `}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
