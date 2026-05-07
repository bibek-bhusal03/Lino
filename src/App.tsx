import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "./store/appStore";
import ManagerSelection from "./components/onboarding/ManagerSelection";
import TopBar from "./components/layout/TopBar";
import Sidebar from "./components/layout/Sidebar";
import DetailPanel from "./components/layout/DetailPanel";
import PackageList from "./components/packages/PackageList";
import SearchTab from "./components/packages/SearchTab";
import SearchBar from "./components/packages/SearchBar";
import BulkActionBar from "./components/actions/BulkActionBar";
import Toast from "./components/ui/Toast";
import SettingsModal from "./components/settings/SettingsModal";
import "./App.css";

function App() {
  const { config, filteredPackages, setPackageManager, setConfig, setLoading, setPackages, activeTab, setFilter, searchResults, addToast } =
    useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [isTauri, setIsTauri] = useState(false);
  const [upgradableCount, setUpgradableCount] = useState(0);
  const [installedCount, setInstalledCount] = useState(0);

  useEffect(() => {
    const tauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    setIsTauri(tauri);
    if (!tauri) {
      console.warn("[Lino] Not running inside Tauri webview.");
    }
  }, []);

  const loadPackages = useCallback(async () => {
    if (!config.selectedManager) return;
    setLoading(true);
    try {
      const packages = await invoke<any[]>("list_packages", {
        manager: config.selectedManager,
      });
      setInstalledCount(packages.length);
      setPackages(packages);
    } catch (error) {
      console.error("[Lino] Failed to load packages:", error);
      setInstalledCount(0);
    } finally {
      setLoading(false);
    }
  }, [config.selectedManager, setLoading, setPackages]);

  useEffect(() => {
    const saved = localStorage.getItem("lino-manager");
    if (saved) {
      setPackageManager(saved as any);
    }
  }, [setPackageManager]);

  const showManagerSelection = !config.selectedManager;

  useEffect(() => {
    if (!config.selectedManager || showManagerSelection) return;
    loadPackages();
  }, [config.selectedManager, showManagerSelection, loadPackages]);

  useEffect(() => {
    const root = document.documentElement;
    const darkColors: Record<string, string> = {
      "--color-background": "#0f1117",
      "--color-background-secondary": "#161b22",
      "--color-surface": "#1c2128",
      "--color-surface-hover": "#22272e",
      "--color-border": "#30363d",
      "--color-primary": "#58a6ff",
      "--color-primary-hover": "#79b8ff",
      "--color-success": "#2ea043",
      "--color-warning": "#d29922",
      "--color-danger": "#f85149",
      "--color-text": "#e6edf3",
      "--color-text-secondary": "#8b949e",
      "--color-text-muted": "#6e7681",
    };
    const lightColors: Record<string, string> = {
      "--color-background": "#ffffff",
      "--color-background-secondary": "#f6f8fa",
      "--color-surface": "#ffffff",
      "--color-surface-hover": "#f3f4f6",
      "--color-border": "#d1d5db",
      "--color-primary": "#2563eb",
      "--color-primary-hover": "#3b82f6",
      "--color-success": "#16a34a",
      "--color-warning": "#ca8a04",
      "--color-danger": "#dc2626",
      "--color-text": "#1f2937",
      "--color-text-secondary": "#6b7280",
      "--color-text-muted": "#9ca3af",
    };

    let colors = darkColors;
    if (config.theme === "light") {
      colors = lightColors;
    } else if (config.theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      colors = prefersDark ? darkColors : lightColors;
    }

    for (const [key, value] of Object.entries(colors)) {
      root.style.setProperty(key, value);
    }
  }, [config.theme]);

  useEffect(() => {
    if (config.theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const root = document.documentElement;
        const darkColors: Record<string, string> = {
          "--color-background": "#0f1117",
          "--color-background-secondary": "#161b22",
          "--color-surface": "#1c2128",
          "--color-surface-hover": "#22272e",
          "--color-border": "#30363d",
          "--color-primary": "#58a6ff",
          "--color-primary-hover": "#79b8ff",
          "--color-success": "#2ea043",
          "--color-warning": "#d29922",
          "--color-danger": "#f85149",
          "--color-text": "#e6edf3",
          "--color-text-secondary": "#8b949e",
          "--color-text-muted": "#6e7681",
        };
        const lightColors: Record<string, string> = {
          "--color-background": "#ffffff",
          "--color-background-secondary": "#f6f8fa",
          "--color-surface": "#ffffff",
          "--color-surface-hover": "#f3f4f6",
          "--color-border": "#d1d5db",
          "--color-primary": "#2563eb",
          "--color-primary-hover": "#3b82f6",
          "--color-success": "#16a34a",
          "--color-warning": "#ca8a04",
          "--color-danger": "#dc2626",
          "--color-text": "#1f2937",
          "--color-text-secondary": "#6b7280",
          "--color-text-muted": "#9ca3af",
        };
        const colors = media.matches ? darkColors : lightColors;
        for (const [key, value] of Object.entries(colors)) {
          root.style.setProperty(key, value);
        }
      };
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [config.theme]);

  useEffect(() => {
    if (!config.autoRefreshInterval || config.autoRefreshInterval <= 0) return;
    if (!config.selectedManager) return;

    const interval = setInterval(() => {
      loadPackages();
    }, config.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [config.autoRefreshInterval, config.selectedManager, loadPackages]);

  const handleTabChange = async (tab: "installed" | "upgradable" | "search") => {
    if (tab === "upgradable" && config.selectedManager) {
      setLoading(true);
      try {
        const upgradable = await invoke<any[]>("get_upgradable_packages", {
          manager: config.selectedManager,
        });
        setUpgradableCount(upgradable.length);
        setPackages(upgradable);
        addToast(`Found ${upgradable.length} upgradable packages`, "info");
      } catch (error) {
        console.error("[Lino] Failed to load upgradable packages:", error);
        setUpgradableCount(0);
        addToast("Failed to load upgradable packages", "error");
      } finally {
        setLoading(false);
      }
    } else if (tab === "installed" && config.selectedManager) {
      setLoading(true);
      try {
        const packages = await invoke<any[]>("list_packages", {
          manager: config.selectedManager,
        });
        setInstalledCount(packages.length);
        setPackages(packages);
        addToast(`Loaded ${packages.length} installed packages`, "info");
      } catch (error) {
        console.error("[Lino] Failed to load packages:", error);
        setInstalledCount(0);
        addToast("Failed to load packages", "error");
      } finally {
        setLoading(false);
      }
    } else {
      setUpgradableCount(0);
      setInstalledCount(0);
    }
    setFilter({ search: "" });
    useAppStore.getState().setActiveTab(tab);
  };

  if (!isTauri) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-bold text-text mb-4">Lino</h1>
          <p className="text-text-secondary mb-6">
            This app must be run inside the Tauri desktop window.
          </p>
          <p className="text-text-muted text-sm">
            You're viewing the dev server in a browser. The actual Tauri window should have opened automatically when you ran <code className="bg-surface px-2 py-1 rounded text-primary text-xs">npm run tauri dev</code>.
          </p>
        </div>
      </div>
    );
  }

  if (showManagerSelection) {
    return <ManagerSelection />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      <TopBar
        onChangeManager={() => {
          setConfig({ selectedManager: null });
          localStorage.removeItem("lino-manager");
        }}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          installedCount={installedCount}
          upgradableCount={upgradableCount}
          searchCount={searchResults.length}
          onTabChange={handleTabChange}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "search" ? (
            <SearchTab />
          ) : (
            <>
              <SearchBar />
              <PackageList packages={filteredPackages} />
              <BulkActionBar />
            </>
          )}
        </main>

        <DetailPanel />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <Toast />
    </div>
  );
}

export default App;
