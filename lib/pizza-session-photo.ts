import type { PizzaSessionPhoto } from "@/lib/pizza-session";

export const PIZZA_SESSION_PHOTO_BUCKET = "pizza-session-photos";
export const PIZZA_SESSION_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PIZZA_SESSION_PHOTO_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PIZZA_SESSION_PHOTO_OUTPUT_TYPE = "image/webp";
export const PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES = 800 * 1024;
export const PIZZA_SESSION_PHOTO_MAX_DIMENSION = 1200;
export const PIZZA_SESSION_PHOTO_MIN_DIMENSION = 600;
export const PIZZA_SESSION_PHOTO_WEBP_QUALITY = 0.70;
export const PIZZA_SESSION_PHOTO_MIN_WEBP_QUALITY = 0.40;
export const PIZZA_SESSION_PHOTO_DIMENSION_STEPS = [1200, 1000, 900, 800, 700, 600] as const;
export const PIZZA_SESSION_PHOTO_QUALITY_STEPS = [0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40] as const;

export const PIZZA_SESSION_PHOTO_TYPE_ERROR = "Please upload a JPG, PNG or WebP image.";
export const PIZZA_SESSION_PHOTO_SIZE_ERROR = "Please choose a photo under 5 MB, or reduce the photo size before uploading.";
export const PIZZA_SESSION_PHOTO_UPLOAD_ERROR = "Could not upload pizza photo. Please try again.";
export const PIZZA_SESSION_PHOTO_PROCESS_ERROR = "Could not process this photo. Please try a JPG version or a smaller image.";
export const PIZZA_SESSION_PHOTO_COMPRESS_ERROR = "Could not compress pizza photo enough. Please try a smaller image.";
export const PIZZA_SESSION_PHOTO_HEIC_ERROR = "Please upload a JPG, PNG or WebP image. iPhone HEIC photos are not supported yet.";

const extensionByContentType: Record<(typeof PIZZA_SESSION_PHOTO_ACCEPTED_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAcceptedPizzaSessionPhotoType(value: string): value is (typeof PIZZA_SESSION_PHOTO_ACCEPTED_TYPES)[number] {
  return PIZZA_SESSION_PHOTO_ACCEPTED_TYPES.includes(value as (typeof PIZZA_SESSION_PHOTO_ACCEPTED_TYPES)[number]);
}

export function isUnsupportedHeicPizzaSessionPhoto(file: Pick<File, "name" | "type">) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === "image/heic"
    || type === "image/heif"
    || name.endsWith(".heic")
    || name.endsWith(".heif");
}

export function pizzaSessionPhotoTypeErrorFor(file: Pick<File, "name" | "type">) {
  if (isUnsupportedHeicPizzaSessionPhoto(file)) return PIZZA_SESSION_PHOTO_HEIC_ERROR;
  return PIZZA_SESSION_PHOTO_TYPE_ERROR;
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
    compressionQuality: finitePositivePhotoNumber(record.compressionQuality),
    maxDimensionUsed: finitePositivePhotoNumber(record.maxDimensionUsed),
    url: typeof record.url === "string" && record.url.trim() ? record.url.trim() : undefined,
  };
}
