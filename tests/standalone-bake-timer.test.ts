import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  adjustBakeTimerDuration,
  adjustBakeTimerOvertime,
  createBakeTimerSnapshot,
  deriveBakeTimerSnapshot,
  getBakeTimerPhase,
  isBakeTimerOvertimeAlarmActive,
  pauseBakeTimerSnapshot,
  restartBakeTimerSnapshot,
  resumeBakeTimerSnapshot,
  startBakeTimerSnapshot,
  stopBakeTimerAlarm,
} from "@/lib/bake-timer";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("standalone Bake Timer", () => {
  it("adds the mobile menu link before Quick dough calculator without changing desktop navigation", () => {
    const header = source("components/GlobalToolNavigation.tsx");
    const desktopNavStart = header.indexOf('<nav className="hidden');
    const desktopNavEnd = header.indexOf('<div className="relative lg:hidden">');
    const desktopNav = header.slice(desktopNavStart, desktopNavEnd);
    const bakeTimerIndex = header.indexOf('href: "/tools/bake-timer"');
    const quickCalculatorIndex = header.indexOf('href: "/calculator/quick"');

    expect(header).toContain("Bake timer");
    expect(header).toContain("Time one pizza without starting a Pizza Session.");
    expect(bakeTimerIndex).toBeGreaterThan(-1);
    expect(bakeTimerIndex).toBeLessThan(quickCalculatorIndex);
    expect(header).toContain("data-mobile-tools-extension-point");
    expect(desktopNav).not.toContain("/tools/bake-timer");
    expect(desktopNav).toContain("/calculator/quick");
  });

  it("defines a standalone route with metadata and no authentication or session resolver requirement", () => {
    const page = source("app/tools/bake-timer/page.tsx");
    const tool = source("components/tools/StandaloneBakeTimerTool.tsx");

    expect(page).toContain('metadataForRoute("/tools/bake-timer")');
    expect(page).toContain("StandaloneBakeTimerTool");
    expect(tool).toContain("Bake timer");
    expect(tool).toContain("Choose the oven you are using.");
    expect(tool).toContain("This timer works on its own and does not change your pizza plan.");
    expect(getPizzaSessionBakeProfile("pizza").label).toBe("Pizza oven");
    expect(getPizzaSessionBakeProfile("home").label).toBe("Home oven");
    expect(tool).toContain("For high-temperature pizza ovens.");
    expect(tool).toContain("For a standard home oven with a stone or steel.");
    expect(tool).toContain("BakeTimerPanel");
    expect(tool).toContain("openOnMount");
    expect(tool).toContain("showLauncher={false}");
    expect(tool).toContain("onClose={closeTimer}");
    expect(tool).not.toContain("resolveCanonicalActivePizzaSession");
    expect(tool).not.toContain("getActivePizzaSession");
    expect(tool).not.toContain("setActivePizzaSession");
    expect(tool).not.toContain("queueCloudActivePizzaSessionSave");
    expect(tool).not.toContain("fetch(");
    expect(tool).not.toContain("Done baking? Review session");
    expect(tool).not.toContain("completeKitchenTimelineStep");
  });

  it("uses canonical bake-profile defaults for standalone oven choices", () => {
    const pizzaOven = getPizzaSessionBakeProfile("pizza");
    const homeOven = getPizzaSessionBakeProfile("home");
    const tool = source("components/tools/StandaloneBakeTimerTool.tsx");

    expect(pizzaOven).toMatchObject({
      label: "Pizza oven",
      bakeDurationSeconds: 90,
    });
    expect(homeOven).toMatchObject({
      label: "Home oven",
      bakeDurationSeconds: 300,
    });
    expect(tool).toContain('getPizzaSessionBakeProfile("pizza")');
    expect(tool).toContain('getPizzaSessionBakeProfile("home")');
    expect(tool).not.toContain("const pizzaOvenSeconds = 90");
    expect(tool).not.toContain("const homeOvenSeconds = 300");
  });

  it("keeps the full-screen timer shared between Kitchen and standalone contexts", () => {
    const component = source("components/session/KitchenBakeTimerPanel.tsx");
    const kitchenPage = source("app/session/kitchen/page.tsx");

    expect(component).toContain("export function BakeTimerPanel");
    expect(component).toContain("export function KitchenBakeTimerPanel");
    expect(component).toContain("storageKey?: string");
    expect(component).toContain("storageKey={kitchenBakeTimerStorageKey(sessionId)}");
    expect(component).toContain("openOnMount");
    expect(component).toContain("showLauncher");
    expect(component).toContain("Close bake timer");
    expect(component).toContain("Turn bake timer sound");
    expect(component).toContain("Start next pizza");
    expect(component).toContain("Pizza still baking");
    expect(component).not.toContain("queueCloudActivePizzaSessionSave");
    expect(component).not.toContain("stepRuntime");
    expect(kitchenPage).toContain("KitchenBakeTimerPanel");
    expect(kitchenPage).toContain("Done baking? Review session");
  });

  it("preserves shared timer behavior for standalone use without Kitchen completion", () => {
    const started = startBakeTimerSnapshot(createBakeTimerSnapshot(90), 1_000);
    const running = deriveBakeTimerSnapshot(started, 46_000);
    const paused = pauseBakeTimerSnapshot(running, 46_000);
    const resumed = resumeBakeTimerSnapshot(paused, 60_000);
    const finalTen = deriveBakeTimerSnapshot(started, 81_000);
    const overtime = deriveBakeTimerSnapshot(started, 96_000);
    const adjusted = adjustBakeTimerDuration(running, 10, 46_000);
    const overtimeAdjusted = adjustBakeTimerOvertime(overtime, 30, 96_000);
    const stopped = stopBakeTimerAlarm(overtimeAdjusted, 96_000);
    const nextPizza = restartBakeTimerSnapshot(300, 10_000);

    expect(running).toMatchObject({ status: "running", remainingSeconds: 45 });
    expect(paused).toMatchObject({ status: "paused", remainingSeconds: 45 });
    expect(resumed).toMatchObject({ status: "running", expiresAt: 105_000 });
    expect(adjusted).toMatchObject({ durationSeconds: 100, remainingSeconds: 55 });
    expect(getBakeTimerPhase(finalTen)).toBe("final_ten");
    expect(overtime).toMatchObject({ status: "overtime", overtimeSeconds: 5 });
    expect(isBakeTimerOvertimeAlarmActive(overtimeAdjusted)).toBe(true);
    expect(isBakeTimerOvertimeAlarmActive(stopped)).toBe(false);
    expect(nextPizza).toMatchObject({ status: "running", durationSeconds: 300, remainingSeconds: 300 });
  });
});
