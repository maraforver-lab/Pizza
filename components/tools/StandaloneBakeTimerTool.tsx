"use client";

import { useMemo, useRef, useState } from "react";
import { buttonClass, cx } from "@/components/design-system";
import { DoughToolsIcon } from "@/components/icons";
import SiteFooter from "@/components/SiteFooter";
import { BakeTimerPanel } from "@/components/session/KitchenBakeTimerPanel";
import { type PizzaSessionBakeProfile, getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

type StandaloneOvenId = "pizza" | "home";

type OvenOption = {
  id: StandaloneOvenId;
  profile: PizzaSessionBakeProfile;
  description: string;
};

function standaloneDurationLabel(seconds: number) {
  const safeSeconds = Math.max(1, Math.round(seconds));
  if (safeSeconds < 60) return `${safeSeconds} sec`;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  if (remainder === 0) return `${minutes} min`;
  return `${minutes} min ${remainder} sec`;
}

export default function StandaloneBakeTimerTool() {
  const [selectedOven, setSelectedOven] = useState<StandaloneOvenId | null>(null);
  const pizzaOvenButtonRef = useRef<HTMLButtonElement | null>(null);
  const homeOvenButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastSelectedOvenRef = useRef<StandaloneOvenId | null>(null);
  const ovenOptions = useMemo<readonly OvenOption[]>(() => [
    {
      id: "pizza",
      profile: getPizzaSessionBakeProfile("pizza"),
      description: "For high-temperature pizza ovens.",
    },
    {
      id: "home",
      profile: getPizzaSessionBakeProfile("home"),
      description: "For a standard home oven with a stone or steel.",
    },
  ], []);
  const selectedProfile = ovenOptions.find((option) => option.id === selectedOven)?.profile;

  const chooseOven = (oven: StandaloneOvenId) => {
    lastSelectedOvenRef.current = oven;
    setSelectedOven(oven);
  };

  const closeTimer = () => {
    const lastOven = lastSelectedOvenRef.current;
    setSelectedOven(null);
    window.requestAnimationFrame(() => {
      const target = lastOven === "home" ? homeOvenButtonRef.current : pizzaOvenButtonRef.current;
      target?.focus();
    });
  };

  return (
    <main className="min-h-screen bg-cream px-4 pb-12 pt-24 text-ink sm:px-6 lg:pt-28">
      <div className="mx-auto max-w-5xl">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)] lg:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Standalone tool</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-none text-ink sm:text-6xl">
              Bake timer
            </h1>
            <p className="mt-4 max-w-xl text-base font-bold leading-7 text-ink/62">
              Choose the oven you are using. This timer works on its own and does not change your pizza plan.
            </p>
          </div>

          <section aria-labelledby="standalone-bake-timer-oven-heading" className="rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-card sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tomato text-white" aria-hidden="true">
                <DoughToolsIcon name="timer" size={24} strokeWidth={2.2} />
              </span>
              <div>
                <h2 id="standalone-bake-timer-oven-heading" className="font-display text-3xl font-semibold leading-none text-ink">
                  Choose your oven
                </h2>
                <p className="mt-1 text-sm font-bold text-ink/55">Time one pizza at a time.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {ovenOptions.map((option) => {
                const isPizzaOven = option.id === "pizza";
                return (
                  <button
                    key={option.id}
                    ref={isPizzaOven ? pizzaOvenButtonRef : homeOvenButtonRef}
                    type="button"
                    onClick={() => chooseOven(option.id)}
                    className={cx(
                      "flex min-h-28 w-full items-center gap-4 rounded-[1.25rem] border border-ink/10 bg-cream/55 p-4 text-left text-ink transition hover:border-tomato/30 hover:bg-tomato/[.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      selectedOven === option.id && "border-tomato/35 bg-tomato/[.08]",
                    )}
                    aria-label={`${option.profile.label}, ${standaloneDurationLabel(option.profile.bakeDurationSeconds)}`}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-tomato shadow-sm" aria-hidden="true">
                      <DoughToolsIcon name={isPizzaOven ? "flame" : "oven"} size={24} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-extrabold">{option.profile.label}</span>
                      <span className="mt-1 block font-mono text-2xl font-black tabular-nums text-ink">
                        {standaloneDurationLabel(option.profile.bakeDurationSeconds)}
                      </span>
                      <span className="mt-1 block text-sm font-bold leading-5 text-ink/55">{option.description}</span>
                    </span>
                    <span className={buttonClass({ className: "hidden shrink-0 sm:inline-flex", variant: "secondary" })}>
                      Open timer
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </section>

        <section className="mt-6 rounded-[1.25rem] border border-ink/10 bg-white/70 p-4 text-sm font-bold leading-6 text-ink/58 sm:p-5" aria-label="Standalone bake timer note">
          Use the timer as a guide. Pizza color, the bottom and cheese still decide when the pizza is done.
        </section>
      </div>

      {selectedProfile && (
        <BakeTimerPanel
          durationSeconds={selectedProfile.bakeDurationSeconds}
          durationLabel={selectedProfile.bakeTimeLabel}
          ovenType={selectedProfile.ovenType}
          ovenLabel={selectedProfile.label}
          openOnMount
          showLauncher={false}
          onClose={closeTimer}
        />
      )}

      <SiteFooter />
    </main>
  );
}
