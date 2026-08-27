export type ProjectWorkType = "client" | "internal";

export const PROJECT_TYPE_OPTIONS: { value: ProjectWorkType; label: string }[] = [
  { value: "client", label: "Client Project" },
  { value: "internal", label: "Internal Product" },
];

export function readProjectType(value: unknown, clientId?: string | null): ProjectWorkType {
  if (value === "internal" || value === "client") return value;
  return clientId ? "client" : "internal";
}

export function projectTypeLabel(type: ProjectWorkType) {
  return PROJECT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function projectSourceLabel(type: ProjectWorkType, clientName?: string | null) {
  if (type === "internal") return "Internal product";
  return clientName || "No client";
}
