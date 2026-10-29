import { FormActions, FormError, FormSection, FormSections, TextAreaField } from "@/components/form/fields";
import { ClientFields } from "./client-fields";

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
  pendingLabel = "Saving…",
  cancelHref,
}: {
  action: (formData: FormData) => void;
  defaults?: ClientDefaults;
  error?: string;
  submitLabel: string;
  pendingLabel?: string;
  cancelHref?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <FormError message={error} />
      <FormSections>
        <FormSection title="Company & contact" description="Who you're working with and how to reach them.">
          <ClientFields defaults={defaults} />
        </FormSection>
        <FormSection title="Notes">
          <TextAreaField
            label="Notes"
            name="notes"
            defaultValue={defaults?.notes}
            placeholder="Billing details, preferences, anything worth remembering."
            optional
          />
        </FormSection>
      </FormSections>
      <FormActions submitLabel={submitLabel} pendingLabel={pendingLabel} cancelHref={cancelHref} />
    </form>
  );
}
