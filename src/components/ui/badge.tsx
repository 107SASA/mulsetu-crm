import type { ReactNode } from "react";

// A small color pill. Pass a Tailwind color className (e.g. from the
// priorityColor/taskStatusColor helpers in lib/constants) via `tone`.
export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}
