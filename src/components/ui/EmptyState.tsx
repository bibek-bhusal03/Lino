import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-10 text-center text-zinc-400">
      <div className="mb-4 text-zinc-500">{icon}</div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h2>
      <p className="text-sm leading-6 text-zinc-500 max-w-sm">{description}</p>
    </div>
  );
}
