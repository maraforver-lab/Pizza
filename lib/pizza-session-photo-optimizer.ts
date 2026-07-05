import {
  PIZZA_SESSION_PHOTO_COMPRESS_ERROR,
  PIZZA_SESSION_PHOTO_DIMENSION_STEPS,
  PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES,
  PIZZA_SESSION_PHOTO_MAX_DIMENSION,
  PIZZA_SESSION_PHOTO_MIN_DIMENSION,
  PIZZA_SESSION_PHOTO_MIN_WEBP_QUALITY,
  PIZZA_SESSION_PHOTO_OUTPUT_TYPE,
  PIZZA_SESSION_PHOTO_PROCESS_ERROR,
  PIZZA_SESSION_PHOTO_QUALITY_STEPS,
  PIZZA_SESSION_PHOTO_WEBP_QUALITY,
} from "@/lib/pizza-session-photo";

export type OptimizedPizzaSessionPhoto = {
  file: File;
  originalFileName: string;
  originalContentType: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  compressionQuality: number;
  maxDimensionUsed: number;
};

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

function optimizedFileName(name: string) {
  const baseName = name.replace(/\.[^.]+$/, "").trim() || "pizza-photo";
  return `${baseName}.webp`;
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(PIZZA_SESSION_PHOTO_PROCESS_ERROR));
      element.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(PIZZA_SESSION_PHOTO_PROCESS_ERROR));
    }, PIZZA_SESSION_PHOTO_OUTPUT_TYPE, quality);
  });
}

export async function optimizePizzaSessionPhotoForUpload(file: File): Promise<OptimizedPizzaSessionPhoto> {
  const image = await loadImage(file);
  try {
    if (!image.width || !image.height) throw new Error(PIZZA_SESSION_PHOTO_PROCESS_ERROR);

    for (const maxDimension of PIZZA_SESSION_PHOTO_DIMENSION_STEPS) {
      for (const quality of PIZZA_SESSION_PHOTO_QUALITY_STEPS) {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error(PIZZA_SESSION_PHOTO_PROCESS_ERROR);
        context.drawImage(image.source, 0, 0, width, height);
        const blob = await canvasToBlob(canvas, quality);
        if (blob.size <= PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES) {
          const optimizedFile = new File([blob], optimizedFileName(file.name), {
            type: PIZZA_SESSION_PHOTO_OUTPUT_TYPE,
            lastModified: Date.now(),
          });

          return {
            file: optimizedFile,
            originalFileName: file.name,
            originalContentType: file.type,
            originalSize: file.size,
            optimizedSize: blob.size,
            width,
            height,
            compressionQuality: quality,
            maxDimensionUsed: maxDimension,
          };
        }
      }
    }

    throw new Error(PIZZA_SESSION_PHOTO_COMPRESS_ERROR);
  } catch (error) {
    if (
      error instanceof Error
      && [PIZZA_SESSION_PHOTO_PROCESS_ERROR, PIZZA_SESSION_PHOTO_COMPRESS_ERROR].includes(error.message)
    ) throw error;
    throw new Error(PIZZA_SESSION_PHOTO_PROCESS_ERROR);
  } finally {
    image.cleanup();
  }
}

export const PIZZA_SESSION_PHOTO_OPTIMIZER_SETTINGS = {
  outputType: PIZZA_SESSION_PHOTO_OUTPUT_TYPE,
  initialMaxDimension: PIZZA_SESSION_PHOTO_MAX_DIMENSION,
  minimumMaxDimension: PIZZA_SESSION_PHOTO_MIN_DIMENSION,
  initialQuality: PIZZA_SESSION_PHOTO_WEBP_QUALITY,
  minimumQuality: PIZZA_SESSION_PHOTO_MIN_WEBP_QUALITY,
  hardMaxBytes: PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES,
};
