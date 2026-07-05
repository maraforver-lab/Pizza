import {
  cloudPizzaSessionDetailSummary,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession, type PizzaSession } from "@/lib/pizza-session";

export const PIZZA_PHOTO_OVERLAY_SIZE = 1080;
export const PIZZA_PHOTO_OVERLAY_FILE_NAME = "doughtools-pizza-bake.png";
export const PIZZA_PHOTO_OVERLAY_MIME_TYPE = "image/png";
export const PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK = "Download the image and upload it to Instagram.";

export type PizzaPhotoOverlayField = {
  label: string;
  value: string;
};

export type PizzaPhotoOverlayModel = {
  title: "DoughTools Bake";
  brandLine: "Planned with DoughTools";
  siteLine: "doughtools.app";
  fields: PizzaPhotoOverlayField[];
};

function compactDoughBalls(session: PizzaSession) {
  const balls = session.recipeSnapshot?.balls ?? session.pizzaCount;
  const ballWeight = session.recipeSnapshot?.ballWeight ?? session.doughBallWeight;
  if (!balls || !ballWeight) return undefined;
  return `${balls} × ${ballWeight} g`;
}

function removePrefix(value: string | undefined, prefix: string) {
  if (!value) return undefined;
  return value.startsWith(prefix) ? value.slice(prefix.length).trim() : value.trim();
}

function ratingValue(value: string | undefined) {
  const rating = removePrefix(value, "Rating:");
  return rating ? `Rating ${rating}` : undefined;
}

export function buildPizzaPhotoOverlayModel(row: CloudPizzaSessionRow): PizzaPhotoOverlayModel | null {
  const session = migratePizzaSession(row.session_data);
  if (!session?.photo?.url) return null;
  const summary = cloudPizzaSessionDetailSummary(row);
  const hydration = removePrefix(summary.hydrationLine, "Hydration:");
  const fermentation = removePrefix(summary.fermentationLine, "Fermentation:");
  const doughBalls = compactDoughBalls(session);
  const rating = ratingValue(summary.review.ratingLine);

  const fields: PizzaPhotoOverlayField[] = [
    hydration ? { label: "Hydration", value: hydration } : null,
    fermentation ? { label: "Fermentation", value: fermentation } : null,
    doughBalls ? { label: "Dough balls", value: doughBalls } : null,
    rating ? { label: "Rating", value: rating } : null,
  ].filter((field): field is PizzaPhotoOverlayField => Boolean(field));

  return {
    title: "DoughTools Bake",
    brandLine: "Planned with DoughTools",
    siteLine: "doughtools.app",
    fields,
  };
}
