import { Button } from "@/components/ui/button";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";

type ClientDefaults = {
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
};

export function ClientForm({
  action,
  defaults,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaults?: ClientDefaults;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <Field label="Company name" name="company_name" defaultValue={defaults?.company_name} required />
      <Field label="Contact name" name="contact_name" defaultValue={defaults?.contact_name} />
      <Field label="Contact email" name="contact_email" type="email" defaultValue={defaults?.contact_email} />
      <Field label="Contact phone" name="contact_phone" defaultValue={defaults?.contact_phone} />

      <div>
        <label htmlFor="notes" className={FIELD_LABEL}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} defaultValue={defaults?.notes} className={`mt-1 ${FIELD}`} />
      </div>

      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={FIELD_LABEL}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={`mt-1 ${FIELD}`}
      />
    </div>
  );
}
