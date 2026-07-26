import type { calculateQuickDough } from "@/lib/quick-calculator/quick-dough-calculator";
import {
  quickCalculatorEnvironmentOptions,
  quickCalculatorYeastOptions,
} from "@/lib/quick-calculator/quick-dough-calculator";
import type { ExperienceLevel } from "@/lib/experience-levels";

export const QUICK_RECIPE_IMAGE_WIDTH = 1080;
export const QUICK_RECIPE_IMAGE_HEIGHT = 1350;

type QuickDoughResult = ReturnType<typeof calculateQuickDough>;

function formatGrams(value: number, precise = false) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: precise ? 2 : 0,
    minimumFractionDigits: precise ? 2 : 0,
  }).format(value);
}

function formatTemperature(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
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

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    color?: string;
    font: string;
    maxWidth?: number;
  },
) {
  context.fillStyle = options.color ?? "#1F1F1F";
  context.font = options.font;
  context.fillText(text, x, y, options.maxWidth);
}

function drawIngredientCard(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  context.fillStyle = "#FFFFFF";
  roundedRect(context, x, y, 430, 178, 28);
  context.fill();
  drawText(context, label, x + 34, y + 54, {
    color: "#6B645D",
    font: "900 23px Arial, sans-serif",
  });
  drawText(context, value, x + 34, y + 124, {
    font: "900 58px Arial, sans-serif",
    maxWidth: 360,
  });
}

export function createQuickRecipeImageDataUrl(
  result: QuickDoughResult,
  experienceLevel: ExperienceLevel,
) {
  const canvas = document.createElement("canvas");
  canvas.width = QUICK_RECIPE_IMAGE_WIDTH;
  canvas.height = QUICK_RECIPE_IMAGE_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Recipe image rendering is unavailable in this browser.");
  }

  const environmentLabel = quickCalculatorEnvironmentOptions.find((option) => option.value === result.input.fermentationEnvironment)?.label ?? "Fermentation";
  const yeastLabel = quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Yeast";
  const showHydration = experienceLevel !== "beginner";

  context.fillStyle = "#FFF8F1";
  context.fillRect(0, 0, QUICK_RECIPE_IMAGE_WIDTH, QUICK_RECIPE_IMAGE_HEIGHT);

  context.fillStyle = "#0F3D2E";
  roundedRect(context, 76, 76, 78, 78, 28);
  context.fill();
  drawText(context, "DT", 96, 127, {
    color: "#FFFFFF",
    font: "900 27px Arial, sans-serif",
  });
  drawText(context, "DoughTools", 178, 112, {
    font: "900 34px Arial, sans-serif",
  });
  drawText(context, "doughtools.app", 178, 148, {
    color: "#6B645D",
    font: "700 21px Arial, sans-serif",
  });

  context.fillStyle = "#E94B2E";
  roundedRect(context, 760, 86, 244, 56, 28);
  context.fill();
  drawText(context, "Dough recipe", 793, 123, {
    color: "#FFFFFF",
    font: "900 22px Arial, sans-serif",
  });

  context.fillStyle = "#FFFFFF";
  roundedRect(context, 76, 238, 928, 280, 36);
  context.fill();
  drawText(context, "Dough recipe", 126, 308, {
    color: "#E94B2E",
    font: "900 28px Arial, sans-serif",
  });
  drawText(
    context,
    `${result.input.pizzaCount} dough balls x ${formatGrams(result.sizing.doughWeightPerPieceGrams)} g`,
    126,
    405,
    {
      font: "800 73px Georgia, serif",
      maxWidth: 820,
    },
  );
  drawText(context, `Total dough ${formatGrams(result.ingredients.total)} g`, 126, 480, {
    color: "#0F3D2E",
    font: "900 38px Arial, sans-serif",
  });

  drawIngredientCard(context, "Flour", `${formatGrams(result.ingredients.flour)} g`, 76, 574);
  drawIngredientCard(context, "Water", `${formatGrams(result.ingredients.water)} g`, 574, 574);
  drawIngredientCard(context, "Salt", `${formatGrams(result.ingredients.salt)} g`, 76, 792);
  drawIngredientCard(context, "Yeast", `${formatGrams(result.ingredients.leavener, true)} g`, 574, 792);

  context.fillStyle = "#0F3D2E";
  roundedRect(context, 76, 1040, 928, 196, 32);
  context.fill();
  drawText(
    context,
    `${result.input.fermentationDuration} · ${environmentLabel} · ${formatTemperature(result.input.fermentationTemperatureCelsius)} C`,
    126,
    1118,
    {
      color: "#FFFFFF",
      font: "900 36px Arial, sans-serif",
      maxWidth: 830,
    },
  );
  drawText(
    context,
    showHydration ? `${result.input.hydrationPercent}% hydration · ${yeastLabel}` : "Reliable recommended DoughTools settings",
    126,
    1174,
    {
      color: "rgba(255, 255, 255, 0.74)",
      font: "800 25px Arial, sans-serif",
      maxWidth: 830,
    },
  );
  drawText(context, "Planned with DoughTools", 126, 1272, {
    color: "#6B645D",
    font: "900 22px Arial, sans-serif",
  });
  drawText(context, "doughtools.app", 780, 1272, {
    color: "#6B645D",
    font: "900 22px Arial, sans-serif",
  });

  return canvas.toDataURL("image/png");
}

function dataUrlToBytes(dataUrl: string) {
  const [, encoded = ""] = dataUrl.split(",");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function dataUrlToQuickRecipeFile(
  dataUrl: string,
  filename = "doughtools-dough-recipe.png",
) {
  return new File([dataUrlToBytes(dataUrl)], filename, { type: "image/png" });
}

export function downloadQuickRecipeImageDataUrl(
  dataUrl: string,
  filename = "doughtools-dough-recipe.png",
) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
