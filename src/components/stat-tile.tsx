import { CARD } from "@/lib/card-styles";

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "danger";
}) {
  const valueColor =
    tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-900 dark:text-zinc-50";

  return (
    <div className={`${CARD} p-4`}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
    </div>
  );
}
