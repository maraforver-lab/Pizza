"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PIZZA_PHOTO_OVERLAY_FILE_NAME,
  PIZZA_PHOTO_OVERLAY_HEIGHT,
  PIZZA_PHOTO_OVERLAY_MIME_TYPE,
  PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK,
  PIZZA_PHOTO_OVERLAY_WIDTH,
  type PizzaPhotoOverlayModel,
} from "@/lib/pizza-photo-overlay";

type PizzaPhotoOverlayGeneratorProps = {
  model: PizzaPhotoOverlayModel;
  photoUrl: string;
};

const OVERLAY_GREEN = "#3BA66B";
const OVERLAY_WHITE = "#FFF8F1";
const OVERLAY_MUTED = "rgba(255, 248, 241, 0.86)";
const OVERLAY_DIVIDER = "rgba(255, 248, 241, 0.28)";

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load pizza photo for share image."));
    image.src = source;
  });
}

function drawCoverImage(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  const sourceWidth = imageRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
  const sourceHeight = imageRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
  const sourceX = Math.max(0, Math.min(image.naturalWidth - sourceWidth, (image.naturalWidth - sourceWidth) * 0.62));
  const sourceY = Math.max(0, Math.min(image.naturalHeight - sourceHeight, (image.naturalHeight - sourceHeight) * 0.54));
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function drawText(context: CanvasRenderingContext2D, text: string, x: number, y: number, options: {
  color?: string;
  font: string;
  maxWidth?: number;
}) {
  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.5)";
  context.shadowBlur = 16;
  context.shadowOffsetY = 4;
  context.fillStyle = options.color ?? "#1F1F1F";
  context.font = options.font;
  context.fillText(text, x, y, options.maxWidth);
  context.restore();
}

function strokeIcon(context: CanvasRenderingContext2D, label: string, x: number, y: number) {
  context.save();
  context.strokeStyle = OVERLAY_GREEN;
  context.fillStyle = OVERLAY_GREEN;
  context.lineWidth = 4;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (label === "HYDRATION") {
    context.beginPath();
    context.moveTo(x, y - 22);
    context.bezierCurveTo(x - 22, y + 4, x - 22, y + 28, x, y + 28);
    context.bezierCurveTo(x + 22, y + 28, x + 22, y + 4, x, y - 22);
    context.stroke();
  } else if (label === "FERMENTATION") {
    context.beginPath();
    context.arc(x, y + 4, 25, 0, Math.PI * 2);
    context.moveTo(x, y - 12);
    context.lineTo(x, y + 5);
    context.lineTo(x + 13, y + 15);
    context.stroke();
  } else if (label === "FRIDGE" || label === "ROOM") {
    context.beginPath();
    context.moveTo(x, y - 28);
    context.lineTo(x, y + 10);
    context.arc(x, y + 21, 11, -Math.PI * 0.15, Math.PI * 1.15);
    context.moveTo(x - 10, y - 28);
    context.quadraticCurveTo(x - 18, y - 28, x - 18, y - 20);
    context.lineTo(x - 18, y + 8);
    context.moveTo(x + 10, y - 28);
    context.quadraticCurveTo(x + 18, y - 28, x + 18, y - 20);
    context.lineTo(x + 18, y + 8);
    context.stroke();
  } else if (label === "FLOUR") {
    context.beginPath();
    context.moveTo(x, y - 30);
    context.lineTo(x, y + 30);
    context.moveTo(x, y - 18);
    context.lineTo(x - 18, y - 30);
    context.moveTo(x, y - 18);
    context.lineTo(x + 18, y - 30);
    context.moveTo(x, y - 3);
    context.lineTo(x - 20, y - 15);
    context.moveTo(x, y - 3);
    context.lineTo(x + 20, y - 15);
    context.moveTo(x, y + 13);
    context.lineTo(x - 18, y + 1);
    context.moveTo(x, y + 13);
    context.lineTo(x + 18, y + 1);
    context.stroke();
  } else if (label === "PIZZA") {
    context.beginPath();
    context.moveTo(x - 30, y - 32);
    context.quadraticCurveTo(x + 4, y - 46, x + 34, y - 28);
    context.lineTo(x - 6, y + 42);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(x - 4, y - 8, 4, 0, Math.PI * 2);
    context.arc(x + 10, y - 23, 4, 0, Math.PI * 2);
    context.arc(x + 4, y + 14, 4, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(x, y + 30);
    context.bezierCurveTo(x - 28, y + 12, x - 12, y - 8, x - 18, y - 28);
    context.bezierCurveTo(x + 2, y - 15, x + 5, y - 35, x + 13, y - 45);
    context.bezierCurveTo(x + 25, y - 18, x + 38, y + 0, x + 22, y + 27);
    context.bezierCurveTo(x + 12, y + 37, x - 2, y + 37, x, y + 30);
    context.stroke();
  }

  context.restore();
}

function drawOverlay(context: CanvasRenderingContext2D, model: PizzaPhotoOverlayModel, image: HTMLImageElement) {
  const width = PIZZA_PHOTO_OVERLAY_WIDTH;
  const height = PIZZA_PHOTO_OVERLAY_HEIGHT;
  context.clearRect(0, 0, width, height);
  drawCoverImage(context, image, width, height);

  const leftGradient = context.createLinearGradient(0, 0, width * 0.68, 0);
  leftGradient.addColorStop(0, "rgba(0, 0, 0, 0.58)");
  leftGradient.addColorStop(0.45, "rgba(0, 0, 0, 0.28)");
  leftGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = leftGradient;
  context.fillRect(0, 0, width, height);

  const footerGradient = context.createRadialGradient(0, height, 120, 0, height, 620);
  footerGradient.addColorStop(0, "rgba(0, 0, 0, 0.42)");
  footerGradient.addColorStop(0.55, "rgba(0, 0, 0, 0.20)");
  footerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = footerGradient;
  context.fillRect(0, 0, width, height);

  const titleX = 56;
  const titleY = 108;
  drawText(context, model.brand, titleX, titleY, {
    color: OVERLAY_WHITE,
    font: "900 32px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: 390,
  });
  drawText(context, model.title, titleX, titleY + 74, {
    color: OVERLAY_GREEN,
    font: "1000 68px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: 430,
  });
  context.beginPath();
  context.moveTo(titleX, titleY + 112);
  context.lineTo(titleX + 374, titleY + 112);
  context.strokeStyle = OVERLAY_GREEN;
  context.lineWidth = 4;
  context.stroke();

  const fields = model.fields.slice(0, 5);
  const rowX = 56;
  const iconX = 76;
  const dividerX = 120;
  const textX = 136;
  const firstRowY = 312;
  const rowHeight = 123;
  fields.forEach((field, index) => {
    const rowTop = firstRowY + index * rowHeight;
    const iconY = rowTop + 32;
    strokeIcon(context, field.label, iconX, iconY);

    context.beginPath();
    context.moveTo(dividerX, rowTop - 8);
    context.lineTo(dividerX, rowTop + 72);
    context.strokeStyle = OVERLAY_DIVIDER;
    context.lineWidth = 2;
    context.stroke();

    drawText(context, field.label, textX, rowTop + 18, {
      color: OVERLAY_MUTED,
      font: "800 21px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: 260,
    });
    drawText(context, field.value, textX, rowTop + 64, {
      color: OVERLAY_WHITE,
      font: "1000 39px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: 330,
    });

    if (index < fields.length - 1) {
      context.beginPath();
      context.moveTo(rowX, rowTop + 100);
      context.lineTo(rowX + 340, rowTop + 100);
      context.strokeStyle = OVERLAY_DIVIDER;
      context.lineWidth = 1.5;
      context.stroke();
    }
  });

  const footerY = 1188;
  strokeIcon(context, "PIZZA", 82, footerY + 24);
  context.beginPath();
  context.moveTo(132, footerY - 38);
  context.lineTo(132, footerY + 96);
  context.strokeStyle = OVERLAY_DIVIDER;
  context.lineWidth = 2;
  context.stroke();

  const footerTextX = 160;
  drawText(context, model.footerLabel, footerTextX, footerY - 4, {
    color: OVERLAY_WHITE,
    font: "1000 32px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: 620,
  });

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.5)";
  context.shadowBlur = 16;
  context.shadowOffsetY = 4;
  context.font = "1000 32px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const highlightedDomain = "DOUGHTOOLS.APP";
  const footerPrefix = model.footerMain.replace(highlightedDomain, "");
  context.fillStyle = OVERLAY_WHITE;
  context.fillText(footerPrefix, footerTextX, footerY + 36);
  const withWidth = context.measureText(footerPrefix).width;
  context.fillStyle = OVERLAY_GREEN;
  context.fillText(highlightedDomain, footerTextX + withWidth, footerY + 36);
  context.restore();

  drawText(context, model.footerWebsite, footerTextX, footerY + 78, {
    color: OVERLAY_WHITE,
    font: "800 27px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: 440,
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
  canvas.width = PIZZA_PHOTO_OVERLAY_WIDTH;
  canvas.height = PIZZA_PHOTO_OVERLAY_HEIGHT;
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
            className="mx-auto aspect-[4/5] w-full max-w-md rounded-[1.15rem] object-cover"
          />
        </div>
      )}
    </section>
  );
}
