import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import AppSignature from "@/components/AppSignature";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/about");

const originalQuestions = [
  {
    title: "When should I start?",
    body: "If I can make dough now, what bake time actually fits the hours ahead?",
  },
  {
    title: "How much yeast should I use?",
    body: "A tiny yeast amount only makes sense when time and temperature are part of the same plan.",
  },
  {
    title: "Room temperature or refrigerator?",
    body: "The fermentation place changes yeast activity, timing, handling and how closely the dough needs watching.",
  },
  {
    title: "Which flour fits the fermentation time?",
    body: "Flour strength matters more when the plan gets longer, colder or more demanding.",
  },
] as const;

const connectedFlow = [
  "Dough Plan",
  "Ingredient amounts",
  "Flour and fermentation fit",
  "Shopping",
  "Timeline",
  "Kitchen Mode",
  "Dough Guide",
  "Troubleshooting",
  "Review and learning",
] as const;

const experienceLevels = [
  {
    title: "Beginner",
    body: "Clear actions, sensible defaults and step-by-step guidance without demanding advanced dough language first.",
  },
  {
    title: "Enthusiast",
    body: "More explanation about why the dough behaves as it does, especially around timing, temperature and handling.",
  },
  {
    title: "Pizza Nerd",
    body: "More control over hydration, temperature, flour strength and fermentation details while keeping the plan usable.",
  },
] as const;

const principles = [
  "Good pizza begins with a plan, but the dough must still be observed.",
  "Flour strength, temperature and fermentation time should be considered together.",
  "Calculations should be visible and understandable.",
  "Guidance should explain trade-offs instead of hiding them.",
  "A failed bake is not wasted if it helps improve the next one.",
  "Pizza making should remain enjoyable.",
] as const;

const notPromises = [
  "that every dough behaves identically",
  "that the clock alone determines readiness",
  "that one flour is always best",
  "that one pizza method is universally correct",
  "that software replaces observation and practice",
] as const;

function Section({
  eyebrow,
  title,
  children,
  tone = "white",
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  tone?: "white" | "leaf" | "cream" | "ink";
}) {
  const toneClass = {
    white: "border-white/80 bg-white/75",
    leaf: "border-leaf/20 bg-leaf/[.08]",
    cream: "border-orange/20 bg-[#fff7ed]",
    ink: "border-ink/10 bg-ink text-white",
  }[tone];

  return (
    <section className={`rounded-[2rem] border p-5 shadow-card sm:p-7 ${toneClass}`}>
      {eyebrow && (
        <p className={`text-xs font-extrabold uppercase tracking-[.2em] ${tone === "ink" ? "text-orange" : "text-tomato"}`}>
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
      {children}
    </section>
  );
}

function Paragraph({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`mt-4 text-sm leading-7 sm:text-base ${light ? "text-white/70" : "text-ink/65"}`}>
      {children}
    </p>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-extrabold text-ink/60 transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            <span aria-hidden="true">←</span>
            Back to DoughTools
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white/75 px-4 text-sm font-extrabold text-ink/60 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Contact
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/75 p-6 shadow-card backdrop-blur sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,29rem)] lg:items-center lg:gap-10">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">About DoughTools</p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-[.95] tracking-tight sm:text-6xl">
              Built from a love of Pizza Napoletana — and a need for clearer answers.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-ink/65 sm:text-lg">
              DoughTools began with a question I kept asking in my own kitchen: if I can make dough now and want to bake later, how much yeast should I use, where should the dough ferment, and which flour can handle the plan?
            </p>
            <div className="mt-7">
              <Link
                href="/session/start"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                Start planning your next pizza session
              </Link>
            </div>
          </div>
          <figure className="mt-8 overflow-hidden rounded-[2rem] border border-white/80 bg-cream shadow-card lg:mt-0">
            <div className="relative aspect-[4/5]">
              <Image
                src="/about/marcin-arcisz-founder.webp"
                alt="Marcin Arcisz, creator of DoughTools, photographed outdoors by the sea."
                fill
                priority
                sizes="(min-width: 1024px) 29rem, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="bg-white/85 px-4 py-3 text-xs font-extrabold leading-5 text-ink/55">
              Marcin Arcisz — home pizza maker and creator of DoughTools.
            </figcaption>
          </figure>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
          <div className="grid gap-5">
            <Section title="A tool I first built for myself" eyebrow="Founder story">
              <Paragraph>
                I make pizza myself, and Pizza Napoletana is what pulled me deeper into dough, fermentation and flour. The ingredients looked simple, but the planning questions kept coming back.
              </Paragraph>
              <Paragraph>
                Recipes helped, and calculators helped, but they often stopped at ingredient amounts. They did not always connect yeast, time, temperature, flour strength and the actual moment when the dough should be divided, balled and baked.
              </Paragraph>
              <Paragraph>
                The first version of DoughTools was built to make my own process clearer. It later grew into a workspace for other home pizza makers who want the same practical decisions connected in one place.
              </Paragraph>
            </Section>

            <Section title="The questions that started DoughTools" eyebrow="The real problem" tone="cream">
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {originalQuestions.map((question, index) => (
                  <article key={question.title} className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tomato text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <h3 className="text-base font-extrabold text-ink">{question.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink/60">{question.body}</p>
                  </article>
                ))}
              </div>
            </Section>

            <Section title="Why another pizza tool?" eyebrow="Connected decisions">
              <Paragraph>
                Recipes, calculators and discussions already exist, and many of them are useful. The missing piece for me was connection.
              </Paragraph>
              <Paragraph>
                A yeast quantity without real temperature context is incomplete. Fermentation time without flour context is incomplete. A recipe without a practical timeline is difficult to execute when life, equipment and room temperature do not follow the ideal example.
              </Paragraph>
              <p className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-leaf/[.08] p-4 text-sm font-extrabold leading-7 text-ink/75 sm:text-base">
                DoughTools is not only a calculator. It connects the recipe, flour, fermentation plan, timeline and hands-on preparation into one workflow.
              </p>
            </Section>

            <Section title="What DoughTools connects" eyebrow="One workflow">
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {connectedFlow.map((item, index) => (
                  <div key={item} className="rounded-2xl border border-ink/10 bg-white/80 p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">Step {index + 1}</p>
                    <p className="mt-1 text-sm font-extrabold text-ink">{item}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Made for real life" eyebrow="Practical planning" tone="leaf">
              <Paragraph>
                Pizza making does not happen under perfect conditions. You may have 8, 24, 48 or 72 hours. The refrigerator may be colder than expected. The room may be warmer than yesterday. The flour used in an online recipe may not be available where you live.
              </Paragraph>
              <Paragraph>
                DoughTools helps plan around the time, flour, temperature and equipment you actually have. It cannot remove every variable, and it should not pretend to. Dough still needs observation.
              </Paragraph>
            </Section>

            <Section title="Why Pizza Napoletana?" eyebrow="Personal starting point">
              <Paragraph>
                Pizza Napoletana is what first pulled me deeply into dough, fermentation and flour. I love its simplicity: a few ingredients, intense heat and very little room to hide mistakes.
              </Paragraph>
              <Paragraph>
                That was the personal starting point. DoughTools can still support different home-pizza situations and equipment; it is not meant to exclude other pizza styles or claim that one method is the only correct one.
              </Paragraph>
            </Section>

            <Section title="Still learning, one pizza at a time" eyebrow="A living tool" tone="ink">
              <Paragraph light>
                I am not building DoughTools from the distance of a software company. I use it while planning my own dough, testing flour, adjusting fermentation and learning from both successful and failed bakes.
              </Paragraph>
              <Paragraph light>
                DoughTools is the tool I wished I had when I started taking pizza dough seriously. I hope it helps other home pizza makers spend less time guessing and more time enjoying the process.
              </Paragraph>
              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[.06] p-4">
                <p className="font-display text-3xl font-semibold">Built by Marcin Arcisz</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white/60">
                  Home pizza maker and Pizza Napoletana enthusiast, Finland.
                </p>
              </div>
            </Section>
          </div>

          <aside className="grid gap-5 lg:sticky lg:top-24">
            <Section title="For three kinds of pizza makers" eyebrow="Experience levels">
              <div className="mt-5 grid gap-3">
                {experienceLevels.map((level) => (
                  <article key={level.title} className="rounded-[1.25rem] border border-white/80 bg-white/80 p-4">
                    <h3 className="text-base font-extrabold text-ink">{level.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/60">{level.body}</p>
                  </article>
                ))}
              </div>
            </Section>

            <Section title="What DoughTools believes" eyebrow="Principles" tone="cream">
              <ul className="mt-5 grid gap-3">
                {principles.map((principle) => (
                  <li key={principle} className="flex gap-3 text-sm font-bold leading-6 text-ink/65">
                    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf text-[10px] font-extrabold text-white">✓</span>
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="What DoughTools does not promise" eyebrow="Trust" tone="white">
              <p className="mt-4 text-sm leading-7 text-ink/65">
                DoughTools is guidance for planning and learning. It does not promise:
              </p>
              <ul className="mt-4 grid gap-2">
                {notPromises.map((promise) => (
                  <li key={promise} className="flex gap-3 text-sm font-bold leading-6 text-ink/65">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
                    <span>{promise}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </aside>
        </div>

        <footer className="mt-8 border-t border-ink/10 py-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
