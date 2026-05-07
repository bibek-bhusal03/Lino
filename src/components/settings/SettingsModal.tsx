import { useAppStore } from "../../store/appStore";
import { X } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { config, setConfig } = useAppStore();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-xl border border-border p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">Settings</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">
              Theme
            </label>
            <select
              value={config.theme}
              onChange={(e) => setConfig({ theme: e.target.value as "dark" | "light" | "system" })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text text-sm focus:outline-none focus:border-primary"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Remember package manager
            </span>
            <input
              type="checkbox"
              checked={config.rememberManager}
              onChange={(e) => {
                setConfig({ rememberManager: e.target.checked });
                if (!e.target.checked) {
                  localStorage.removeItem("lino-manager");
                }
              }}
              className="w-4 h-4 rounded border-border bg-background"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">
              Auto-refresh interval (seconds, 0 to disable)
            </label>
            <input
              type="number"
              value={config.autoRefreshInterval}
              onChange={(e) => setConfig({ autoRefreshInterval: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text text-sm focus:outline-none focus:border-primary"
              min="0"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-background font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
