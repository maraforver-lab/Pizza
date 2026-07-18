import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  bakeTimerDisplayValue,
  createBakeTimerSnapshot,
  deriveBakeTimerSnapshot,
  formatBakeTimerClock,
  normalizeBakeTimerDuration,
  startBakeTimerSnapshot,
} from "@/lib/bake-timer";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Kitchen bake timer integration", () => {
  it("keeps shared bake timer core deterministic and display-only", () => {
    expect(formatBakeTimerClock(90)).toBe("01:30");
    expect(formatBakeTimerClock(300)).toBe("05:00");
    expect(normalizeBakeTimerDuration(1)).toBe(10);
    expect(normalizeBakeTimerDuration(2_000)).toBe(1_800);

    const started = startBakeTimerSnapshot(createBakeTimerSnapshot(90), 1_000);
    expect(deriveBakeTimerSnapshot(started, 46_000)).toMatchObject({
      status: "running",
      remainingSeconds: 45,
      overtimeSeconds: 0,
    });

    const overtime = deriveBakeTimerSnapshot(started, 96_000);
    expect(overtime).toMatchObject({
      status: "overtime",
      remainingSeconds: 0,
      overtimeSeconds: 5,
    });
    expect(bakeTimerDisplayValue(overtime)).toBe("+00:05");
  });

  it("uses the canonical Pizza Session bake profile durations", () => {
    expect(getPizzaSessionBakeProfile("home")).toMatchObject({
      bakeDurationSeconds: 300,
      bakeTimeLabel: "about 5 min",
    });
    expect(getPizzaSessionBakeProfile("gas")).toMatchObject({
      bakeDurationSeconds: 90,
      bakeTimeLabel: "60–90 sec",
    });
  });

  it("renders Kitchen bake timer only for the bake-pizza step from the active session bake profile", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("KitchenBakeTimerPanel");
    expect(page).toContain("const bakeProfile = getPizzaSessionBakeProfileForSession(session)");
    expect(page).toContain('const showBakeTimer = currentStep?.id === "bake-pizza"');
    expect(page).toContain("durationSeconds={bakeProfile.bakeDurationSeconds}");
    expect(page).toContain("durationLabel={bakeProfile.bakeTimeLabel}");
    expect(page).toContain('if (result.completedStepId === "bake-pizza") clearKitchenBakeTimerState(session.id)');
  });

  it("keeps Kitchen timer actions local and separate from cloud progress persistence", () => {
    const component = source("components/session/KitchenBakeTimerPanel.tsx");
    const hook = source("lib/use-bake-timer.ts");

    expect(component).toContain("doughtools.kitchen-bake-timer.v1");
    expect(component).toContain("Open bake timer");
    expect(component).toContain("Start bake timer");
    expect(component).toContain("Start next pizza timer");
    expect(component).toContain("does not change Kitchen progress");
    expect(component).not.toContain("queueCloudActivePizzaSessionSave");
    expect(component).not.toContain("queueKitchenProgressSync");
    expect(component).not.toContain("completeKitchenTimelineStep");
    expect(component).not.toContain("startPizzaSessionTimelineStep");
    expect(component).not.toContain("setSession(");
    expect(hook).not.toContain("queueCloudActivePizzaSessionSave");
    expect(hook).not.toContain("PizzaSession");
    expect(hook).not.toContain("stepRuntime");
  });

  it("keeps the standalone Timer route while sharing timer formatting and normalization", () => {
    const timerPage = source("app/timer/page.tsx");

    expect(timerPage).toContain('import { formatBakeTimerClock, normalizeBakeTimerDuration, type BakeTimerStatus } from "@/lib/bake-timer"');
    expect(timerPage).toContain("const clock = formatBakeTimerClock");
    expect(timerPage).toContain("normalizeBakeTimerDuration");
    expect(timerPage).toContain("toggleInspectionLight");
    expect(timerPage).toContain("wakeLock");
    expect(timerPage).toContain("SiteFooter");
  });
});
