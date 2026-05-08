import { useState, useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import { PackageManagerType } from "../../types";
import { FaCheckCircle, FaArrowRight } from "react-icons/fa";

const managers: {
  id: PackageManagerType;
  name: string;
  description: string;
  icon: string;
  tag: string;
  tagClasses: string;
  iconClasses: string;
}[] = [
  {
    id: "apt",
    name: "apt",
    description: "Default package manager for Debian, Ubuntu, Linux Mint, and derivatives",
    icon: "💻",
    tag: "Debian-based",
    tagClasses: "bg-amber-500/10 text-amber-400",
    iconClasses: "bg-zinc-800 border border-zinc-700",
  },
  {
    id: "pacman",
    name: "pacman",
    description: "Default package manager for Arch Linux and derivatives",
    icon: "📦",
    tag: "Arch Linux",
    tagClasses: "bg-blue-500/10 text-blue-400",
    iconClasses: "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-inner",
  },
  {
    id: "yay",
    name: "yay",
    description: "Yet Another Yogurt — AUR helper with pacman compatibility",
    icon: "🧊",
    tag: "AUR Helper",
    tagClasses: "bg-purple-500/10 text-purple-400",
    iconClasses: "bg-zinc-800 border border-zinc-700",
  },
  {
    id: "paru",
    name: "paru",
    description: "Feature-rich AUR helper written in Rust",
    icon: "🔍",
    tag: "AUR Helper",
    tagClasses: "bg-purple-500/10 text-purple-400",
    iconClasses: "bg-zinc-800 border border-zinc-700",
  },
];

export default function ManagerSelection() {
  const [selected, setSelected] = useState<PackageManagerType>("pacman");
  const [remember, setRemember] = useState(false);

  const { setPackageManager, setConfig, setActiveTab, setFilter } = useAppStore();

  useEffect(() => {
    const saved = localStorage.getItem("lino-manager");
    if (saved) {
      setSelected(saved as PackageManagerType);
    }
  }, []);

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_30%),_radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.1),_transparent_25%),_linear-gradient(180deg,_#09090b_0%,_#0f1117_100%)] text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-10">
        <section className="rounded-[32px] border border-zinc-800/80 bg-zinc-950/95 shadow-xl shadow-black/30 p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-blue-300 font-semibold">
                Select your manager
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Welcome to <span className="text-blue-400">Lino</span>
              </h1>
              <p className="mt-4 max-w-xl text-zinc-400 text-base leading-7">
                Manage packages from one sleek desktop interface. Pick the package manager you use now and start exploring installed, upgradable, and searchable packages with confidence.
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/80 px-5 py-4 text-sm text-zinc-400 shadow-sm shadow-black/20">
              <p className="font-semibold text-zinc-200">Supported distributions</p>
              <p className="mt-2 leading-6">
                Debian/Ubuntu, Arch, Manjaro, and AUR helpers like yay or paru — no extra setup required.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {managers.map((manager) => {
              const isSelected = selected === manager.id;

              return (
                <button
                  key={manager.id}
                  type="button"
                  onClick={() => setSelected(manager.id)}
                  aria-pressed={isSelected}
                  className={`group w-full rounded-[28px] border p-6 text-left transition-all duration-200 shadow-sm ${
                    isSelected
                      ? "border-blue-500/40 bg-blue-500/10 shadow-blue-500/10"
                      : "border-zinc-800/70 bg-zinc-900/90 hover:border-zinc-600/60 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-3xl text-2xl ${manager.iconClasses}`}>
                        {manager.icon}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-white">{manager.name}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${manager.tagClasses}`}>
                            {manager.tag}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-zinc-400">{manager.description}</p>
                      </div>
                    </div>

                    <div className="mt-1">
                      {isSelected ? (
                        <FaCheckCircle className="h-6 w-6 text-blue-400" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-zinc-700 bg-zinc-800" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-3 rounded-3xl border border-zinc-800/70 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300 shadow-sm shadow-black/10">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 rounded-lg accent-blue-500 bg-zinc-950 border border-zinc-700"
              />
              <span>Remember my choice</span>
            </label>

            <button
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-3 rounded-3xl bg-blue-500 px-7 py-3 text-base font-semibold text-white transition duration-200 hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
            >
              Continue
              <FaArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
