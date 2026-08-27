import Link from "next/link";

export type ViewTab = {
  href: string;
  label: string;
  active: boolean;
};

export function ViewTabs({ items, className = "" }: { items: ViewTab[]; className?: string }) {
  return (
    <div
      className={`inline-flex w-full min-w-0 flex-wrap rounded-lg border border-zinc-200 p-0.5 sm:w-auto dark:border-zinc-700 ${className}`}
    >
      {items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-md px-3 text-sm transition-colors sm:min-h-9 sm:flex-none ${
            item.active
              ? "bg-zinc-900 font-medium text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
