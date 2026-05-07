import { useAppStore } from "../../store/appStore";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export default function Toast() {
  const { toasts, removeToast } = useAppStore();

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" />,
    error: <XCircle className="w-4 h-4 text-danger shrink-0" />,
    info: <Info className="w-4 h-4 text-primary shrink-0" />,
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface border border-border shadow-lg min-w-64 max-w-sm animate-in fade-in slide-in-from-bottom-2"
        >
          {icons[toast.type]}
          <span className="text-sm text-text flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-muted hover:text-text transition-colors shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
