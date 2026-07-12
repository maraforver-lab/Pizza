import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import AppSignature from "@/components/AppSignature";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/about");

const originalQuestions = [
  "How much yeast makes sense for the time I actually have?",
  "Should this dough ferment at room temperature or in the refrigerator?",
  "Will this flour still feel good after a longer fermentation?",
  "When should I mix, ball, preheat and bake so the pizza is ready on time?",
] as const;

const trustSignals = [
  {
    title: "The formula should be inspectable",
    body: "DoughTools uses baker’s percentages, visible ingredient amounts and practical fermentation assumptions instead of hiding the thinking behind the result.",
  },
  {
    title: "The plan should stay connected",
    body: "A Pizza Session keeps dough planning, shopping, Timeline, Kitchen Mode and Review in one flow so the user is not rebuilding the same plan on every page.",
  },
  {
    title: "The dough still matters",
    body: "The app can calculate and schedule, but it keeps reminding the maker to observe dough feel, readiness, temperature and the actual bake.",
  },
] as const;

const experiencePromises = [
  {
    title: "For a first pizza maker",
    body: "DoughTools tries to reduce the number of decisions that feel mysterious: how much dough to make, when to start, what to buy and what to do next.",
  },
  {
    title: "For the curious enthusiast",
    body: "It adds more context around flour, fermentation, yeast, timing and oven behavior so repeat bakes become easier to understand.",
  },
  {
    title: "For the Pizza Nerd",
    body: "It keeps the variables visible enough to question, compare and improve without turning every bake into a disconnected spreadsheet.",
  },
] as const;

const partyOrderWorkflow = [
  {
    title: "Create the party",
    body: "Set the pizza time and the pizzas guests can choose from.",
  },
  {
    title: "Share one link",
    body: "Send the public guest link instead of collecting choices from scattered messages.",
  },
  {
    title: "Collect pizza choices",
    body: "Guests add their name, quantities and notes while orders are open.",
  },
  {
    title: "Review the totals",
    body: "See the pizza mix, total count and guest comments in one owner view.",
  },
  {
    title: "Create the Pizza Session",
    body: "Turn the order into a normal Pizza Session with pizza time, quantity and mix carried over.",
  },
  {
    title: "Continue the preparation",
    body: "Move into dough planning, shopping, Timeline and Kitchen Mode from the same workflow.",
  },
] as const;

const buildingPrinciples = [
  "Start from real kitchen moments, not abstract feature ideas.",
  "Make calculations visible enough to trust and simple enough to use.",
  "Keep observation and judgment part of the process.",
  "Help the host prepare without pretending the host has no decisions left.",
  "Remove unnecessary confusion without removing the craft.",
] as const;

const notPromises = [
  "that every dough behaves identically",
  "that the clock alone determines readiness",
  "that one flour is always best",
  "that software replaces observation and practice",
  "that every pizza night can run without host judgment",
] as const;

function StorySection({
  eyebrow,
  title,
  children,
  tone = "white",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  tone?: "white" | "cream" | "leaf" | "ink" | "tomato";
  className?: string;
}) {
  const toneClass = {
    white: "border-white/80 bg-white/78",
    cream: "border-orange/20 bg-[#fff7ed]",
    leaf: "border-leaf/20 bg-leaf/[.08]",
    ink: "border-ink/10 bg-ink text-white",
    tomato: "border-tomato/20 bg-tomato/[.07]",
  }[tone];

  return (
    <section className={`rounded-[2rem] border p-5 shadow-card sm:p-7 ${toneClass} ${className}`}>
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

function Paragraph({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`mt-4 text-sm leading-7 sm:text-base ${light ? "text-white/72" : "text-ink/65"}`}>
      {children}
    </p>
  );
}

function NumberedCard({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <article className="rounded-[1.5rem] border border-white/80 bg-white/82 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tomato text-sm font-black text-white">
          {index + 1}
        </span>
        <div>
          <h3 className="text-sm font-extrabold leading-6 text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-ink/60">{body}</p>
        </div>
      </div>
    </article>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top_left,rgba(226,71,38,0.12),transparent_30rem),linear-gradient(135deg,#f7f0e4,#fffaf2_48%,#f1e4d3)] px-4 py-6 text-ink sm:px-6 sm:py-10">
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

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,29rem)] lg:items-center lg:gap-10">
          <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-tomato/10 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">About DoughTools</p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-[.95] tracking-tight sm:text-6xl">
              Built from real pizza nights.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-ink/68 sm:text-lg">
              DoughTools is not a generic recipe site. It grew from the practical questions that appear when someone actually has dough on the counter, guests on the way and a pizza time that cannot move forever.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/62 sm:text-base">
              I am Marcin Arcisz, a home pizza maker in Finland. Pizza Napoletana first pulled me seriously into fermentation, flour, dough temperature and the small timing decisions that separate a calm bake from a stressful one.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/session/start"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                Start a Pizza Session
              </Link>
              <Link
                href="/account/party-orders/new"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                Plan a pizza party
              </Link>
            </div>
          </div>
          <figure className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/80 bg-cream shadow-card lg:mt-0">
            <Image
              src="/about/marcin-arcisz-founder.webp"
              alt="Marcin, creator of DoughTools, photographed outdoors by the sea."
              width={960}
              height={1200}
              priority
              sizes="(min-width: 1024px) 29rem, 100vw"
              className="aspect-[4/5] h-auto w-full object-cover"
            />
            <figcaption className="bg-white/85 px-4 py-3 text-xs font-extrabold leading-5 text-ink/55">
              Marcin — home pizza maker and creator of DoughTools.
            </figcaption>
          </figure>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Why it exists", "To make dough planning, timing, shopping and hosting feel connected."],
            ["What it values", "Transparent calculations, practical guidance and room for real observation."],
            ["Who it serves", "First-time pizza makers, improving enthusiasts and detail-driven Pizza Nerds."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-[1.5rem] border border-white/80 bg-white/72 p-5 shadow-sm">
              <h2 className="text-sm font-extrabold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">{body}</p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
          <div className="grid gap-5">
            <StorySection title="It started with making pizza seriously" eyebrow="Founder story">
              <Paragraph>
                At first, pizza looked like a simple formula: flour, water, salt and yeast. Then I started noticing how much was happening between those words. A warmer room changed the dough. A longer cold ferment asked more from the flour. A tiny yeast amount could be enough for one schedule and too much for another.
              </Paragraph>
              <Paragraph>
                The more I made Pizza Napoletana at home, the more I wanted a tool that respected those relationships without making the process feel academic. I wanted help with the calculation, but I also wanted the plan to stay close to the kitchen.
              </Paragraph>
              <Paragraph>
                That is the original need behind DoughTools: one place to calculate, plan, remember and follow the process without turning pizza making into guesswork.
              </Paragraph>
            </StorySection>

            <StorySection title="The first problem was dough planning" eyebrow="The original need" tone="cream">
              <Paragraph>
                The questions were never isolated. They arrived together, usually when I was trying to decide whether I could trust the plan.
              </Paragraph>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {originalQuestions.map((question, index) => (
                  <article key={question} className="rounded-[1.5rem] border border-white/80 bg-white/82 p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tomato text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm font-extrabold leading-6 text-ink">{question}</p>
                    </div>
                  </article>
                ))}
              </div>
              <Paragraph>
                DoughTools still follows that philosophy: the calculation should be transparent, the plan should be practical, and the dough should still be observed.
              </Paragraph>
            </StorySection>

            <StorySection title="Why the calculations are worth trusting" eyebrow="Trust through transparency" tone="tomato">
              <Paragraph>
                I do not want DoughTools to feel like a black box. The numbers are there to help the user understand the bake, not to create false certainty.
              </Paragraph>
              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                {trustSignals.map((item) => (
                  <article key={item.title} className="rounded-[1.35rem] border border-white/80 bg-white/82 p-4">
                    <h3 className="text-base font-extrabold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/62">{item.body}</p>
                  </article>
                ))}
              </div>
            </StorySection>

            <StorySection title="Useful at different levels" eyebrow="Beginner to Pizza Nerd">
              <Paragraph>
                DoughTools should not punish someone for being new, and it should not hide everything from someone who wants detail. The same product needs to guide, explain and expose variables at the right moment.
              </Paragraph>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {experiencePromises.map((item) => (
                  <article key={item.title} className="rounded-[1.35rem] border border-ink/10 bg-cream/70 p-4">
                    <h3 className="text-base font-extrabold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/62">{item.body}</p>
                  </article>
                ))}
              </div>
            </StorySection>

            <StorySection title="Then pizza nights created another problem" eyebrow="Hosting people">
              <Paragraph>
                A pizza night sounds simple until ten friends are coming.
              </Paragraph>
              <Paragraph>
                Before I mix the dough, I need to know who is actually coming, what everyone wants to eat and how many pizzas I should prepare. One person wants Margherita. Another wants no mushrooms. Someone changes their mind. The choices are spread across messages, and I am trying to turn all of that into dough quantities, shopping and a realistic schedule.
              </Paragraph>
              <Paragraph>
                I did not want another spreadsheet or a message thread I had to decode. I wanted one link I could send to everyone, one place where their choices would collect, and one clear route from those choices into the actual pizza session.
              </Paragraph>
            </StorySection>

            <StorySection title="From one link to one complete session" eyebrow="Party Orders" tone="leaf">
              <Paragraph>
                That is why Party Orders exists. It connects guest choices to the preparation work that follows, without pretending the host has no decisions left to make.
              </Paragraph>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {partyOrderWorkflow.map((step, index) => (
                  <NumberedCard key={step.title} index={index} title={step.title} body={step.body} />
                ))}
              </div>
            </StorySection>

            <StorySection title="How I want to build DoughTools" eyebrow="The product philosophy">
              <Paragraph>
                Party Orders is a good example of how I want to build DoughTools. It begins with a real moment in the kitchen, a problem that interrupts the experience, and a question: could this be clearer?
              </Paragraph>
              <Paragraph>
                The goal is not to remove the craft from pizza. The goal is to remove the unnecessary confusion around it, so there is more time for the parts that matter — making the dough, learning from the bake and enjoying the evening with other people.
              </Paragraph>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {buildingPrinciples.map((principle) => (
                  <div key={principle} className="flex gap-3 rounded-[1.25rem] border border-ink/10 bg-white/80 p-4 text-sm font-bold leading-6 text-ink/65">
                    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf text-[10px] font-extrabold text-white">✓</span>
                    <span>{principle}</span>
                  </div>
                ))}
              </div>
            </StorySection>

            <StorySection title="The long-term vision" eyebrow="Where this is going" tone="cream">
              <Paragraph>
                I want DoughTools to become the practical companion for a whole pizza life: planning the dough, choosing a sensible path, preparing for guests, learning from the result and coming back with a better next bake.
              </Paragraph>
              <Paragraph>
                That does not mean adding complexity for its own sake. It means connecting the pieces that already affect each other: formula, flour, fermentation, oven, toppings, timing, shopping, serving and review.
              </Paragraph>
              <Paragraph>
                The best version of DoughTools should feel calm on a phone in the kitchen, useful on a laptop before shopping, and honest enough that a serious pizza maker can see what assumptions are being made.
              </Paragraph>
            </StorySection>

            <StorySection title="Still building, still curious" eyebrow="A personal closing" tone="ink">
              <Paragraph light>
                I am genuinely excited about what DoughTools can become. I use it, notice what feels unclear and keep improving it.
              </Paragraph>
              <Paragraph light>
                I hope it helps other home pizza makers feel more confident, prepare better and enjoy hosting without turning the evening into administration.
              </Paragraph>
              <Paragraph light>
                If you have an idea, a recurring problem or something you wish the product could do, I would love to hear about it.
              </Paragraph>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-extrabold text-ink transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  Share an idea
                </Link>
                <Link
                  href="/session/start"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[.08] px-5 text-sm font-extrabold text-white transition hover:bg-white/[.12] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  Try a Pizza Session
                </Link>
              </div>
            </StorySection>
          </div>

          <aside className="grid gap-5 lg:sticky lg:top-24">
            <StorySection title="Built by Marcin" eyebrow="Founder">
              <p className="mt-4 text-sm font-bold leading-7 text-ink/65">
                Home pizza maker and Pizza Napoletana enthusiast, Finland.
              </p>
              <p className="mt-4 text-sm leading-7 text-ink/60">
                DoughTools is personal software: made from real bakes, real hosting and the practical wish to make the next pizza night easier to run.
              </p>
            </StorySection>

            <StorySection title="What DoughTools does not promise" eyebrow="Trust" tone="cream">
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
            </StorySection>

            <StorySection title="Transparent tools, not magic" eyebrow="Method">
              <p className="mt-4 text-sm leading-7 text-ink/65">
                DoughTools tries to make the important variables visible: time, yeast, temperature, flour, dough-ball size, schedule and what happened after the bake.
              </p>
              <p className="mt-4 text-sm leading-7 text-ink/65">
                A good plan helps, but the dough still deserves attention.
              </p>
              <Link
                href="/methodology"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                Read the calculation methodology
              </Link>
            </StorySection>

            <StorySection title="Follow the work" eyebrow="Development" tone="leaf">
              <p className="mt-4 text-sm leading-7 text-ink/65">
                DoughTools is still evolving. The most useful ideas come from real bakes, real friction and the moments where a pizza maker needs the next step to be clearer.
              </p>
              <Link
                href="/updates"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                Read product updates
              </Link>
            </StorySection>
          </aside>
        </div>

        <footer className="mt-8 border-t border-ink/10 py-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
