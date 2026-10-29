"use client";

import { useState } from "react";
import { PROJECT_TYPE_OPTIONS, type ProjectWorkType } from "@/lib/project-work";
import { ClientPicker } from "@/app/clients/client-picker";

const TYPE_HINT: Record<ProjectWorkType, string> = {
  client: "Work you're doing for a client.",
  internal: "Your own product or internal tool.",
};

export function ProjectTypeFields({
  clients,
  defaultType,
  defaultClientId,
}: {
  clients: { id: string; company_name: string }[];
  defaultType?: ProjectWorkType;
  defaultClientId?: string;
}) {
  const [type, setType] = useState<ProjectWorkType>(defaultType ?? "client");

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="sr-only">Project type</legend>
        <div className="grid grid-cols-2 gap-2">
          {PROJECT_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2.5 transition-colors ${
                type === option.value
                  ? "border-accent-500 bg-accent-50 ring-1 ring-accent-500 dark:bg-accent-100/10"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              <input
                type="radio"
                name="project_type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{option.label}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{TYPE_HINT[option.value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === "client" && (
        <ClientPicker
          clients={clients}
          defaultClientId={defaultClientId}
          hint="It will be added to Clients when you save this project."
        />
      )}
    </div>
  );
}
