import type {
  FermentationMode,
  OvenType,
  PlanningFermentationTimeline,
  PlanningFermentationTimelinePhase,
  PlanningFermentationTimelineStep,
  PlanningFermentationTimelineStepType,
  UserLevel,
} from "@/lib/planning-types";

type PlanningFermentationTimelineInput = {
  userLevel: UserLevel;
  ovenType: OvenType;
  fermentationMode: FermentationMode;
  availableFermentationHours: number;
  roomTemperature: number;
  fridgeTemperature: number;
};

type TimelineStepDefinition = {
  stepType: PlanningFermentationTimelineStepType;
  phase: PlanningFermentationTimelinePhase;
  title: string;
  instruction: string;
  relativeTiming: string;
  durationMinutes: number | null;
  note: string | null;
  caution?: string | null;
  temperatureRole: PlanningFermentationTimelineStep["metadata"]["temperatureRole"];
};

export function buildPlanningFermentationTimeline(
  input: PlanningFermentationTimelineInput,
): PlanningFermentationTimeline {
  const normalizedHours = Math.max(0, input.availableFermentationHours);
  const usesColdStep = shouldUseColdStep(input.fermentationMode, normalizedHours);
  const finalProofMinutes = usesColdStep ? 180 : 120;
  const roomTemperatureRestMinutes = usesColdStep ? 120 : null;
  const bulkMinutes = calculateBulkMinutes(normalizedHours, input.fermentationMode);
  const coldMinutes = usesColdStep
    ? Math.max(8 * 60, Math.round(normalizedHours * 60) - (bulkMinutes ?? 0) - finalProofMinutes - 120)
    : null;

  const steps: TimelineStepDefinition[] = [
    {
      stepType: "mix_dough",
      phase: "mixing",
      title: "Mix dough",
      instruction: "Combine the measured ingredients until no dry flour pockets remain.",
      relativeTiming: "First",
      durationMinutes: 20,
      note: "Use the mixing guidance to decide when the dough is mixed enough.",
      caution: input.fermentationMode === "not_recommended"
        ? "The timing window is not recommended, so treat this as a fallback action sequence."
        : null,
      temperatureRole: "ambient",
    },
    {
      stepType: "initial_rest",
      phase: "fermentation",
      title: "Rest dough",
      instruction: "Let the mixed dough rest so the flour hydrates and the dough relaxes.",
      relativeTiming: "After mixing",
      durationMinutes: 20,
      note: "This rest makes the next handling step easier.",
      temperatureRole: "room",
    },
    {
      stepType: "bulk_fermentation",
      phase: "fermentation",
      title: "Bulk fermentation",
      instruction: usesColdStep
        ? "Start fermentation at room temperature before moving into the cold phase."
        : "Let the dough ferment until it has relaxed and shows signs of activity.",
      relativeTiming: usesColdStep ? "Before cold fermentation" : "Main fermentation window",
      durationMinutes: bulkMinutes,
      note: "Planning Engine v1 keeps this as a broad relative window, not an exact clock schedule.",
      caution: input.roomTemperature >= 26 && input.fermentationMode === "room"
        ? "Warm rooms can make dough move faster than this v1 timeline expects."
        : null,
      temperatureRole: "room",
    },
    ...(usesColdStep ? [
      {
        stepType: "cold_fermentation" as const,
        phase: "fermentation" as const,
        title: "Cold fermentation",
        instruction: "Move the covered dough to the fridge for the long fermentation phase.",
        relativeTiming: "After the room-temperature start",
        durationMinutes: coldMinutes,
        note: "Cold fermentation is included only when the v1 fermentation mode supports it.",
        caution: input.fridgeTemperature > 6
          ? "A warm fridge can make long fermentation less predictable."
          : null,
        temperatureRole: "fridge" as const,
      },
    ] : []),
    {
      stepType: "ball_dough",
      phase: "shaping",
      title: "Ball dough",
      instruction: "Divide the dough into balls and place them in covered containers.",
      relativeTiming: usesColdStep ? "After cold fermentation" : "After bulk fermentation",
      durationMinutes: 20,
      note: "Balling creates the final dough pieces for stretching and baking.",
      temperatureRole: "ambient",
    },
    {
      stepType: "final_proof",
      phase: "proofing",
      title: "Final proof",
      instruction: "Let the dough balls proof until they are relaxed and easier to stretch.",
      relativeTiming: "Before baking",
      durationMinutes: finalProofMinutes,
      note: "Final proof is intentionally broad in v1 because dough condition matters more than a fixed minute count.",
      temperatureRole: "room",
    },
    ...(usesColdStep ? [
      {
        stepType: "room_temperature_rest" as const,
        phase: "proofing" as const,
        title: "Bring dough to room temperature",
        instruction: "Let cold dough warm up enough to stretch without tearing.",
        relativeTiming: "Before shaping and baking",
        durationMinutes: roomTemperatureRestMinutes,
        note: "This step matters most when dough has been cold-fermented.",
        temperatureRole: "room" as const,
      },
    ] : []),
    {
      stepType: "bake",
      phase: "baking",
      title: "Bake",
      instruction: input.ovenType === "pizza_oven"
        ? "Bake the pizza hot and fast when the dough is ready."
        : "Bake when the oven is fully preheated and the dough is ready.",
      relativeTiming: "At bake time",
      durationMinutes: input.ovenType === "pizza_oven" ? 2 : 8,
      note: "Bake timing depends on oven performance and is not calculated precisely in this v1 planning layer.",
      temperatureRole: "oven",
    },
  ];

  return {
    version: 1,
    userLevel: input.userLevel,
    fermentationMode: input.fermentationMode,
    totalAvailableHours: normalizedHours,
    usesExactClockTimes: false,
    assumptions: buildTimelineAssumptions(input, usesColdStep),
    steps: steps.map((step, index) => toTimelineStep(step, index, input)),
  };
}

function shouldUseColdStep(mode: FermentationMode, hours: number): boolean {
  return (mode === "cold" || mode === "hybrid") && hours >= 24;
}

function calculateBulkMinutes(hours: number, mode: FermentationMode): number | null {
  if (mode === "not_recommended") return null;
  if (mode === "cold" || mode === "hybrid") return 90;

  const availableMinutes = Math.round(hours * 60);
  const reserveForRestBallProofAndBake = 20 + 20 + 120 + 10;

  return Math.max(60, availableMinutes - reserveForRestBallProofAndBake);
}

function toTimelineStep(
  step: TimelineStepDefinition,
  index: number,
  input: PlanningFermentationTimelineInput,
): PlanningFermentationTimelineStep {
  return {
    id: `${index + 1}-${step.stepType}`,
    stepType: step.stepType,
    phase: step.phase,
    title: step.title,
    instruction: step.instruction,
    relativeTiming: step.relativeTiming,
    durationMinutes: step.durationMinutes,
    note: step.note,
    caution: step.caution ?? null,
    experienceNote: getExperienceNote(input.userLevel, step.stepType),
    metadata: {
      fermentationMode: input.fermentationMode,
      temperatureRole: step.temperatureRole,
      usesExactClockTime: false,
    },
  };
}

function getExperienceNote(
  userLevel: UserLevel,
  stepType: PlanningFermentationTimelineStepType,
): string {
  if (userLevel === "beginner") {
    switch (stepType) {
      case "mix_dough":
        return "Focus on combining everything evenly before moving on.";
      case "bulk_fermentation":
        return "Watch for dough that looks more relaxed and slightly puffy.";
      case "ball_dough":
        return "Make each ball smooth enough to hold its shape.";
      case "final_proof":
      case "room_temperature_rest":
        return "The dough should feel relaxed before you stretch it.";
      case "bake":
        return "Bake when the dough is ready and the oven is fully hot.";
      case "initial_rest":
      case "cold_fermentation":
        return "Keep the dough covered so it does not dry out.";
    }
  }

  if (userLevel === "enthusiast") {
    switch (stepType) {
      case "mix_dough":
        return "Use this step to set hydration and gluten development up gently.";
      case "bulk_fermentation":
        return "Bulk fermentation builds structure, gas and handling quality.";
      case "cold_fermentation":
        return "Cold time slows fermentation and can improve flavor and handling.";
      case "ball_dough":
        return "Balling sets final tension, so avoid tearing or degassing too much.";
      case "final_proof":
      case "room_temperature_rest":
        return "Judge readiness by extensibility and dough condition, not only time.";
      case "bake":
        return "Bake timing should follow oven heat, dough readiness and topping load.";
      case "initial_rest":
        return "A short rest helps flour finish hydrating before stronger handling.";
    }
  }

  return "Pizza Nerd note: v1 uses relative steps; future planning can refine this with dough temperature, room temperature, fridge temperature, yeast amount, flour strength and fermentation style.";
}

function buildTimelineAssumptions(
  input: PlanningFermentationTimelineInput,
  usesColdStep: boolean,
): string[] {
  return [
    "Fermentation timeline v1 is a structured action sequence, not a precise schedule generator.",
    "Steps use relative timing because clock-time scheduling remains outside this isolated planning layer.",
    "Neapolitan-style dough flow is assumed: mix, rest, ferment, ball, proof and bake.",
    `Oven type is considered only for broad bake guidance: ${input.ovenType}.`,
    `Room temperature assumption: ${input.roomTemperature}°C.`,
    `Fridge temperature assumption: ${input.fridgeTemperature}°C.`,
    usesColdStep
      ? "Cold fermentation step is included because the recommended fermentation mode supports cold or hybrid timing."
      : "Cold fermentation step is omitted because it cannot be safely derived from the current v1 recommendation.",
  ];
}
