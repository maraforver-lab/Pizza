import type { PizzaSessionPhoto } from "@/lib/pizza-session";

export const PIZZA_SESSION_PHOTO_BUCKET = "pizza-session-photos";
export const PIZZA_SESSION_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PIZZA_SESSION_PHOTO_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PIZZA_SESSION_PHOTO_OUTPUT_TYPE = "image/webp";
export const PIZZA_SESSION_PHOTO_MAX_DIMENSION = 1600;
export const PIZZA_SESSION_PHOTO_WEBP_QUALITY = 0.82;

export const PIZZA_SESSION_PHOTO_TYPE_ERROR = "Please upload a JPG, PNG or WebP image.";
export const PIZZA_SESSION_PHOTO_SIZE_ERROR = "Please upload an image under 5 MB.";
export const PIZZA_SESSION_PHOTO_UPLOAD_ERROR = "Could not upload pizza photo. Please try again.";
export const PIZZA_SESSION_PHOTO_PROCESS_ERROR = "Could not process pizza photo. Please try another image.";

const extensionByContentType: Record<(typeof PIZZA_SESSION_PHOTO_ACCEPTED_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAcceptedPizzaSessionPhotoType(value: string): value is (typeof PIZZA_SESSION_PHOTO_ACCEPTED_TYPES)[number] {
  return PIZZA_SESSION_PHOTO_ACCEPTED_TYPES.includes(value as (typeof PIZZA_SESSION_PHOTO_ACCEPTED_TYPES)[number]);
}

export function pizzaSessionPhotoExtension(contentType: string) {
  return isAcceptedPizzaSessionPhotoType(contentType) ? extensionByContentType[contentType] : undefined;
}

export function finitePositivePhotoNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

export function normalizePizzaSessionPhoto(value: unknown): PizzaSessionPhoto | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const path = typeof record.path === "string" && record.path.trim() ? record.path.trim() : undefined;
  const uploadedAt = typeof record.uploadedAt === "string" && record.uploadedAt.trim() ? record.uploadedAt.trim() : undefined;
  const contentType = typeof record.contentType === "string" && isAcceptedPizzaSessionPhotoType(record.contentType)
    ? record.contentType
    : undefined;
  const size = finitePositivePhotoNumber(record.size);
  if (!path || !uploadedAt || !contentType || !size) return undefined;
  return {
    path,
    uploadedAt,
    contentType,
    size,
    originalFileName: typeof record.originalFileName === "string" && record.originalFileName.trim()
      ? record.originalFileName.trim()
      : undefined,
    originalContentType: typeof record.originalContentType === "string" && isAcceptedPizzaSessionPhotoType(record.originalContentType)
      ? record.originalContentType
      : undefined,
    originalSize: finitePositivePhotoNumber(record.originalSize),
    optimizedSize: finitePositivePhotoNumber(record.optimizedSize),
    width: finitePositivePhotoNumber(record.width),
    height: finitePositivePhotoNumber(record.height),
    url: typeof record.url === "string" && record.url.trim() ? record.url.trim() : undefined,
  };
}
