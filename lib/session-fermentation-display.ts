import type { PizzaSession, PizzaSessionRecipeSnapshot } from "@/lib/pizza-session";

type FermentationMode = "room" | "cold";

type FermentationBasis = {
  fermentationHours?: number | null;
  fermentationMode?: FermentationMode | null;
  temperatureC?: number | null;
};

export type SessionFermentationDisplay = {
  durationHours?: number;
  mode?: FermentationMode;
  temperatureC?: number;
  label: string;
  placeTemperatureLabel?: string;
  fullLabel: string;
};

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function formatHours(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded}h`;
}

function parsePresetFermentation(value?: string) {
  if (!value) return undefined;
  const match = value.match(/^(\d+(?:\.\d+)?)h-(room|cold)$/);
  if (!match) return undefined;
  const hours = Number(match[1]);
  if (!Number.isFinite(hours)) return undefined;
  return {
    fermentationHours: hours,
    fermentationMode: match[2] as FermentationMode,
  };
}

function defaultTemperatureForMode(mode?: FermentationMode) {
  if (mode === "cold") return 4;
  if (mode === "room") return 22;
  return undefined;
}

function sessionTemperatureForMode(session: PizzaSession | null | undefined, mode?: FermentationMode) {
  const value = finiteNumber(session?.fermentationTemperatureCOverride);
  if (value === undefined || !mode) return undefined;
  if (mode === "cold") return value >= 2 && value <= 8 ? value : undefined;
  return value >= 18 && value <= 26 ? value : undefined;
}

function placeTemperatureLabel(mode?: FermentationMode, temperatureC?: number) {
  if (!mode || typeof temperatureC !== "number") return undefined;
  if (mode === "cold") return `Fridge · ${temperatureC} °C`;
  return `Room · ${temperatureC} °C`;
}

function inlinePlaceTemperatureLabel(mode?: FermentationMode, temperatureC?: number) {
  if (!mode || typeof temperatureC !== "number") return undefined;
  if (mode === "cold") return `fridge ${temperatureC} °C`;
  return `room ${temperatureC} °C`;
}

function fermentationLabel(mode?: FermentationMode, hours?: number) {
  if (!mode || typeof hours !== "number") return "Fermentation plan not selected";
  return `${formatHours(hours)} ${mode} fermentation`;
}

export function buildSessionFermentationDisplay({
  session,
  snapshot,
  basis,
}: {
  session?: PizzaSession | null;
  snapshot?: PizzaSessionRecipeSnapshot | null;
  basis?: FermentationBasis | null;
}): SessionFermentationDisplay {
  const basisHours = finiteNumber(basis?.fermentationHours);
  const basisMode = basis?.fermentationMode ?? undefined;
  const selectedHours = finiteNumber(session?.plannedFermentationHours);
  const preset = parsePresetFermentation(snapshot?.fermentation ?? session?.recipeSnapshot?.fermentation);

  const durationHours = basisHours
    ?? selectedHours
    ?? preset?.fermentationHours;
  const mode = basisMode
    ?? (selectedHours ? "cold" : undefined)
    ?? preset?.fermentationMode;
  const temperatureC = finiteNumber(basis?.temperatureC)
    ?? sessionTemperatureForMode(session, mode)
    ?? defaultTemperatureForMode(mode);
  const label = fermentationLabel(mode, durationHours);
  const place = placeTemperatureLabel(mode, temperatureC);
  const inlinePlace = inlinePlaceTemperatureLabel(mode, temperatureC);

  return {
    durationHours,
    mode,
    temperatureC,
    label,
    placeTemperatureLabel: place,
    fullLabel: inlinePlace ? `${label} · ${inlinePlace}` : label,
  };
}
