import { describe, expect, it } from "vitest";
import { createPizzaSession } from "@/lib/pizza-session";
import { buildSessionFermentationDisplay } from "@/lib/session-fermentation-display";

describe("Session selected fermentation display", () => {
  it("prefers the selected 48h cold fermentation plan over a stale recipe snapshot preset", () => {
    const session = createPizzaSession({
      id: "display-selected-48h-cold",
      plannedFermentationHours: 48,
      doughStartMode: "later",
      doughEarliestStartTime: "2026-07-07T18:00:00.000Z",
      recipeSnapshot: {
        fermentation: "12h-room",
      },
    });

    const display = buildSessionFermentationDisplay({
      session,
      snapshot: session.recipeSnapshot,
      basis: {
        fermentationHours: 48,
        fermentationMode: "cold",
        temperatureC: 4,
      },
    });

    expect(display.label).toBe("48h cold fermentation");
    expect(display.placeTemperatureLabel).toBe("Fridge · 4 °C");
    expect(display.fullLabel).toBe("48h cold fermentation · fridge 4 °C");
    expect(display.fullLabel).not.toContain("12h room fermentation");
  });

  it("renders selected 24h cold fermentation with fridge temperature", () => {
    const session = createPizzaSession({
      id: "display-selected-24h-cold",
      plannedFermentationHours: 24,
      recipeSnapshot: {
        fermentation: "12h-room",
      },
    });

    const display = buildSessionFermentationDisplay({
      session,
      snapshot: session.recipeSnapshot,
    });

    expect(display.fullLabel).toBe("24h cold fermentation · fridge 4 °C");
  });

  it("keeps room fermentation labels and room temperature when no selected cold plan exists", () => {
    const session = createPizzaSession({
      id: "display-12h-room",
      recipeSnapshot: {
        fermentation: "12h-room",
      },
    });

    const display = buildSessionFermentationDisplay({
      session,
      snapshot: session.recipeSnapshot,
    });

    expect(display.fullLabel).toBe("12h room fermentation · room 22 °C");
  });
});
