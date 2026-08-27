export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-2.5 py-1.5 text-xs sm:min-h-0",
  md: "min-h-11 px-4 py-2.5 text-sm sm:min-h-0",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent-600 text-white shadow-sm hover:bg-accent-700",
  secondary:
    "border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800",
  ghost: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
  danger:
    "border border-red-300 text-red-700 bg-white hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:bg-zinc-900 dark:hover:bg-red-950",
};

export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className = "") {
  return [base, sizes[size], variants[variant], className].filter(Boolean).join(" ");
}
