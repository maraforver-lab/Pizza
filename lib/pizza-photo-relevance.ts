export type PizzaPhotoRelevanceReasonCode =
  | "clear_pizza_photo"
  | "pizza_slice_photo"
  | "pizza_dough_photo"
  | "pizza_prep_photo"
  | "not_pizza_related"
  | "uncertain"
  | "validation_failed";

export type PizzaPhotoRelevanceResult = {
  approved: boolean;
  isPizzaRelated: boolean;
  confidence: number;
  reasonCode: PizzaPhotoRelevanceReasonCode;
  checkedAt: string;
};

type RelevanceFetch = typeof fetch;

const approvedReasonCodes = new Set<PizzaPhotoRelevanceReasonCode>([
  "clear_pizza_photo",
  "pizza_slice_photo",
  "pizza_dough_photo",
  "pizza_prep_photo",
]);

export const PIZZA_PHOTO_RELEVANCE_MODEL = "gpt-4.1-mini";
export const PIZZA_PHOTO_RELEVANCE_CONFIDENCE_THRESHOLD = 0.70;
export const PIZZA_PHOTO_RELEVANCE_TIMEOUT_MS = 10_000;
export const PIZZA_PHOTO_RELEVANCE_ERROR = "We couldn’t verify this as a pizza photo. Please upload a clear photo of your pizza.";
export const PIZZA_PHOTO_RELEVANCE_CHECK_ERROR = "We couldn’t check this photo right now. Please try another image.";

const pizzaPhotoRelevancePrompt = `You are validating an uploaded image for DoughTools, a pizza-making app.
Decide whether the image is primarily about pizza, pizza dough, pizza baking, or pizza preparation.
Accept finished pizza, pizza slice, pizza in oven, pizza on peel/board/tray/plate, dough balls, dough preparation, or pizza preparation where pizza or dough is the main subject.
Reject people/selfies/fashion/underwear/model photos, animals, screenshots, documents, receipts, memes, unrelated food, unrelated objects, landscapes, and uncertain images.
Return JSON only with:
{
  "isPizzaRelated": boolean,
  "confidence": number,
  "reasonCode": "clear_pizza_photo" | "pizza_slice_photo" | "pizza_dough_photo" | "pizza_prep_photo" | "not_pizza_related" | "uncertain"
}`;

function result(
  reasonCode: PizzaPhotoRelevanceReasonCode,
  options: { isPizzaRelated?: boolean; confidence?: number; checkedAt?: string } = {},
): PizzaPhotoRelevanceResult {
  const confidence = typeof options.confidence === "number" && Number.isFinite(options.confidence)
    ? Math.max(0, Math.min(1, options.confidence))
    : 0;
  const isPizzaRelated = options.isPizzaRelated === true;
  const approved = isPizzaRelated
    && confidence >= PIZZA_PHOTO_RELEVANCE_CONFIDENCE_THRESHOLD
    && approvedReasonCodes.has(reasonCode);

  return {
    approved,
    isPizzaRelated,
    confidence,
    reasonCode,
    checkedAt: options.checkedAt ?? new Date().toISOString(),
  };
}

function responseOutputText(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const outputText = (value as { output_text?: unknown }).output_text;
  if (typeof outputText === "string" && outputText.trim()) return outputText;

  const output = (value as { output?: unknown }).output;
  if (!Array.isArray(output)) return undefined;
  for (const item of output) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object" || Array.isArray(contentItem)) continue;
      const text = (contentItem as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  return undefined;
}

function parsePizzaPhotoRelevancePayload(payload: unknown): PizzaPhotoRelevanceResult {
  const text = responseOutputText(payload);
  if (!text) return result("validation_failed");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return result("validation_failed");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return result("validation_failed");
  const record = parsed as Record<string, unknown>;
  const reasonCode = typeof record.reasonCode === "string" ? record.reasonCode : undefined;
  if (
    reasonCode !== "clear_pizza_photo"
    && reasonCode !== "pizza_slice_photo"
    && reasonCode !== "pizza_dough_photo"
    && reasonCode !== "pizza_prep_photo"
    && reasonCode !== "not_pizza_related"
    && reasonCode !== "uncertain"
  ) return result("validation_failed");

  const confidence = typeof record.confidence === "number" && Number.isFinite(record.confidence)
    ? record.confidence
    : undefined;
  if (confidence === undefined) return result("validation_failed");

  return result(reasonCode, {
    isPizzaRelated: record.isPizzaRelated === true,
    confidence,
  });
}

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function validatePizzaPhotoRelevance(
  file: File,
  options: {
    apiKey?: string;
    fetcher?: RelevanceFetch;
    timeoutMs?: number;
  } = {},
): Promise<PizzaPhotoRelevanceResult> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return result("validation_failed");

  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? PIZZA_PHOTO_RELEVANCE_TIMEOUT_MS);

  try {
    const response = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PIZZA_PHOTO_RELEVANCE_MODEL,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: pizzaPhotoRelevancePrompt,
              },
              {
                type: "input_image",
                image_url: await fileToDataUrl(file),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "pizza_photo_relevance",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                isPizzaRelated: { type: "boolean" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reasonCode: {
                  type: "string",
                  enum: [
                    "clear_pizza_photo",
                    "pizza_slice_photo",
                    "pizza_dough_photo",
                    "pizza_prep_photo",
                    "not_pizza_related",
                    "uncertain",
                  ],
                },
              },
              required: ["isPizzaRelated", "confidence", "reasonCode"],
            },
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) return result("validation_failed");
    const payload = await response.json().catch(() => undefined);
    return parsePizzaPhotoRelevancePayload(payload);
  } catch {
    return result("validation_failed");
  } finally {
    clearTimeout(timeout);
  }
}
