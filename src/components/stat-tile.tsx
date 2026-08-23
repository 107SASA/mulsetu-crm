import Link from "next/link";
import { CARD } from "@/lib/card-styles";

export function StatTile({
  label,
  value,
  tone = "default",
  href,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "danger";
  href?: string;
}) {
  const valueColor =
    tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-900 dark:text-zinc-50";

  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${CARD} block p-5 transition-colors hover:border-accent-300 dark:hover:border-accent-700/60`}>
        {body}
      </Link>
    );
  }

  return <div className={`${CARD} p-5`}>{body}</div>;
}
