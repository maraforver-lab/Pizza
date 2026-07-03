import type { YeastType } from "@/lib/saved-recipes";

export const DEFAULT_SESSION_YEAST_TYPE: YeastType = "ady";

const supportedSessionYeastTypes = new Set<YeastType>(["ady", "cy", "idy"]);

export const sessionYeastTypeOptions = [
  {
    id: "ady" as const,
    label: "Dry yeast",
    description: "Default for most home bakers",
  },
  {
    id: "cy" as const,
    label: "Fresh yeast",
    description: "Use if you bake with refrigerated fresh yeast",
  },
  {
    id: "idy" as const,
    label: "Instant dry yeast",
    description: "Stronger dry yeast, usually used in smaller amounts",
  },
] satisfies Array<{ id: YeastType; label: string; description: string }>;

export function normalizeSessionYeastType(value: unknown): YeastType {
  return typeof value === "string" && supportedSessionYeastTypes.has(value as YeastType)
    ? value as YeastType
    : DEFAULT_SESSION_YEAST_TYPE;
}

export function yeastTypeLabel(value: unknown): string {
  const yeastType = normalizeSessionYeastType(value);
  return sessionYeastTypeOptions.find((option) => option.id === yeastType)?.label ?? "Dry yeast";
}
