import { TabType } from "../../types";
import { Download, ArrowUpCircle, Search, Package } from "lucide-react";

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
      case "installed": return installedCount;
      case "upgradable": return upgradableCount;
      case "search": return searchCount;
      default: return 0;
    }
  };

  return (
    <aside className="w-56 bg-[#0c0e12] border-r border-zinc-800/50 flex flex-col">
      <div className="px-4 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Views</p>
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative cursor-pointer
                ${isActive
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-full" />
              )}
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : ""}`} />
              <span className="flex-1 text-left">{tab.label}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isActive ? "bg-blue-500/15 text-blue-400" : "bg-zinc-800/60 text-zinc-500"
              }`}>
                {getCount(tab.id)}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-3 pb-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2 px-3">
          <Package className="w-3 h-3 text-zinc-600" />
          <span className="text-[11px] text-zinc-600">Lino v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
