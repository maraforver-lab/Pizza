import {
  cloudPizzaSessionDetailSummary,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession, type PizzaSessionFlourWRange } from "@/lib/pizza-session";

export const PIZZA_PHOTO_OVERLAY_SIZE = 1080;
export const PIZZA_PHOTO_OVERLAY_FILE_NAME = "doughtools-pizza-bake.png";
export const PIZZA_PHOTO_OVERLAY_MIME_TYPE = "image/png";
export const PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK = "Download the image and upload it to Instagram.";

export type PizzaPhotoOverlayField = {
  label: string;
  value: string;
};

export type PizzaPhotoOverlayModel = {
  brand: "DOUGHTOOLS";
  title: "PIZZA BAKE LOG";
  footer: "planned with doughtools.app";
  ctaQuestion: "Want to make pizza like this?";
  ctaAction: "Plan it with DoughTools";
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

function ratingValue(value: string | undefined) {
  const rating = removePrefix(value, "Rating:");
  return rating || undefined;
}

function splitFermentation(value: string | undefined) {
  const fermentation = removePrefix(value, "Fermentation:");
  if (!fermentation) return {};
  const [plan, place] = fermentation.split(" · ").map((part) => part.trim());
  const planValue = plan
    .replace(/\s+fermentation$/i, "")
    .replace(/h\b/i, "H")
    .toUpperCase();
  const fridgeMatch = place?.match(/fridge\s+(\d+(?:\.\d+)?)\s*°C/i);
  const roomMatch = place?.match(/room\s+(\d+(?:\.\d+)?)\s*°C/i);
  return {
    fermentation: planValue || undefined,
    fridge: fridgeMatch ? `${fridgeMatch[1]}°C` : undefined,
    room: roomMatch ? `${roomMatch[1]}°C` : undefined,
  };
}

function flourWValue(ranges: PizzaSessionFlourWRange[] | undefined) {
  const reliableRanges = [...new Set(ranges ?? [])].flatMap((range) => W_RANGE_LABELS[range] ? [W_RANGE_LABELS[range]] : []);
  return reliableRanges.length ? reliableRanges.join(", ") : undefined;
}

export function buildPizzaPhotoOverlayModel(row: CloudPizzaSessionRow): PizzaPhotoOverlayModel | null {
  const session = migratePizzaSession(row.session_data);
  if (!session?.photo?.url) return null;
  const summary = cloudPizzaSessionDetailSummary(row);
  const hydration = removePrefix(summary.hydrationLine, "Hydration:");
  const fermentation = splitFermentation(summary.fermentationLine);
  const flourW = session.flourSituation === "has_w_range" ? flourWValue(session.availableFlourWRanges) : undefined;
  const rating = ratingValue(summary.review.ratingLine);

  const fields: PizzaPhotoOverlayField[] = [
    hydration ? { label: "HYDRATION", value: hydration } : null,
    fermentation.fermentation ? { label: "FERMENTATION", value: fermentation.fermentation } : null,
    fermentation.fridge ? { label: "FRIDGE", value: fermentation.fridge } : null,
    fermentation.room ? { label: "ROOM", value: fermentation.room } : null,
    flourW ? { label: "FLOUR W", value: flourW } : null,
    rating ? { label: "RATING", value: rating } : null,
  ].filter((field): field is PizzaPhotoOverlayField => Boolean(field));

  return {
    brand: "DOUGHTOOLS",
    title: "PIZZA BAKE LOG",
    footer: "planned with doughtools.app",
    ctaQuestion: "Want to make pizza like this?",
    ctaAction: "Plan it with DoughTools",
    fields,
  };
}
