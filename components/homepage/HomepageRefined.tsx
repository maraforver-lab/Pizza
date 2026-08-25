import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/components/SiteFooter";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";

type ChoicePath = {
  title: string;
  label: string;
  copy: string;
  href: string;
  icon: DoughToolsIconName;
  primary?: boolean;
};

type WorkStep = {
  title: string;
  copy: string;
  icon: DoughToolsIconName;
};

type SupportingTool = {
  title: string;
  copy: string;
  action: string;
  href: string;
  icon: DoughToolsIconName;
};

const choicePaths: ChoicePath[] = [
  {
    title: "Make pizza",
    label: "Primary path",
    copy: "Create your complete Pizza Plan.",
    href: "/session/start",
    icon: "pizza",
    primary: true,
  },
  {
    title: "Learn pizza",
    label: "Learning path",
    copy: "Explore dough, sauce, toppings and ovens.",
    href: "/guide",
    icon: "wheat",
  },
];

const workSteps: WorkStep[] = [
  {
    title: "Plan",
    copy: "Choose your pizza, timing and oven.",
    icon: "calendar",
  },
  {
    title: "Prepare",
    copy: "Follow your recipe and preparation steps.",
    icon: "shopping-basket",
  },
  {
    title: "Bake",
    copy: "Use your schedule and baking guidance.",
    icon: "oven",
  },
  {
    title: "Review",
    copy: "Save what worked for next time.",
    icon: "history",
  },
];

const supportingTools: SupportingTool[] = [
  {
    title: "Quick Calculator",
    copy: "Use the pizza dough calculator for quick ingredient amounts.",
    action: "Open calculator",
    href: "/calculator/quick",
    icon: "scale",
  },
  {
    title: "Pizza Styles",
    copy: "Compare styles before choosing.",
    action: "Explore guide",
    href: "/styles",
    icon: "pizza",
  },
  {
    title: "Practical Tips",
    copy: "Solve timing, storage and dough problems.",
    action: "Explore guide",
    href: "/guide/practical-pizza-tips",
    icon: "checklist",
  },
  {
    title: "Troubleshooting",
    copy: "Diagnose what went wrong.",
    action: "Explore guide",
    href: "/guide/pizza-troubleshooting",
    icon: "warning",
  },
];

function HomepageAction({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex min-h-12 items-center justify-center rounded-full bg-tomato px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
      : "inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <Link href={href} className={className}>
      {children}
      <DoughToolsIcon name="forward" size={16} className="ml-2" aria-hidden="true" />
    </Link>
  );
}

export default function HomepageRefined() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[linear-gradient(180deg,#fff8f1_0%,#f1e6d8_46%,#fff8f1_100%)] text-ink">
      <section className="px-4 pb-6 pt-5 sm:px-6 sm:pb-9 sm:pt-9 lg:px-8" aria-labelledby="homepage-hero-heading">
        <div className="mx-auto grid max-w-[92rem] overflow-hidden rounded-[1.75rem] bg-forest-dark shadow-overlay sm:rounded-[2rem] lg:min-h-[clamp(31rem,calc(100svh-8rem),38rem)] lg:grid-cols-[minmax(0,0.64fr)_minmax(0,1.1fr)]">
          <div className="flex min-w-0 flex-col justify-center px-5 py-7 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-12">
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-oven-gold">Pizza planning and learning</p>
            <h1
              id="homepage-hero-heading"
              className="mt-4 max-w-[12ch] break-words font-display text-[clamp(2.65rem,9vw,5.2rem)] font-semibold leading-[.9] tracking-[-.04em] text-white lg:max-w-[12ch]"
            >
              Make better pizza with one clear plan.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/86 sm:text-lg sm:leading-8">
              Calculate your pizza dough, choose your fermentation timing and oven, and get one clear recipe, shopping list, schedule and baking plan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <HomepageAction href="/session/start">Plan a pizza</HomepageAction>
              <HomepageAction href="/guide" variant="secondary">
                Explore guides
              </HomepageAction>
            </div>
          </div>
          <div className="relative min-h-[18.5rem] overflow-hidden bg-ink sm:min-h-[26rem] lg:min-h-full">
            <Image
              src="/images/homepage/doughtools-hero-desktop.webp"
              alt="Finished pizza with prepared dough in a warm pizza-making workspace"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 64vw"
              className="scale-[1.06] object-cover object-[56%_58%] lg:scale-[1.1] lg:object-[57%_54%]"
            />
            <div className="absolute inset-y-0 left-0 hidden w-24 bg-[linear-gradient(90deg,rgba(9,41,31,0.48),rgba(9,41,31,0))] lg:block" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6 sm:py-8 lg:px-8" aria-labelledby="homepage-path-heading">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Make or learn</p>
            <h2 id="homepage-path-heading" className="mt-2 font-display text-3xl font-semibold leading-none sm:text-4xl">
              Choose how you want to begin
            </h2>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {choicePaths.map((path) => (
              <Link
                key={path.title}
                className={
                  path.primary
                    ? "group flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-oven-gold/30 bg-forest px-4 py-3.5 text-white shadow-sm transition-colors hover:border-oven-gold/55 hover:bg-forest-dark hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato sm:px-5 sm:py-4"
                    : "group flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-white/80 bg-white/84 px-4 py-3.5 shadow-sm transition-colors hover:border-tomato/35 hover:bg-white hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato sm:px-5 sm:py-4"
                }
                href={path.href}
                aria-label={`${path.title}: ${path.copy}`}
              >
                <span
                  className={
                    path.primary
                      ? "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/18 bg-tomato text-white"
                      : "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-tomato/15 bg-cream text-tomato"
                  }
                >
                  <DoughToolsIcon name={path.icon} size={24} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={path.primary ? "block text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-oven-gold" : "block text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-leaf"}>
                    {path.label}
                  </span>
                  <span className="mt-1 block font-display text-2xl font-semibold leading-none">{path.title}</span>
                  <span className={path.primary ? "mt-1.5 block text-sm font-bold leading-5 text-white/80" : "mt-1.5 block text-sm font-bold leading-5 text-ink/62"}>{path.copy}</span>
                </span>
                <span className={path.primary ? "shrink-0 text-sm font-extrabold text-oven-gold" : "shrink-0 text-sm font-extrabold text-tomato"}>
                  Open
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6 sm:py-8 lg:px-8" aria-labelledby="homepage-how-heading">
        <div className="mx-auto max-w-7xl">
          <h2 id="homepage-how-heading" className="font-display text-3xl font-semibold leading-none sm:text-4xl">
            How DoughTools works
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-ink/64 sm:text-base sm:leading-7">
            DoughTools is a pizza dough calculator and step-by-step pizza planner for calculating ingredients, fermentation timing and baking steps.
          </p>
          <ol className="mt-4 overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/84 shadow-sm lg:grid lg:grid-cols-4">
            {workSteps.map((step, index) => (
              <li key={step.title} className="flex gap-3 border-b border-ink/10 bg-white/0 px-4 py-3.5 last:border-b-0 lg:border-b-0">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-tomato/15 bg-cream text-tomato">
                  <span className="sr-only">Step {index + 1}</span>
                  <DoughToolsIcon name={step.icon} size={24} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-tomato">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold leading-none">{step.title}</h3>
                  <p className="mt-1 text-sm font-bold leading-5 text-ink/64">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6 sm:py-8 lg:px-8" aria-labelledby="homepage-tools-heading">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Supporting tools</p>
            <h2 id="homepage-tools-heading" className="mt-2 font-display text-3xl font-semibold leading-none sm:text-4xl">
              Useful when you need them
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {supportingTools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group flex min-w-0 flex-col rounded-[1.15rem] border border-white/80 bg-white/84 p-3 shadow-sm transition-colors hover:border-tomato/35 hover:bg-white hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato sm:p-3.5"
                aria-label={`${tool.title}: ${tool.action}`}
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-tomato/15 bg-cream text-tomato">
                  <DoughToolsIcon name={tool.icon} size={24} aria-hidden="true" />
                </span>
                <span className="mt-3 flex min-w-0 flex-1 flex-col">
                  <span className="block font-display text-xl font-semibold leading-none text-ink sm:text-2xl">{tool.title}</span>
                  <span className="mt-1.5 block text-xs font-bold leading-5 text-ink/64 sm:text-sm">{tool.copy}</span>
                  <span className="mt-auto inline-flex w-fit items-center rounded-full border border-tomato/15 bg-cream/70 px-2.5 py-1 text-xs font-extrabold text-tomato transition-colors group-hover:border-tomato/30 group-hover:bg-tomato/[.08] sm:text-sm">
                    {tool.action}
                    <DoughToolsIcon name="forward" size={16} className="ml-1.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-10 lg:px-8" aria-labelledby="homepage-final-heading">
        <div className="mx-auto max-w-5xl rounded-[1.75rem] bg-forest-dark px-5 py-6 text-center text-white shadow-card sm:px-8 sm:py-8">
          <h2 id="homepage-final-heading" className="mx-auto max-w-3xl font-display text-[2rem] font-semibold leading-none sm:text-5xl">
            Ready to make your next pizza?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/82">
            Turn your choices into one clear plan from dough preparation to the final bake.
          </p>
          <div className="mt-5">
            <HomepageAction href="/session/start">Plan a pizza</HomepageAction>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
