import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  adjustBakeTimerDuration,
  adjustBakeTimerOvertime,
  bakeTimerDisplayValue,
  BAKE_TIMER_MAX_OVERTIME_SECONDS,
  createBakeTimerSnapshot,
  deriveBakeTimerSnapshot,
  formatBakeTimerClock,
  getBakeTimerPhase,
  getBakeTimerProgressRatio,
  normalizeBakeTimerDuration,
  pauseBakeTimerSnapshot,
  resumeBakeTimerSnapshot,
  startBakeTimerSnapshot,
  stopBakeTimerAlarm,
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

    const almostThere = deriveBakeTimerSnapshot(started, 71_000);
    expect(almostThere.remainingSeconds).toBe(20);
    expect(getBakeTimerPhase(almostThere)).toBe("last20");
    expect(getBakeTimerProgressRatio(almostThere)).toBeCloseTo(20 / 90);

    const cappedOvertime = deriveBakeTimerSnapshot(started, 181_000);
    expect(cappedOvertime.status).toBe("expired");
    expect(cappedOvertime.overtimeSeconds).toBe(BAKE_TIMER_MAX_OVERTIME_SECONDS);
    expect(bakeTimerDisplayValue(cappedOvertime)).toBe("+01:30");
  });

  it("supports accurate pause, resume and safe timer adjustments", () => {
    const started = startBakeTimerSnapshot(createBakeTimerSnapshot(90), 1_000);
    const running = deriveBakeTimerSnapshot(started, 46_000);

    const extended = adjustBakeTimerDuration(running, 10, 46_000);
    expect(extended.durationSeconds).toBe(100);
    expect(extended.remainingSeconds).toBe(55);
    expect(extended.expiresAt).toBe(101_000);

    const shortenedNearZero = adjustBakeTimerDuration(deriveBakeTimerSnapshot(started, 86_000), -10, 86_000);
    expect(shortenedNearZero.durationSeconds).toBe(80);
    expect(shortenedNearZero.remainingSeconds).toBe(1);

    const paused = pauseBakeTimerSnapshot(running, 46_000);
    expect(paused.status).toBe("paused");
    expect(paused.remainingSeconds).toBe(45);
    const resumed = resumeBakeTimerSnapshot(paused, 60_000);
    expect(resumed.status).toBe("running");
    expect(resumed.expiresAt).toBe(105_000);
  });

  it("supports bounded overtime adjustments and alarm stop state", () => {
    const overtime = deriveBakeTimerSnapshot(
      startBakeTimerSnapshot(createBakeTimerSnapshot(90), 1_000),
      96_000,
    );

    const increased = adjustBakeTimerOvertime(overtime, 30, 96_000);
    expect(increased.status).toBe("overtime");
    expect(increased.overtimeSeconds).toBe(35);
    expect(increased.expiresAt).toBe(61_000);

    const capped = adjustBakeTimerOvertime(overtime, 120, 96_000);
    expect(capped.status).toBe("expired");
    expect(capped.overtimeSeconds).toBe(90);

    const stopped = stopBakeTimerAlarm(increased, 96_000);
    expect(stopped.status).toBe("expired");
    expect(stopped.expiresAt).toBeNull();
    expect(stopped.completedCuePlayed).toBe(true);
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
    expect(page).toContain("ovenType={bakeProfile.ovenType}");
    expect(page).toContain("ovenLabel={bakeProfile.label}");
    expect(page).toContain("currentStepIsBakePizza");
    expect(page).toContain("currentStepIsMixDough || currentStepIsRestDough || currentStepIsFermentation || currentStepIsBakePizza");
    expect(page).toContain('const compactTimingHiddenClass = currentStepIsBakePizza ? "hidden " : compactMobileStatusHiddenClass');
    expect(page).toContain("className={`${compactTimingHiddenClass}grid gap-2 border-y");
    expect(page).toContain('if (result.completedStepId === "bake-pizza") clearKitchenBakeTimerState(session.id)');
  });

  it("renders a launcher and full-screen timer dialog separate from Kitchen progress persistence", () => {
    const component = source("components/session/KitchenBakeTimerPanel.tsx");
    const hook = source("lib/use-bake-timer.ts");

    expect(component).toContain("doughtools.kitchen-bake-timer.v1");
    expect(component).toContain("Open full-screen bake timer");
    expect(component).toContain('role="dialog"');
    expect(component).toContain('aria-modal="true"');
    expect(component).toContain("Close bake timer");
    expect(component).toContain("Turn bake timer sound");
    expect(component).toContain("Start timer");
    expect(component).toContain("Pause");
    expect(component).toContain("Resume");
    expect(component).toContain("ALMOST THERE");
    expect(component).toContain("OVERTIME");
    expect(component).toContain("Stop alarm");
    expect(component).toContain("Start next pizza");
    expect(component).toContain("does not change Kitchen progress");
    expect(component).not.toContain("Optional timer");
    expect(component).not.toContain("Open bake timer");
    expect(component).not.toContain("queueCloudActivePizzaSessionSave");
    expect(component).not.toContain("queueKitchenProgressSync");
    expect(component).not.toContain("completeKitchenTimelineStep");
    expect(component).not.toContain("startPizzaSessionTimelineStep");
    expect(component).not.toContain("setSession(");
    expect(hook).toContain("BAKE_TIMER_SOUND_STORAGE_KEY");
    expect(hook).toContain("BakeTimerSoundMilestone");
    expect(hook).toContain("adjustDuration");
    expect(hook).toContain("adjustOvertime");
    expect(hook).toContain("stopAlarm");
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
