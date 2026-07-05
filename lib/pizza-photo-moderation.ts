export type PizzaPhotoModerationReasonCode =
  | "safe"
  | "unsafe_content"
  | "moderation_failed";

export type PizzaPhotoModerationResult = {
  approved: boolean;
  flagged: boolean;
  reasonCode: PizzaPhotoModerationReasonCode;
  checkedAt: string;
};

type ModerationFetch = typeof fetch;

export const PIZZA_PHOTO_MODERATION_MODEL = "omni-moderation-latest";
export const PIZZA_PHOTO_MODERATION_TIMEOUT_MS = 8_000;
export const PIZZA_PHOTO_UNSAFE_ERROR = "This image can’t be uploaded. Please choose a clear pizza photo instead.";
export const PIZZA_PHOTO_MODERATION_ERROR = "We couldn’t check this photo right now. Please try another image.";

function result(reasonCode: PizzaPhotoModerationReasonCode, checkedAt = new Date().toISOString()): PizzaPhotoModerationResult {
  return {
    approved: reasonCode === "safe",
    flagged: reasonCode === "unsafe_content",
    reasonCode,
    checkedAt,
  };
}

function isFlaggedModerationPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const results = (value as { results?: unknown }).results;
  if (!Array.isArray(results) || results.length === 0) return undefined;
  const first = results[0];
  if (!first || typeof first !== "object" || Array.isArray(first)) return undefined;
  const flagged = (first as { flagged?: unknown }).flagged;
  return typeof flagged === "boolean" ? flagged : undefined;
}

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function moderatePizzaPhotoImage(
  file: File,
  options: {
    apiKey?: string;
    fetcher?: ModerationFetch;
    timeoutMs?: number;
  } = {},
): Promise<PizzaPhotoModerationResult> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return result("moderation_failed");

  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? PIZZA_PHOTO_MODERATION_TIMEOUT_MS);

  try {
    const response = await fetcher("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PIZZA_PHOTO_MODERATION_MODEL,
        input: [
          {
            type: "image_url",
            image_url: {
              url: await fileToDataUrl(file),
            },
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return result("moderation_failed");
    const payload = await response.json().catch(() => undefined);
    const flagged = isFlaggedModerationPayload(payload);
    if (flagged === undefined) return result("moderation_failed");
    return result(flagged ? "unsafe_content" : "safe");
  } catch {
    return result("moderation_failed");
  } finally {
    clearTimeout(timeout);
  }
}
