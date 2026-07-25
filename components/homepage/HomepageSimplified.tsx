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
    copy: "Calculate dough amounts quickly.",
    href: "/calculator/quick",
    icon: "scale",
  },
  {
    title: "Pizza Styles",
    copy: "Compare styles before choosing.",
    href: "/styles",
    icon: "pizza",
  },
  {
    title: "Practical Tips",
    copy: "Solve timing, storage and dough problems.",
    href: "/guide/practical-pizza-tips",
    icon: "checklist",
  },
  {
    title: "Troubleshooting",
    copy: "Diagnose what went wrong.",
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

export default function HomepageSimplified() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[linear-gradient(180deg,#fff8f1_0%,#f1e6d8_48%,#fff8f1_100%)] text-ink">
      <section className="px-4 pb-7 pt-5 sm:px-6 sm:pb-10 sm:pt-10 lg:px-8" aria-labelledby="homepage-simplified-hero-heading">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[1.75rem] bg-forest-dark shadow-overlay sm:rounded-[2rem] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="flex min-w-0 flex-col justify-center px-5 py-7 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <p className="text-xs font-extrabold uppercase tracking-[.28em] text-oven-gold">Pizza planning and learning</p>
            <h1
              id="homepage-simplified-hero-heading"
              className="mt-4 max-w-[12ch] break-words font-display text-[clamp(2.75rem,10vw,5.35rem)] font-semibold leading-[.9] tracking-[-.04em] text-white lg:max-w-[13ch]"
            >
              Make better pizza with one clear plan.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/86 sm:text-lg sm:leading-8">
              Choose your pizza, timing and oven. Get one clear recipe, shopping list, schedule and baking plan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <HomepageAction href="/session/start">Plan a pizza</HomepageAction>
              <HomepageAction href="/guide" variant="secondary">
                Explore guides
              </HomepageAction>
            </div>
          </div>
          <div className="relative min-h-[16rem] bg-ink sm:min-h-[24rem] lg:min-h-full">
            <Image
              src="/images/homepage/doughtools-hero-desktop.webp"
              alt="Finished pizza with prepared dough in a warm pizza-making workspace"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 48vw"
              className="object-cover object-[58%_55%]"
            />
            <div className="absolute inset-y-0 left-0 hidden w-24 bg-[linear-gradient(90deg,rgba(9,41,31,0.52),rgba(9,41,31,0))] lg:block" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-9 lg:px-8" aria-labelledby="homepage-path-heading">
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
                    ? "group flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-leaf/25 bg-forest px-4 py-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato sm:px-5"
                    : "group flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-white/80 bg-white/82 px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-tomato/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato sm:px-5"
                }
                href={path.href}
                aria-label={`${path.title}: ${path.copy}`}
              >
                <span
                  className={
                    path.primary
                      ? "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-tomato text-white"
                      : "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-cream text-tomato"
                  }
                >
                  <DoughToolsIcon name={path.icon} size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={path.primary ? "block text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-oven-gold" : "block text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-leaf"}>
                    {path.label}
                  </span>
                  <span className="mt-1 block font-display text-2xl font-semibold leading-none">{path.title}</span>
                  <span className={path.primary ? "mt-1.5 block text-sm font-bold leading-5 text-white/80" : "mt-1.5 block text-sm font-bold leading-5 text-ink/62"}>{path.copy}</span>
                </span>
                <DoughToolsIcon name="forward" size={20} className={path.primary ? "shrink-0 text-oven-gold transition group-hover:translate-x-0.5" : "shrink-0 text-tomato transition group-hover:translate-x-0.5"} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-9 lg:px-8" aria-labelledby="homepage-how-heading">
        <div className="mx-auto max-w-7xl">
          <h2 id="homepage-how-heading" className="font-display text-3xl font-semibold leading-none sm:text-4xl">
            How DoughTools works
          </h2>
          <ol className="mt-4 overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/82 shadow-sm lg:grid lg:grid-cols-4">
            {workSteps.map((step, index) => (
              <li key={step.title} className="relative flex gap-3 border-b border-ink/10 p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
                <span className="flex shrink-0 flex-col items-center">
                  <span className="text-xs font-extrabold text-tomato">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-2 inline-flex size-9 items-center justify-center rounded-full bg-cream text-tomato">
                    <DoughToolsIcon name={step.icon} size={20} aria-hidden="true" />
                  </span>
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-semibold leading-none">{step.title}</h3>
                  <p className="mt-1.5 text-sm font-bold leading-6 text-ink/64">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-9 lg:px-8" aria-labelledby="homepage-tools-heading">
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
                className="group flex min-w-0 flex-col rounded-[1.15rem] border border-white/80 bg-white/82 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-tomato/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato sm:p-4"
                aria-label={`${tool.title}: ${tool.copy}`}
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-tomato">
                  <DoughToolsIcon name={tool.icon} size={20} aria-hidden="true" />
                </span>
                <span className="mt-3 flex min-w-0 flex-1 flex-col">
                  <span className="block font-display text-xl font-semibold leading-none text-ink sm:text-2xl">{tool.title}</span>
                  <span className="mt-1.5 block text-xs font-bold leading-5 text-ink/64 sm:text-sm">{tool.copy}</span>
                  <span className="mt-auto pt-3 text-tomato">
                    <DoughToolsIcon name="forward" size={16} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-11 lg:px-8" aria-labelledby="homepage-simplified-final-heading">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] bg-forest-dark px-5 py-8 text-center text-white shadow-overlay sm:px-8 sm:py-10">
          <h2 id="homepage-simplified-final-heading" className="mx-auto max-w-3xl font-display text-3xl font-semibold leading-none sm:text-5xl">
            Ready to make your next pizza?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
            Turn your choices into one clear plan from dough preparation to the final bake.
          </p>
          <div className="mt-6">
            <HomepageAction href="/session/start">Plan a pizza</HomepageAction>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
