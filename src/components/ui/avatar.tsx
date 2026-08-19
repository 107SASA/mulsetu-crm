function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <span
      className={`inline-flex ${dimensions} shrink-0 items-center justify-center rounded-full bg-accent-100 font-semibold text-accent-700 dark:bg-accent-100/10 dark:text-accent-500`}
    >
      {initials(name)}
    </span>
  );
}
