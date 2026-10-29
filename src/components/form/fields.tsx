import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { ButtonLink } from "@/components/ui/button-link";
import { CARD } from "@/lib/card-styles";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";

// Shared building blocks for every form in the app, so labels, hints,
// optional markers, errors, and action buttons look and behave the same
// everywhere. Usable from both server and client components.

type Option = { value: string; label: string };

export function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={FIELD_LABEL}>
      {children}
      {optional && <span className="ml-1 font-normal text-zinc-400">(optional)</span>}
    </label>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{children}</p>;
}

export function TextField({
  label,
  name,
  id = name,
  type = "text",
  defaultValue,
  required,
  optional,
  placeholder,
  hint,
  min,
  step,
  inputMode,
  autoComplete,
  autoFocus,
}: {
  label: string;
  name: string;
  id?: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  hint?: React.ReactNode;
  min?: string;
  step?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`mt-1 ${FIELD}`}
      />
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  id = name,
  defaultValue,
  rows = 3,
  optional,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  id?: string;
  defaultValue?: string | null;
  rows?: number;
  optional?: boolean;
  placeholder?: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        className={`mt-1 ${FIELD}`}
      />
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

export function SelectField({
  label,
  name,
  id = name,
  options,
  defaultValue,
  placeholder,
  required,
  optional,
  hint,
}: {
  label: string;
  name: string;
  id?: string;
  options: Option[];
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={`mt-1 ${FIELD}`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

// A titled group of fields. Stack several inside a FormSections wrapper.
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-4 py-6 first:pt-0">
      <div>
        <legend className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</legend>
        {description && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export function FormSections({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</div>;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm [overflow-wrap:anywhere] text-red-700 dark:bg-red-950 dark:text-red-300">
      {message}
    </p>
  );
}

export function FormActions({
  submitLabel,
  pendingLabel = "Saving…",
  cancelHref,
}: {
  submitLabel: string;
  pendingLabel?: string;
  cancelHref?: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end dark:border-zinc-800">
      {cancelHref && (
        <ButtonLink href={cancelHref} variant="ghost" className="w-full sm:w-auto">
          Cancel
        </ButtonLink>
      )}
      <SubmitButton pendingLabel={pendingLabel} className="w-full sm:w-auto">
        {submitLabel}
      </SubmitButton>
    </div>
  );
}

// Page layout shared by every "New …" and "Edit …" screen.
export function FormPage({
  backHref,
  backLabel,
  title,
  description,
  children,
  footer,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
      <Link href={backHref} className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        ← {backLabel}
      </Link>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">{title}</h1>
      {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      <div className={`${CARD} mt-6 p-5 sm:p-6`}>{children}</div>
      {footer}
    </div>
  );
}

// Delete area shown at the bottom of edit pages.
export function DangerZone({ description, children }: { description: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60">
      <div>
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      {children}
    </section>
  );
}
