import { useAppStore } from "../../store/appStore";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
};

const borders = {
  success: "border-emerald-500/20",
  error: "border-red-500/20",
  info: "border-blue-500/20",
};

export default function Toast() {
  const { toasts, removeToast } = useAppStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border ${borders[toast.type]} shadow-2xl shadow-black/40 backdrop-blur-sm`}
        >
          {icons[toast.type]}
          <span className="text-sm text-zinc-300 flex-1 leading-relaxed">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
