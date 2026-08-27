"use client";

import { useState } from "react";
import { FIELD, FIELD_LABEL } from "@/lib/field-styles";
import { PROJECT_TYPE_OPTIONS, type ProjectWorkType } from "@/lib/project-work";

export function ProjectTypeFields({
  clients,
  defaultType,
  defaultClientId,
}: {
  clients: { id: string; company_name: string }[];
  defaultType?: ProjectWorkType;
  defaultClientId?: string;
}) {
  const [type, setType] = useState<ProjectWorkType>(defaultType ?? (clients.length > 0 ? "client" : "internal"));

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className={FIELD_LABEL}>Project type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROJECT_TYPE_OPTIONS.map((option) => {
            const disabled = option.value === "client" && clients.length === 0;
            return (
              <label
                key={option.value}
                className={`inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm sm:flex-none sm:justify-start ${
                  type === option.value
                    ? "border-accent-500 bg-accent-50 text-zinc-900 dark:bg-accent-100/10 dark:text-zinc-50"
                    : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="project_type"
                  value={option.value}
                  checked={type === option.value}
                  disabled={disabled}
                  onChange={() => setType(option.value)}
                />
                {option.label}
              </label>
            );
          })}
        </div>
        {clients.length === 0 && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Add a client first if this is client work.
          </p>
        )}
      </fieldset>

      {type === "client" && (
        <div>
          <label htmlFor="client_id" className={FIELD_LABEL}>
            Client
          </label>
          <select
            id="client_id"
            name="client_id"
            required
            defaultValue={defaultClientId ?? ""}
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
          </select>
        </div>
      )}
    </div>
  );
}
