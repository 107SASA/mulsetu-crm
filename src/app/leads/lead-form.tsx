"use client";

import { useState } from "react";
import {
  FieldHint,
  FieldLabel,
  FormError,
  FormSection,
  FormSections,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form/fields";
import { personName, type Person } from "@/components/form/people-picker";
import { ButtonLink } from "@/components/ui/button-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { FIELD } from "@/lib/field-styles";
import { LEAD_INTEREST_OPTIONS, LEAD_SOURCES, LEAD_STATUS_OPTIONS, SOURCE_DETAIL_PROMPT } from "@/lib/leads";
import type { Enums } from "@/lib/supabase/database.types";

export type LeadDefaults = {
  contact_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  interest?: Enums<"lead_interest">;
  product_id?: string | null;
  requirement?: string;
  source?: string;
  source_detail?: string;
  status?: Enums<"lead_status">;
  owner_id?: string | null;
  follow_up_date?: string | null;
  notes?: string;
};

// Add / edit a lead. Built for speed at an expo stall: contact first, one tap
// for what they want, and "Save & add another" keeps the source filled in.
export function LeadForm({
  action,
  products,
  people,
  isAdmin,
  currentUserId,
  defaults,
  error,
  mode,
  cancelHref,
}: {
  action: (formData: FormData) => void;
  products: { id: string; name: string }[];
  people: Person[];
  isAdmin: boolean;
  currentUserId: string;
  defaults?: LeadDefaults;
  error?: string;
  mode: "create" | "edit";
  cancelHref: string;
}) {
  const [interest, setInterest] = useState<Enums<"lead_interest">>(defaults?.interest ?? "custom_project");
  const [source, setSource] = useState(defaults?.source || "expo");

  return (
    <form action={action} className="space-y-4">
      <FormError message={error} />

      <FormSections>
        <FormSection title="Who is it?">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Name"
              name="contact_name"
              defaultValue={defaults?.contact_name}
              placeholder="Contact person"
              autoComplete="off"
              autoFocus={mode === "create"}
              required
            />
            <TextField
              label="Phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={defaults?.phone}
              placeholder="+91 98765 43210"
              autoComplete="off"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              defaultValue={defaults?.email}
              placeholder="name@company.com"
              autoComplete="off"
            />
            <TextField
              label="Company"
              name="company_name"
              defaultValue={defaults?.company_name}
              placeholder="Leave empty for individuals"
              autoComplete="off"
              optional
            />
          </div>
          <FieldHint>A name plus a phone number or email is enough to save.</FieldHint>
        </FormSection>

        <FormSection title="What are they interested in?">
          <fieldset>
            <legend className="sr-only">Interest</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LEAD_INTEREST_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition-colors ${
                    interest === option.value
                      ? "border-accent-500 bg-accent-50 ring-1 ring-accent-500 dark:bg-accent-100/10"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="interest"
                    value={option.value}
                    checked={interest === option.value}
                    onChange={() => setInterest(option.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{option.label}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {interest === "product" &&
            (products.length > 0 ? (
              <SelectField
                label="Which product?"
                name="product_id"
                defaultValue={defaults?.product_id}
                placeholder="Not sure yet"
                options={products.map((p) => ({ value: p.id, label: p.name }))}
              />
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No internal products yet. Create a project with type “Internal Product” to list it here.
              </p>
            ))}

          <TextAreaField
            label={interest === "product" ? "Notes" : "What do they need?"}
            name="requirement"
            defaultValue={defaults?.requirement}
            rows={2}
            placeholder={interest === "product" ? "Team size, budget, questions…" : "e.g. Online ordering website for 3 outlets"}
            optional
          />
        </FormSection>

        <FormSection title="Where did the lead come from?">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <FieldLabel htmlFor="source">Source</FieldLabel>
              <select
                id="source"
                name="source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className={`mt-1 ${FIELD}`}
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              label={SOURCE_DETAIL_PROMPT[source] ?? "Details"}
              name="source_detail"
              defaultValue={defaults?.source_detail}
              placeholder={source === "expo" ? "e.g. IndiaSoft Expo 2026" : ""}
              optional
            />
          </div>
        </FormSection>

        <FormSection title="Follow-up">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Follow up on"
              name="follow_up_date"
              type="date"
              defaultValue={defaults?.follow_up_date}
              optional
            />
            {isAdmin ? (
              <SelectField
                label="Owner"
                name="owner_id"
                defaultValue={defaults?.owner_id ?? currentUserId}
                placeholder="Nobody yet"
                options={people.map((p) => ({
                  value: p.id,
                  label: p.id === currentUserId ? `${personName(p)} (me)` : personName(p),
                }))}
              />
            ) : (
              <input type="hidden" name="owner_id" value={defaults?.owner_id ?? currentUserId} />
            )}
            {mode === "edit" && (
              <SelectField
                label="Status"
                name="status"
                defaultValue={defaults?.status ?? "new"}
                options={LEAD_STATUS_OPTIONS.filter((s) => s.value !== "won" || defaults?.status === "won")}
              />
            )}
          </div>
          {mode === "edit" && (
            <TextAreaField label="Internal notes" name="notes" defaultValue={defaults?.notes} rows={2} optional />
          )}
        </FormSection>
      </FormSections>

      <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end dark:border-zinc-800">
        <ButtonLink href={cancelHref} variant="ghost" className="w-full sm:w-auto">
          Cancel
        </ButtonLink>
        {mode === "create" ? (
          <>
            <SubmitButton name="next" value="another" variant="secondary" pendingLabel="Saving…" className="w-full sm:w-auto">
              Save &amp; add another
            </SubmitButton>
            <SubmitButton name="next" value="view" pendingLabel="Saving…" className="w-full sm:w-auto">
              Save lead
            </SubmitButton>
          </>
        ) : (
          <SubmitButton pendingLabel="Saving…" className="w-full sm:w-auto">
            Save changes
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
