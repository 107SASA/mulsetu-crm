import { TextField } from "@/components/form/fields";

type ClientDefaults = {
  company_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};

// Company + main contact fields. Rendered by the client form and, with a
// prefix, inside the project form's "Add a new client" option.
export function ClientFields({ prefix = "", defaults }: { prefix?: string; defaults?: ClientDefaults }) {
  return (
    <div className="space-y-4">
      <TextField
        label="Company name"
        name={`${prefix}company_name`}
        defaultValue={defaults?.company_name}
        placeholder="e.g. Swamini Foods"
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Contact person"
          name={`${prefix}contact_name`}
          defaultValue={defaults?.contact_name}
          placeholder="Full name"
          optional
        />
        <TextField
          label="Phone"
          name={`${prefix}contact_phone`}
          type="tel"
          defaultValue={defaults?.contact_phone}
          placeholder="+91 …"
          optional
        />
      </div>
      <TextField
        label="Email"
        name={`${prefix}contact_email`}
        type="email"
        defaultValue={defaults?.contact_email}
        placeholder="name@company.com"
        optional
      />
    </div>
  );
}
