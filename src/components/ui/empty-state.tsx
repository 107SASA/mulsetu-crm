import type { ReactNode } from "react";

export function EmptyState({ icon, title, action }: { icon: string; title: string; action?: ReactNode }) {
  return (
    <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
      <span className="text-2xl opacity-70">{icon}</span>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      {action}
    </div>
  );
}
