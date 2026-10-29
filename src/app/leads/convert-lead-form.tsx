"use client";

import { useState } from "react";
import { SelectField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { ClientPicker } from "@/app/clients/client-picker";
import { CUSTOMER_STATUS_OPTIONS } from "@/lib/leads";
import type { Enums } from "@/lib/supabase/database.types";

// Converts a lead into a product customer or a client with a new project.
// Client details are pre-filled from the lead.
export function ConvertLeadForm({
  action,
  interest,
  clients,
  products,
  defaultClientId,
  defaultProductId,
  defaultProjectName,
  newClientDefaults,
}: {
  action: (formData: FormData) => void;
  interest: Enums<"lead_interest">;
  clients: { id: string; company_name: string }[];
  products: { id: string; name: string }[];
  defaultClientId?: string;
  defaultProductId?: string | null;
  defaultProjectName: string;
  newClientDefaults: { company_name: string; contact_name: string; contact_email: string; contact_phone: string };
}) {
  const [as, setAs] = useState<Enums<"lead_interest">>(interest);

  return (
    <form action={action} className="space-y-4">
      <div role="radiogroup" aria-label="Convert to" className="grid grid-cols-2 gap-2">
        {(
          [
            { value: "product", label: "Product customer" },
            { value: "custom_project", label: "Custom project" },
          ] as const
        ).map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
              as === option.value
                ? "border-accent-500 bg-accent-50 font-medium text-zinc-900 ring-1 ring-accent-500 dark:bg-accent-100/10 dark:text-zinc-50"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <input
              type="radio"
              name="convert_as"
              value={option.value}
              checked={as === option.value}
              onChange={() => setAs(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>

      <ClientPicker
        clients={clients}
        defaultClientId={defaultClientId}
        newClientDefaults={newClientDefaults}
        hint="Filled in from the lead. It will be added to Clients."
      />

      {as === "product" ? (
        products.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No internal products yet. Create a project with type “Internal Product” first.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <SelectField
                label="Product"
                name="product_id"
                defaultValue={defaultProductId}
                placeholder="Select a product…"
                options={products.map((p) => ({ value: p.id, label: p.name }))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <TextField label="Plan" name="plan" placeholder="e.g. Pro, 10 users" optional />
            </div>
            <SelectField label="Status" name="customer_status" defaultValue="active" options={CUSTOMER_STATUS_OPTIONS} />
          </div>
        )
      ) : (
        <TextField label="Project name" name="project_name" defaultValue={defaultProjectName} required />
      )}

      <SubmitButton pendingLabel="Converting…" className="w-full">
        {as === "product" ? "Convert to customer" : "Convert & create project"}
      </SubmitButton>
    </form>
  );
}
