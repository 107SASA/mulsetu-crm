import type { Enums } from "@/lib/supabase/database.types";

export const LEAD_SOURCES = [
  { value: "expo", label: "Expo / event" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social", label: "Social media" },
  { value: "cold_outreach", label: "Cold call / email" },
  { value: "walk_in", label: "Walk-in" },
  { value: "existing_client", label: "Existing client" },
  { value: "other", label: "Other" },
] as const;

// What the "detail" box asks for, depending on the source.
export const SOURCE_DETAIL_PROMPT: Record<string, string> = {
  expo: "Which expo or event?",
  referral: "Who referred them?",
  social: "Which platform or campaign?",
  website: "Which page or form?",
  cold_outreach: "Which campaign?",
};

export function sourceLabel(source: string | null | undefined) {
  return LEAD_SOURCES.find((s) => s.value === source)?.label ?? (source || "Unknown");
}

// "Expo / event · IndiaSoft 2026"
export function sourceText(source: string | null | undefined, detail?: string | null) {
  if (!source) return "";
  return detail ? `${sourceLabel(source)} · ${detail}` : sourceLabel(source);
}

export const LEAD_STATUS_OPTIONS: { value: Enums<"lead_status">; label: string; tone: string }[] = [
  { value: "new", label: "New", tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { value: "contacted", label: "Contacted", tone: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  { value: "qualified", label: "Qualified", tone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { value: "won", label: "Won", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { value: "lost", label: "Lost", tone: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
];

export function leadStatus(status: Enums<"lead_status">) {
  return LEAD_STATUS_OPTIONS.find((s) => s.value === status) ?? LEAD_STATUS_OPTIONS[0];
}

export const LEAD_INTEREST_OPTIONS: { value: Enums<"lead_interest">; label: string; hint: string }[] = [
  { value: "product", label: "One of our products", hint: "Wants to buy or try an existing product." },
  { value: "custom_project", label: "Custom project", hint: "Wants something built for them." },
];

export const CUSTOMER_STATUS_OPTIONS: { value: Enums<"customer_status">; label: string; tone: string }[] = [
  { value: "trial", label: "Trial", tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { value: "active", label: "Active", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { value: "paused", label: "Paused", tone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { value: "cancelled", label: "Cancelled", tone: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
];

export function customerStatus(status: Enums<"customer_status">) {
  return CUSTOMER_STATUS_OPTIONS.find((s) => s.value === status) ?? CUSTOMER_STATUS_OPTIONS[1];
}

export const LEADS_SETUP_MESSAGE =
  "Leads and product customers need a database update. Open the Supabase SQL editor and run supabase/migrations/0007_leads_and_product_customers.sql.";

// True when a query failed because the 0007 migration hasn't been run yet.
export function isMissingTable(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "PGRST200" ||
    error.code === "42703" ||
    /does not exist|could not find the table|schema cache/i.test(error.message ?? "")
  );
}

// Digits-only phone for WhatsApp links (wa.me). Assumes India (+91) for 10-digit numbers.
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits.replace(/^0+/, "");
}
