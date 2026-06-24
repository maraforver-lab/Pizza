"use client";

import { useEffect, useState } from "react";

type InstallPromptOutcome = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallPromptOutcome; platform: string }>;
};

type InstallAppPromptProps = {
  className?: string;
  compact?: boolean;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  const displayModeStandalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const navigatorStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return displayModeStandalone || navigatorStandalone;
}

export default function InstallAppPrompt({ className = "", compact = false }: InstallAppPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [choice, setChoice] = useState<InstallPromptOutcome | null>(null);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    const updateStandaloneState = () => setIsInstalled(isStandaloneMode());
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setChoice(null);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setChoice("accepted");
    };

    mediaQuery?.addEventListener("change", updateStandaloneState);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      mediaQuery?.removeEventListener("change", updateStandaloneState);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    const prompt = deferredPrompt;
    setDeferredPrompt(null);
    await prompt.prompt();
    const result = await prompt.userChoice.catch(() => undefined);
    setChoice(result?.outcome ?? "dismissed");
  };

  const title = isInstalled ? "DoughTools is installed on this device" : "Install DoughTools on this device";
  const intro = isInstalled
    ? "DoughTools appears to be running in app mode. Keep using the same browser data for your local recipes and saved bakes."
    : "Keep DoughTools one tap away while you plan, bake and review your pizza session.";

  return (
    <section
      className={`rounded-[1.75rem] border border-ink/10 bg-white/75 p-5 shadow-sm backdrop-blur sm:p-6 ${className}`}
      aria-labelledby="install-doughtools-heading"
    >
      <div className={compact ? "grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center" : "space-y-4"}>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Add to Home Screen</p>
          <h2 id="install-doughtools-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">{intro}</p>
        </div>

        {deferredPrompt && !isInstalled ? (
          <button
            type="button"
            onClick={install}
            className="min-h-12 rounded-2xl bg-ink px-5 py-3 text-sm font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Install DoughTools
          </button>
        ) : null}
      </div>

      {!deferredPrompt && !isInstalled ? (
        <div className="mt-4 rounded-2xl bg-cream/70 p-4">
          <p className="text-sm font-extrabold text-ink">Manual home-screen option</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink/60">
            <li>Open this page in your browser.</li>
            <li>Tap Share.</li>
            <li>Choose Add to Home Screen.</li>
          </ol>
          <p className="mt-3 text-xs leading-5 text-ink/45">
            On iPhone or iPad, open DoughTools in Safari or your iOS browser, tap Share, then Add to Home Screen.
          </p>
        </div>
      ) : null}

      {choice === "dismissed" && !isInstalled ? (
        <p className="mt-3 rounded-2xl bg-ink/[.04] p-3 text-xs leading-5 text-ink/50">
          No problem — you can install later from your browser menu or use the manual home-screen steps.
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-ink/45">
        Installing does not add cloud sync, push notifications, tracking or offline mode. Saved recipes and local bakes
        still use this browser on this device for now.
      </p>
    </section>
  );
}
