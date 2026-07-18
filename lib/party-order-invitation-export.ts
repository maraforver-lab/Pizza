const INVITATION_EXPORT_WIDTH = 1080;
const INVITATION_EXPORT_HEIGHT = 1350;
const A4_WIDTH_POINTS = 595.28;
const A4_HEIGHT_POINTS = 841.89;
const A4_MARGIN_POINTS = 32;
export const PARTY_ORDER_EXPORT_QR_IMAGE_SELECTOR = "[data-party-order-export-qr=\"true\"]";
const IMAGE_READY_TIMEOUT_MS = 2500;

type HtmlToImageOptions = {
  backgroundColor: string;
  cacheBust: boolean;
  height: number;
  pixelRatio: number;
  quality?: number;
  width: number;
};

type HtmlToImageCapture = (element: HTMLElement, options: HtmlToImageOptions) => Promise<string>;

type ImageReadyErrorCode =
  | "missing_image"
  | "image_error"
  | "image_timeout"
  | "zero_dimensions";

export class PartyOrderInvitationExportReadinessError extends Error {
  code: ImageReadyErrorCode;

  constructor(code: ImageReadyErrorCode) {
    super(code);
    this.name = "PartyOrderInvitationExportReadinessError";
    this.code = code;
  }
}

function imageHasNaturalDimensions(image: HTMLImageElement) {
  return image.naturalWidth > 0 && image.naturalHeight > 0;
}

function remainingTimeout(deadline: number) {
  return Math.max(1, deadline - Date.now());
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = globalThis.setTimeout(() => reject(new PartyOrderInvitationExportReadinessError("image_timeout")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) globalThis.clearTimeout(timeoutId);
  });
}

function waitForImageLoad(image: HTMLImageElement, timeoutMs: number) {
  if (image.complete && imageHasNaturalDimensions(image)) return Promise.resolve();
  if (image.complete && !imageHasNaturalDimensions(image)) {
    return Promise.reject(new PartyOrderInvitationExportReadinessError("zero_dimensions"));
  }

  return new Promise<void>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
      if (timeoutId) globalThis.clearTimeout(timeoutId);
    };
    const handleLoad = () => {
      cleanup();
      if (imageHasNaturalDimensions(image)) {
        resolve();
      } else {
        reject(new PartyOrderInvitationExportReadinessError("zero_dimensions"));
      }
    };
    const handleError = () => {
      cleanup();
      reject(new PartyOrderInvitationExportReadinessError("image_error"));
    };

    timeoutId = globalThis.setTimeout(() => {
      cleanup();
      reject(new PartyOrderInvitationExportReadinessError("image_timeout"));
    }, timeoutMs);

    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
  });
}

export async function waitForImageReady(
  image: HTMLImageElement | null | undefined,
  timeoutMs = IMAGE_READY_TIMEOUT_MS,
) {
  if (!image) throw new PartyOrderInvitationExportReadinessError("missing_image");
  const deadline = Date.now() + timeoutMs;

  await waitForImageLoad(image, remainingTimeout(deadline));

  if (typeof image.decode === "function") {
    await withTimeout(
      image.decode().catch(() => {
        throw new PartyOrderInvitationExportReadinessError("image_error");
      }),
      remainingTimeout(deadline),
    );
  }

  if (!imageHasNaturalDimensions(image)) {
    throw new PartyOrderInvitationExportReadinessError("zero_dimensions");
  }
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    globalThis.setTimeout(resolve, 0);
  });
}

export async function waitForPartyOrderInvitationExportReady(element: HTMLElement) {
  const image = element.querySelector<HTMLImageElement>(PARTY_ORDER_EXPORT_QR_IMAGE_SELECTOR);
  await waitForImageReady(image);
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForNextFrame();
}

async function defaultPngCapture(element: HTMLElement, options: HtmlToImageOptions) {
  const { toPng } = await import("html-to-image");
  return toPng(element, options);
}

async function defaultJpegCapture(element: HTMLElement, options: HtmlToImageOptions) {
  const { toJpeg } = await import("html-to-image");
  return toJpeg(element, options);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function dataUrlToBytes(dataUrl: string) {
  const [, base64 = ""] = dataUrl.split(",");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeText(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function pdfObject(id: number, body: string | Uint8Array) {
  const prefix = encodeText(`${id} 0 obj\n`);
  const suffix = encodeText("\nendobj\n");
  const bodyBytes = typeof body === "string" ? encodeText(body) : body;
  return concatBytes([prefix, bodyBytes, suffix]);
}

function buildJpegInvitationPdf(jpegBytes: Uint8Array) {
  const availableWidth = A4_WIDTH_POINTS - (A4_MARGIN_POINTS * 2);
  const availableHeight = A4_HEIGHT_POINTS - (A4_MARGIN_POINTS * 2);
  const imageRatio = INVITATION_EXPORT_WIDTH / INVITATION_EXPORT_HEIGHT;
  const availableRatio = availableWidth / availableHeight;
  const drawWidth = imageRatio > availableRatio ? availableWidth : availableHeight * imageRatio;
  const drawHeight = imageRatio > availableRatio ? availableWidth / imageRatio : availableHeight;
  const x = (A4_WIDTH_POINTS - drawWidth) / 2;
  const y = (A4_HEIGHT_POINTS - drawHeight) / 2;
  const drawCommand = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Invite Do\nQ`;
  const imageStream = concatBytes([
    encodeText(`<< /Type /XObject /Subtype /Image /Width ${INVITATION_EXPORT_WIDTH} /Height ${INVITATION_EXPORT_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
    jpegBytes,
    encodeText("\nendstream"),
  ]);
  const contentBytes = encodeText(drawCommand);
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_POINTS} ${A4_HEIGHT_POINTS}] /Resources << /XObject << /Invite 4 0 R >> >> /Contents 5 0 R >>`),
    pdfObject(4, imageStream),
    pdfObject(5, concatBytes([
      encodeText(`<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      encodeText("\nendstream"),
    ])),
  ];

  const header = encodeText("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");
  const chunks = [header];
  const offsets = [0];
  let offset = header.length;
  for (const object of objects) {
    offsets.push(offset);
    chunks.push(object);
    offset += object.length;
  }

  const xrefOffset = offset;
  const xrefRows = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((value) => `${String(value).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");
  chunks.push(encodeText(xrefRows));

  return new Blob([concatBytes(chunks)], { type: "application/pdf" });
}

export async function capturePartyOrderInvitationImageDataUrl(
  element: HTMLElement,
  capture: HtmlToImageCapture = defaultPngCapture,
) {
  await waitForPartyOrderInvitationExportReady(element);
  return capture(element, {
    backgroundColor: "#20251f",
    cacheBust: true,
    height: INVITATION_EXPORT_HEIGHT,
    pixelRatio: 1,
    width: INVITATION_EXPORT_WIDTH,
  });
}

export async function capturePartyOrderInvitationJpegDataUrl(
  element: HTMLElement,
  capture: HtmlToImageCapture = defaultJpegCapture,
) {
  await waitForPartyOrderInvitationExportReady(element);
  return capture(element, {
    backgroundColor: "#20251f",
    cacheBust: true,
    height: INVITATION_EXPORT_HEIGHT,
    pixelRatio: 1,
    quality: 0.94,
    width: INVITATION_EXPORT_WIDTH,
  });
}

export async function downloadPartyOrderInvitationImage(
  element: HTMLElement,
  filename = "doughtools-party-invitation.png",
) {
  const dataUrl = await capturePartyOrderInvitationImageDataUrl(element);
  downloadDataUrl(dataUrl, filename);
}

export async function downloadPartyOrderInvitationPdf(
  element: HTMLElement,
  filename = "doughtools-party-invitation.pdf",
) {
  const dataUrl = await capturePartyOrderInvitationJpegDataUrl(element);
  const pdf = buildJpegInvitationPdf(dataUrlToBytes(dataUrl));
  const url = URL.createObjectURL(pdf);
  try {
    downloadDataUrl(url, filename);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
