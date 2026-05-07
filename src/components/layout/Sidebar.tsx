import { TabType } from "../../types";
import { Download, ArrowUpCircle, Search } from "lucide-react";

const tabs = [
  { id: "installed" as TabType, label: "Installed", icon: Download },
  { id: "upgradable" as TabType, label: "Upgradable", icon: ArrowUpCircle },
  { id: "search" as TabType, label: "Search", icon: Search },
];

interface SidebarProps {
  activeTab: TabType;
  installedCount: number;
  upgradableCount: number;
  searchCount: number;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, installedCount, upgradableCount, searchCount, onTabChange }: SidebarProps) {
  const getCount = (tab: TabType) => {
    switch (tab) {
      case "installed":
        return installedCount;
      case "upgradable":
        return upgradableCount;
      case "search":
        return searchCount;
      default:
        return 0;
    }
  };

  return (
    <aside className="w-56 bg-surface border-r border-border flex flex-col">
      <nav className="flex-1 p-3 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{tab.label}</span>
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${isActive ? "bg-primary/20 text-primary" : "bg-background text-text-muted"}
                `}
              >
                {getCount(tab.id)}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="text-xs text-text-muted px-3">
          Lino v0.1.0
        </div>
      </div>
    </aside>
  );
}
