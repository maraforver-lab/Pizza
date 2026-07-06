import {
  cloudPizzaSessionDetailSummary,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { buildSessionFlourWGuidance } from "@/lib/session-flour-w-guidance";
import { migratePizzaSession, type PizzaSessionFlourWRange } from "@/lib/pizza-session";

export const PIZZA_PHOTO_OVERLAY_WIDTH = 1080;
export const PIZZA_PHOTO_OVERLAY_HEIGHT = 1350;
export const PIZZA_PHOTO_OVERLAY_FILE_NAME = "doughtools-pizza-bake.png";
export const PIZZA_PHOTO_OVERLAY_MIME_TYPE = "image/png";
export const PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK = "Download the image and upload it to Instagram.";

export type PizzaPhotoOverlayField = {
  label: string;
  value: string;
};

export type PizzaPhotoOverlayModel = {
  brand: "DOUGHTOOLS";
  title: "BAKE LOG";
  footerLabel: "PLANNED, BAKED, DELIVERED";
  footerMain: "WITH DOUGHTOOLS.APP";
  footerWebsite: "doughtools.app";
  fields: PizzaPhotoOverlayField[];
};

const W_RANGE_LABELS: Record<PizzaSessionFlourWRange, string> = {
  w_180_220: "180–220",
  w_220_260: "220–260",
  w_260_300: "260–300",
  w_300_340: "300–340",
  w_340_plus: "340+",
};

function removePrefix(value: string | undefined, prefix: string) {
  if (!value) return undefined;
  return value.startsWith(prefix) ? value.slice(prefix.length).trim() : value.trim();
}

function splitFermentation(value: string | undefined) {
  const fermentation = removePrefix(value, "Fermentation:");
  if (!fermentation) return {};
  const [plan, place] = fermentation.split(" · ").map((part) => part.trim());
  const planMatch = plan.match(/(\d+(?:\.\d+)?)\s*h\s+(room|cold)/i);
  const planValue = plan
    .replace(/\s+fermentation$/i, "")
    .replace(/h\b/i, "H")
    .toUpperCase();
  const fridgeMatch = place?.match(/fridge\s+(\d+(?:\.\d+)?)\s*°C/i);
  const roomMatch = place?.match(/room\s+(\d+(?:\.\d+)?)\s*°C/i);
  return {
    fermentation: planValue || undefined,
    fermentationHours: planMatch ? Number(planMatch[1]) : undefined,
    fermentationMode: planMatch ? planMatch[2].toLowerCase() as "room" | "cold" : undefined,
    fridge: fridgeMatch ? `${fridgeMatch[1]}°C` : undefined,
    room: roomMatch ? `${roomMatch[1]}°C` : undefined,
  };
}

function flourWValue(ranges: PizzaSessionFlourWRange[] | undefined) {
  const reliableRanges = [...new Set(ranges ?? [])].flatMap((range) => W_RANGE_LABELS[range] ? [W_RANGE_LABELS[range]] : []);
  return reliableRanges.length ? reliableRanges.join(", ") : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeFlourWRanges(value: unknown): PizzaSessionFlourWRange[] | undefined {
  if (typeof value === "string") return W_RANGE_LABELS[value as PizzaSessionFlourWRange] ? [value as PizzaSessionFlourWRange] : undefined;
  if (!Array.isArray(value)) return undefined;
  const ranges = [...new Set(value.filter((item): item is PizzaSessionFlourWRange => (
    typeof item === "string" && Boolean(W_RANGE_LABELS[item as PizzaSessionFlourWRange])
  )))];
  return ranges.length ? ranges : undefined;
}

function rawStoredFlourWRanges(value: unknown) {
  if (!isRecord(value)) return undefined;
  return normalizeFlourWRanges(
    value.usedFlourWRanges
    ?? value.usedFlourWRange
    ?? value.selectedFlourWRanges
    ?? value.selectedFlourWRange
    ?? value.flourWRanges
    ?? value.flourWRange,
  );
}

function recommendationLabelValue(value: string | undefined) {
  if (!value) return undefined;
  return value
    .replace(/\bW\s+/g, "")
    .replace(/\s+or\s+/g, " or ")
    .trim();
}

function resolvedFlourWValue({
  row,
  session,
  fermentation,
}: {
  row: CloudPizzaSessionRow;
  session: ReturnType<typeof migratePizzaSession>;
  fermentation: ReturnType<typeof splitFermentation>;
}) {
  const storedRanges = rawStoredFlourWRanges(row.session_data);
  const storedValue = flourWValue(storedRanges);
  if (storedValue) return storedValue;

  const selectedValue = flourWValue(session?.availableFlourWRanges);
  if (selectedValue) return selectedValue;

  if (
    session?.flourSituation === "recommend"
    && typeof fermentation.fermentationHours === "number"
    && fermentation.fermentationMode
  ) {
    const guidance = buildSessionFlourWGuidance({
      fermentationHours: fermentation.fermentationHours,
      fermentationMode: fermentation.fermentationMode,
      flourSituation: session.flourSituation,
      availableFlourWRanges: session.availableFlourWRanges,
      selectedFlourLabel: session.flour ?? "Recommended flour",
    });
    return recommendationLabelValue(guidance.saferChoiceLabel ?? guidance.recommendationLabel);
  }

  return undefined;
}

function bakeTimeValue(ovenType: string | undefined) {
  const normalized = ovenType?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return undefined;
  if (normalized === "gas" || normalized === "pizza_oven") return "90 SEC";
  if (normalized === "home" || normalized === "home_oven") return "5 MIN";
  return undefined;
}

export function buildPizzaPhotoOverlayModel(row: CloudPizzaSessionRow): PizzaPhotoOverlayModel | null {
  const session = migratePizzaSession(row.session_data);
  if (!session?.photo?.url) return null;
  const summary = cloudPizzaSessionDetailSummary(row);
  const hydration = removePrefix(summary.hydrationLine, "Hydration:");
  const fermentation = splitFermentation(summary.fermentationLine);
  const flourW = resolvedFlourWValue({ row, session, fermentation });
  const bakeTime = bakeTimeValue(session.ovenType ?? session.recipeSnapshot?.oven);

  const fields: PizzaPhotoOverlayField[] = [
    hydration ? { label: "HYDRATION", value: hydration } : null,
    fermentation.fermentation ? { label: "FERMENTATION", value: fermentation.fermentation } : null,
    fermentation.fridge ? { label: "FRIDGE", value: fermentation.fridge } : null,
    fermentation.room ? { label: "ROOM", value: fermentation.room } : null,
    flourW ? { label: "FLOUR", value: `W ${flourW}` } : null,
    bakeTime ? { label: "BAKE", value: bakeTime } : null,
  ].filter((field): field is PizzaPhotoOverlayField => Boolean(field));

  return {
    brand: "DOUGHTOOLS",
    title: "BAKE LOG",
    footerLabel: "PLANNED, BAKED, DELIVERED",
    footerMain: "WITH DOUGHTOOLS.APP",
    footerWebsite: "doughtools.app",
    fields,
  };
}
