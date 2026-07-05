"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PIZZA_PHOTO_OVERLAY_FILE_NAME,
  PIZZA_PHOTO_OVERLAY_MIME_TYPE,
  PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK,
  PIZZA_PHOTO_OVERLAY_SIZE,
  type PizzaPhotoOverlayModel,
} from "@/lib/pizza-photo-overlay";

type PizzaPhotoOverlayGeneratorProps = {
  model: PizzaPhotoOverlayModel;
  photoUrl: string;
};

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load pizza photo for share image."));
    image.src = source;
  });
}

function drawCoverImage(context: CanvasRenderingContext2D, image: HTMLImageElement, size: number) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = 1;
  const sourceWidth = imageRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
  const sourceHeight = imageRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);
}

function drawText(context: CanvasRenderingContext2D, text: string, x: number, y: number, options: {
  color?: string;
  font: string;
  maxWidth?: number;
}) {
  context.fillStyle = options.color ?? "#1F1F1F";
  context.font = options.font;
  context.fillText(text, x, y, options.maxWidth);
}

function drawOverlay(context: CanvasRenderingContext2D, model: PizzaPhotoOverlayModel, image: HTMLImageElement) {
  const size = PIZZA_PHOTO_OVERLAY_SIZE;
  context.clearRect(0, 0, size, size);
  drawCoverImage(context, image, size);

  const leftGradient = context.createLinearGradient(0, 0, 620, 0);
  leftGradient.addColorStop(0, "rgba(9, 41, 31, 0.68)");
  leftGradient.addColorStop(0.52, "rgba(9, 41, 31, 0.28)");
  leftGradient.addColorStop(1, "rgba(9, 41, 31, 0)");
  context.fillStyle = leftGradient;
  context.fillRect(0, 0, size, size);

  const panelX = 44;
  const panelY = 44;
  const panelWidth = 342;
  const panelHeight = 992;
  roundedRect(context, panelX, panelY, panelWidth, panelHeight, 34);
  context.fillStyle = "rgba(9, 29, 23, 0.68)";
  context.fill();
  context.strokeStyle = "rgba(255, 248, 241, 0.22)";
  context.lineWidth = 1.5;
  context.stroke();

  context.beginPath();
  context.moveTo(panelX + 36, panelY + 164);
  context.lineTo(panelX + panelWidth - 36, panelY + 164);
  context.strokeStyle = "rgba(59, 166, 107, 0.75)";
  context.lineWidth = 3;
  context.stroke();

  drawText(context, model.brand, panelX + 36, panelY + 64, {
    color: "#F9F1E7",
    font: "900 30px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: panelWidth - 72,
  });
  drawText(context, model.title, panelX + 36, panelY + 114, {
    color: "#3BA66B",
    font: "900 38px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: panelWidth - 72,
  });

  const fields = model.fields.slice(0, 6);
  const fieldTop = panelY + 238;
  fields.forEach((field, index) => {
    const x = panelX + 36;
    const y = fieldTop + index * 104;
    context.beginPath();
    context.arc(x + 5, y - 8, 5, 0, Math.PI * 2);
    context.fillStyle = "#3BA66B";
    context.fill();
    drawText(context, field.label, x + 22, y, {
      color: "rgba(249, 241, 231, 0.62)",
      font: "900 20px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: panelWidth - 72,
    });
    drawText(context, field.value, x, y + 44, {
      color: "#FFF8F1",
      font: "900 38px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: panelWidth - 72,
    });
  });

  context.beginPath();
  context.moveTo(panelX + 36, panelY + panelHeight - 124);
  context.lineTo(panelX + panelWidth - 36, panelY + panelHeight - 124);
  context.strokeStyle = "rgba(255, 248, 241, 0.2)";
  context.lineWidth = 1.5;
  context.stroke();

  drawText(context, model.footer, panelX + 36, panelY + panelHeight - 74, {
    color: "#FFF8F1",
    font: "800 23px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: panelWidth - 72,
  });
  drawText(context, model.tagline, panelX + 36, panelY + panelHeight - 38, {
    color: "rgba(249, 241, 231, 0.62)",
    font: "800 20px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: panelWidth - 72,
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create share image."));
    }, PIZZA_PHOTO_OVERLAY_MIME_TYPE);
  });
}

async function createOverlayBlob(photoUrl: string, model: PizzaPhotoOverlayModel) {
  const image = await loadImage(photoUrl);
  const canvas = document.createElement("canvas");
  canvas.width = PIZZA_PHOTO_OVERLAY_SIZE;
  canvas.height = PIZZA_PHOTO_OVERLAY_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create share image.");
  drawOverlay(context, model, image);
  return canvasToBlob(canvas);
}

export function PizzaPhotoOverlayGenerator({ model, photoUrl }: PizzaPhotoOverlayGeneratorProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(() => {
    const testFile = typeof File !== "undefined"
      ? new File([""], PIZZA_PHOTO_OVERLAY_FILE_NAME, { type: PIZZA_PHOTO_OVERLAY_MIME_TYPE })
      : null;
    setCanShareFiles(Boolean(
      testFile
      && typeof navigator !== "undefined"
      && "share" in navigator
      && "canShare" in navigator
      && navigator.canShare({ files: [testFile] }),
    ));
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const supportText = useMemo(() => (
    canShareFiles ? "Share directly from your device, or download it for your camera roll." : PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK
  ), [canShareFiles]);

  const generate = async () => {
    setIsGenerating(true);
    setError("");
    setMessage("");
    try {
      return await createOverlayBlob(photoUrl, model);
    } catch {
      setError("Could not create the share image. Please try again.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const preview = async () => {
    const blob = await generate();
    if (!blob) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
    setMessage("Share image preview ready");
  };

  const download = async () => {
    const blob = await generate();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = PIZZA_PHOTO_OVERLAY_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Share image downloaded");
  };

  const share = async () => {
    if (!canShareFiles) {
      setMessage(PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK);
      return;
    }
    const blob = await generate();
    if (!blob) return;
    const file = new File([blob], PIZZA_PHOTO_OVERLAY_FILE_NAME, { type: PIZZA_PHOTO_OVERLAY_MIME_TYPE });
    try {
      await navigator.share({
        files: [file],
        title: "DoughTools Bake",
        text: "Planned with DoughTools",
      });
      setMessage("Share image ready");
    } catch {
      setMessage(PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK);
    }
  };

  return (
    <section className="mt-6 rounded-[1.5rem] border border-leaf/15 bg-cream/70 p-4 sm:p-5" aria-labelledby="pizza-photo-overlay-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Share your bake</p>
          <h2 id="pizza-photo-overlay-heading" className="mt-2 font-display text-3xl font-semibold">Share your bake</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Create a DoughTools-branded image with your pizza setup for Instagram or your camera roll.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={preview}
          disabled={isGenerating}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-leaf/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Creating image…" : "Preview share image"}
        </button>
        <button
          type="button"
          onClick={download}
          disabled={isGenerating}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--dt-primary)] px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-[var(--dt-primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf disabled:cursor-not-allowed disabled:opacity-60"
        >
          Download image
        </button>
        <button
          type="button"
          onClick={share}
          disabled={isGenerating || !canShareFiles}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-leaf/20 bg-leaf/10 px-4 text-sm font-extrabold text-leaf transition hover:border-leaf/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf disabled:cursor-not-allowed disabled:opacity-50"
        >
          Share image
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-ink/55">{supportText}</p>
      {message && <p role="status" className="mt-3 text-sm font-extrabold text-leaf">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{error}</p>}

      {previewUrl && (
        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white p-2 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="DoughTools branded pizza bake image"
            className="mx-auto aspect-square w-full max-w-md rounded-[1.15rem] object-cover"
          />
        </div>
      )}
    </section>
  );
}
