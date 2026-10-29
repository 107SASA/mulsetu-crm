"use client";

import { useState } from "react";
import { FieldHint, FieldLabel } from "@/components/form/fields";
import { FIELD } from "@/lib/field-styles";
import { NEW_CLIENT } from "@/lib/client-constants";
import { ClientFields } from "./client-fields";

type ClientDefaults = {
  company_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};

// Pick an existing client, or choose "Add a new client" to fill in the same
// fields as the Clients page. Used by the project form, lead conversion, and
// adding a product customer, so a client is created the same way everywhere.
export function ClientPicker({
  clients,
  defaultClientId,
  newClientDefaults,
  label = "Client",
  hint = "It will be added to Clients when you save.",
}: {
  clients: { id: string; company_name: string }[];
  defaultClientId?: string;
  newClientDefaults?: ClientDefaults;
  label?: string;
  hint?: string;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? (clients.length === 0 ? NEW_CLIENT : ""));

  return (
    <div>
      <FieldLabel htmlFor="client_id">{label}</FieldLabel>
      <select
        id="client_id"
        name="client_id"
        required
        value={clientId}
        onChange={(event) => setClientId(event.target.value)}
        className={`mt-1 ${FIELD}`}
      >
        <option value="" disabled>
          Select a client…
        </option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.company_name}
          </option>
        ))}
        <option value={NEW_CLIENT}>+ Add a new client</option>
      </select>
      {clientId === NEW_CLIENT && (
        <div className="mt-3 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">New client</p>
          <ClientFields prefix="new_client_" defaults={newClientDefaults} />
          <FieldHint>{hint}</FieldHint>
        </div>
      )}
    </div>
  );
}
