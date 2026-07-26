export const QUICK_CALCULATOR_PROTOTYPE_IDS = ["instant", "guided", "workbench"] as const;

export type QuickCalculatorPrototypeId = (typeof QUICK_CALCULATOR_PROTOTYPE_IDS)[number];

export type QuickCalculatorPrototypeMetadata = {
  id: QuickCalculatorPrototypeId;
  name: string;
  purpose: string;
  status: "prototype";
  previewAvailable: boolean;
};

export const quickCalculatorPrototypeMetadata = [
  {
    id: "instant",
    name: "Instant Recipe",
    purpose: "Mobile-first result hierarchy with the recipe visible before deeper controls.",
    status: "prototype",
    previewAvailable: true,
  },
  {
    id: "guided",
    name: "Guided Builder",
    purpose: "A short staged flow for users who want one practical question at a time.",
    status: "prototype",
    previewAvailable: true,
  },
  {
    id: "workbench",
    name: "Calculator Workbench",
    purpose: "A professional two-pane workspace for faster repeat use and technical control.",
    status: "prototype",
    previewAvailable: true,
  },
] as const satisfies readonly QuickCalculatorPrototypeMetadata[];

export function isQuickCalculatorPrototypeId(value: string): value is QuickCalculatorPrototypeId {
  return QUICK_CALCULATOR_PROTOTYPE_IDS.includes(value as QuickCalculatorPrototypeId);
}

export function getQuickCalculatorPrototypeMetadata(value: string): QuickCalculatorPrototypeMetadata | null {
  if (!isQuickCalculatorPrototypeId(value)) return null;
  return quickCalculatorPrototypeMetadata.find((prototype) => prototype.id === value) ?? null;
}
