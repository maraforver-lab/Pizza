export type QuickPizzaShape = "round" | "rectangular";
export type QuickPizzaSizingMode = "ball-weight" | "round" | "pan" | "custom";
export type QuickPizzaStyleId = "neapolitan" | "new-york" | "roman-round" | "detroit" | "sicilian" | "custom";

export type QuickPizzaStylePreset = {
  id: QuickPizzaStyleId;
  label: string;
  shape: QuickPizzaShape;
  preferredSizingMode: QuickPizzaSizingMode;
  defaultBallWeightGrams: number;
  defaultDiameterCm?: number;
  defaultPanWidthCm?: number;
  defaultPanLengthCm?: number;
  defaultThicknessFactor?: number;
  defaultDoughLoadingGramsPerSquareCm?: number;
};

export type QuickPizzaSizingInput = {
  sizingMode: QuickPizzaSizingMode;
  pizzaStyle: QuickPizzaStyleId;
  quantity: number;
  ballWeightGrams: number;
  diameterCm: number;
  panWidthCm: number;
  panLengthCm: number;
  thicknessFactor: number;
  doughLoadingGramsPerSquareCm: number;
  customDoughWeightGrams: number;
};

export type QuickPizzaSizingResult = {
  mode: QuickPizzaSizingMode;
  style: QuickPizzaStylePreset;
  quantity: number;
  doughWeightPerPieceGrams: number;
  totalDoughWeightGrams: number;
  areaSquareCm?: number;
  loadingGramsPerSquareCm?: number;
  diameterCm?: number;
  panWidthCm?: number;
  panLengthCm?: number;
};

export const quickPizzaStylePresets: QuickPizzaStylePreset[] = [
  {
    id: "neapolitan",
    label: "Neapolitan",
    shape: "round",
    preferredSizingMode: "ball-weight",
    defaultBallWeightGrams: 260,
    defaultDiameterCm: 32,
    defaultThicknessFactor: 0.32,
  },
  {
    id: "new-york",
    label: "New York",
    shape: "round",
    preferredSizingMode: "round",
    defaultBallWeightGrams: 320,
    defaultDiameterCm: 38,
    defaultThicknessFactor: 0.28,
  },
  {
    id: "roman-round",
    label: "Roman round",
    shape: "round",
    preferredSizingMode: "round",
    defaultBallWeightGrams: 220,
    defaultDiameterCm: 32,
    defaultThicknessFactor: 0.27,
  },
  {
    id: "detroit",
    label: "Detroit",
    shape: "rectangular",
    preferredSizingMode: "pan",
    defaultBallWeightGrams: 650,
    defaultPanWidthCm: 25,
    defaultPanLengthCm: 35,
    defaultDoughLoadingGramsPerSquareCm: 0.74,
  },
  {
    id: "sicilian",
    label: "Sicilian",
    shape: "rectangular",
    preferredSizingMode: "pan",
    defaultBallWeightGrams: 750,
    defaultPanWidthCm: 30,
    defaultPanLengthCm: 40,
    defaultDoughLoadingGramsPerSquareCm: 0.63,
  },
  {
    id: "custom",
    label: "Custom",
    shape: "round",
    preferredSizingMode: "custom",
    defaultBallWeightGrams: 260,
    defaultDiameterCm: 32,
    defaultPanWidthCm: 30,
    defaultPanLengthCm: 40,
    defaultThicknessFactor: 0.32,
    defaultDoughLoadingGramsPerSquareCm: 0.65,
  },
];

const clamp = (value: number, min: number, max: number) => (
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
);

export function quickPizzaStylePresetById(id: QuickPizzaStyleId | undefined) {
  return quickPizzaStylePresets.find((preset) => preset.id === id) ?? quickPizzaStylePresets[0];
}

export function roundPizzaAreaSquareCm(diameterCm: number) {
  const radius = diameterCm / 2;
  return Math.PI * radius * radius;
}

export function rectangularPizzaAreaSquareCm(widthCm: number, lengthCm: number) {
  return widthCm * lengthCm;
}

export function deriveRoundDoughWeightGrams(diameterCm: number, thicknessFactor: number) {
  return Math.round(roundPizzaAreaSquareCm(diameterCm) * thicknessFactor);
}

export function derivePanDoughWeightGrams(widthCm: number, lengthCm: number, doughLoadingGramsPerSquareCm: number) {
  return Math.round(rectangularPizzaAreaSquareCm(widthCm, lengthCm) * doughLoadingGramsPerSquareCm);
}

export function normalizeQuickPizzaSizingInput(input: QuickPizzaSizingInput): QuickPizzaSizingInput {
  const style = quickPizzaStylePresetById(input.pizzaStyle);
  const sizingModes: QuickPizzaSizingMode[] = ["ball-weight", "round", "pan", "custom"];
  const mode = sizingModes.includes(input.sizingMode) ? input.sizingMode : style.preferredSizingMode;

  return {
    sizingMode: mode,
    pizzaStyle: style.id,
    quantity: Math.round(clamp(input.quantity, 1, 50)),
    ballWeightGrams: clamp(input.ballWeightGrams, 100, 1000),
    diameterCm: clamp(input.diameterCm, 10, 80),
    panWidthCm: clamp(input.panWidthCm, 10, 80),
    panLengthCm: clamp(input.panLengthCm, 10, 120),
    thicknessFactor: clamp(input.thicknessFactor, 0.15, 0.75),
    doughLoadingGramsPerSquareCm: clamp(input.doughLoadingGramsPerSquareCm, 0.25, 1.2),
    customDoughWeightGrams: clamp(input.customDoughWeightGrams, 100, 2000),
  };
}

export function applyQuickPizzaStylePreset(input: QuickPizzaSizingInput, styleId: QuickPizzaStyleId): QuickPizzaSizingInput {
  const preset = quickPizzaStylePresetById(styleId);
  return normalizeQuickPizzaSizingInput({
    ...input,
    pizzaStyle: preset.id,
    sizingMode: preset.preferredSizingMode,
    ballWeightGrams: preset.defaultBallWeightGrams,
    diameterCm: preset.defaultDiameterCm ?? input.diameterCm,
    panWidthCm: preset.defaultPanWidthCm ?? input.panWidthCm,
    panLengthCm: preset.defaultPanLengthCm ?? input.panLengthCm,
    thicknessFactor: preset.defaultThicknessFactor ?? input.thicknessFactor,
    doughLoadingGramsPerSquareCm: preset.defaultDoughLoadingGramsPerSquareCm ?? input.doughLoadingGramsPerSquareCm,
    customDoughWeightGrams: preset.defaultBallWeightGrams,
  });
}

export function calculateQuickPizzaSizing(input: QuickPizzaSizingInput): QuickPizzaSizingResult {
  const normalized = normalizeQuickPizzaSizingInput(input);
  const style = quickPizzaStylePresetById(normalized.pizzaStyle);

  if (normalized.sizingMode === "round") {
    const areaSquareCm = roundPizzaAreaSquareCm(normalized.diameterCm);
    const doughWeightPerPieceGrams = deriveRoundDoughWeightGrams(normalized.diameterCm, normalized.thicknessFactor);
    return {
      mode: "round",
      style,
      quantity: normalized.quantity,
      doughWeightPerPieceGrams,
      totalDoughWeightGrams: doughWeightPerPieceGrams * normalized.quantity,
      areaSquareCm,
      loadingGramsPerSquareCm: normalized.thicknessFactor,
      diameterCm: normalized.diameterCm,
    };
  }

  if (normalized.sizingMode === "pan") {
    const areaSquareCm = rectangularPizzaAreaSquareCm(normalized.panWidthCm, normalized.panLengthCm);
    const doughWeightPerPieceGrams = derivePanDoughWeightGrams(
      normalized.panWidthCm,
      normalized.panLengthCm,
      normalized.doughLoadingGramsPerSquareCm,
    );
    return {
      mode: "pan",
      style,
      quantity: normalized.quantity,
      doughWeightPerPieceGrams,
      totalDoughWeightGrams: doughWeightPerPieceGrams * normalized.quantity,
      areaSquareCm,
      loadingGramsPerSquareCm: normalized.doughLoadingGramsPerSquareCm,
      panWidthCm: normalized.panWidthCm,
      panLengthCm: normalized.panLengthCm,
    };
  }

  const doughWeightPerPieceGrams = normalized.sizingMode === "custom"
    ? normalized.customDoughWeightGrams
    : normalized.ballWeightGrams;

  return {
    mode: normalized.sizingMode,
    style,
    quantity: normalized.quantity,
    doughWeightPerPieceGrams,
    totalDoughWeightGrams: doughWeightPerPieceGrams * normalized.quantity,
  };
}
