import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import AppSignature from "@/components/AppSignature";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/about");

const experienceLevels = [
  {
    title: "Beginner",
    body: "When everything is new, the next step should be calm and direct.",
  },
  {
    title: "Enthusiast",
    body: "When curiosity grows, the explanation should show what changed and why it matters.",
  },
  {
    title: "Pizza Nerd",
    body: "When the details matter, the variables should stay visible enough to question.",
  },
] as const;

const partyOrderSteps = [
  "Share one link",
  "Collect choices",
  "Review totals",
  "Create Pizza Session",
] as const;

const beliefs = [
  "Software should support the craft. Not replace it.",
  "Calculations should be understandable. Not mysterious.",
  "Pizza making should become less confusing. Not more automatic.",
  "A good plan helps, but the dough still deserves attention.",
] as const;

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/methodology", label: "Methodology" },
] as const;

function StoryChapter({
  eyebrow,
  title,
  children,
  image,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  image?: {
    src: string;
    alt: string;
    caption: string;
  };
  reverse?: boolean;
}) {
  return (
    <section className="grid gap-7 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30rem)] lg:items-center lg:gap-12">
      <div className={reverse ? "lg:order-2" : undefined}>
        <p className="text-xs font-extrabold uppercase tracking-[.24em] text-tomato">{eyebrow}</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          {title}
        </h2>
        <div className="mt-5 space-y-4 text-base leading-8 text-ink/68">{children}</div>
      </div>
      {image && (
        <figure className={`overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-card ${reverse ? "lg:order-1" : ""}`}>
          <Image
            src={image.src}
            alt={image.alt}
            width={1200}
            height={900}
            sizes="(min-width: 1024px) 30rem, 100vw"
            className="aspect-[4/3] h-auto w-full object-cover"
          />
          <figcaption className="px-4 py-3 text-xs font-bold leading-5 text-ink/55">{image.caption}</figcaption>
        </figure>
      )}
    </section>
  );
}

function PullQuote({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <blockquote
      className={`my-7 rounded-[2rem] border p-6 font-display text-3xl font-semibold leading-tight tracking-tight sm:p-8 sm:text-5xl ${
        dark
          ? "border-white/10 bg-white/[.08] text-white"
          : "border-tomato/20 bg-tomato/[.08] text-ink"
      }`}
    >
      {children}
    </blockquote>
  );
}

function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
    >
      {children}
    </Link>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top_left,rgba(226,71,38,0.12),transparent_30rem),linear-gradient(135deg,#f7f0e4,#fffaf2_48%,#f1e4d3)] px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-extrabold text-ink/60 transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
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

        <section className="relative isolate overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-card">
          <Image
            src="/about/marcin-arcisz-founder.webp"
            alt="Marcin, creator of DoughTools, photographed outdoors by the sea."
            fill
            priority
            sizes="100vw"
            className="object-cover object-[42%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/78 to-ink/20" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />
          <div className="relative max-w-3xl px-6 py-16 sm:px-10 sm:py-24 lg:px-14 lg:py-32">
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-orange">About DoughTools</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[.92] tracking-tight sm:text-7xl">
              {"It didn't start with software."}
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-white/82 sm:text-xl">
              It started with one simple question: how can I make better pizza without spending half the evening calculating everything?
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
              I am Marcin Arcisz, a home pizza maker in Finland. DoughTools grew from the evenings where I wanted the pizza to be better, the planning to be calmer and the people around the table to matter more than the spreadsheet.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-6xl">
          <StoryChapter
            eyebrow="Chapter 1"
            title="It wasn't the dough. It was the planning."
            image={{
              src: "/dough-guide/guide-step-02-measure.webp",
              alt: "Pizza dough ingredients measured on a warm kitchen counter.",
              caption: "The first problem was not passion. It was trust in the plan.",
            }}
          >
            <p>
              I had flour, water, salt and yeast. What I did not have was one answer I could trust. Different calculators produced different numbers. Spreadsheets became more confusing every time I tried to improve them. Scaling recipes did not always feel sensible. Yeast behaviour was hard to understand because most tools gave me a number without explaining why.
            </p>
            <p>
              I did not want another calculator. I wanted answers I could actually trust.
            </p>
            <p>
              That became the first reason DoughTools exists: make the calculation visible enough to understand, practical enough to use and honest enough to remind me that the dough still needs observation.
            </p>
          </StoryChapter>

          <StoryChapter
            eyebrow="Chapter 2"
            title="The time I actually had."
            reverse
            image={{
              src: "/dough-guide/guide-step-06-bulk.webp",
              alt: "Covered pizza dough fermenting in a container.",
              caption: "Real life gives awkward windows. The plan should adapt.",
            }}
          >
            <p>
              Most calculators ask a neat question: how long do you want to ferment? 6 h, 12 h, 24 h, 48 h.
            </p>
            <p>
              Real life does not work that way. Sometimes dinner is tomorrow evening. Sometimes guests arrive after work. Sometimes the only honest answer is 20 hours, 16 hours or 33 hours.
            </p>
            <PullQuote>
              <span className="block">{"I didn't have 12 hours."}</span>
              <span className="block">{"I didn't have 24 hours."}</span>
              <span className="block text-tomato">I had twenty.</span>
            </PullQuote>
            <p>
              That changed the way I thought about the product. Real life should not adapt to the calculator. The software should adapt to real life.
            </p>
          </StoryChapter>

          <StoryChapter
            eyebrow="Chapter 3"
            title="From calculator to workflow"
            image={{
              src: "/dough-guide/guide-step-08-ball.webp",
              alt: "Pizza dough balls prepared in a tray.",
              caption: "Once timing mattered, the calculator became a preparation flow.",
            }}
          >
            <p>
              Every solved problem created another one. If the dough needs twenty hours, when do I mix? When do I ball? Should it rest at room temperature or go into the fridge? When do I preheat? When should I actually bake?
            </p>
            <PullQuote>
              <span className="block">I stopped building a calculator.</span>
              <span className="block text-tomato">I started building a workflow.</span>
            </PullQuote>
            <p>
              That workflow became Pizza Session: not a different logic, but the natural continuation of a real bake. A pizza night is not only a formula. It is dough, shopping, timing, oven work, serving and learning from what happened.
            </p>
            <div className="pt-2">
              <SecondaryLink href="/session/start">Explore Pizza Sessions</SecondaryLink>
            </div>
          </StoryChapter>

          <StoryChapter eyebrow="Chapter 4" title="Everyone starts somewhere." reverse>
            <p>
              People do not arrive at pizza making with the same confidence. One person needs a calm first step. Another wants to understand what changed. Someone else wants the variable, the assumption and the reason.
            </p>
            <PullQuote>
              <span className="block">The calculations stay the same.</span>
              <span className="block text-tomato">The explanation changes.</span>
            </PullQuote>
            <div className="grid gap-3 sm:grid-cols-3">
              {experienceLevels.map((level) => (
                <section key={level.title} className="rounded-[1.5rem] border border-white/80 bg-white/82 p-4 shadow-sm">
                  <h3 className="text-base font-extrabold text-ink">{level.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{level.body}</p>
                </section>
              ))}
            </div>
            <p>
              That matters because a beginner should not be buried under technical language, and a Pizza Nerd should not be forced to trust a mystery box.
            </p>
          </StoryChapter>

          <StoryChapter
            eyebrow="Chapter 5"
            title="My first unforgettable pizza."
            image={{
              src: "/images/shopping/pizza-margherita.webp",
              alt: "Freshly baked Margherita pizza with tomato, mozzarella and basil.",
              caption: "Pizza Napoletana became the first style I truly fell in love with.",
            }}
          >
            <p>
              I still remember the first pizza in Italy that stayed with me. Not because I can turn the moment into a technical case study. I remember the feeling: the soft rim, the heat, the tomato, the smell and the way something so simple could feel complete.
            </p>
            <p>
              Pizza Napoletana became my first pizza love. It gave me a reason to care about dough, fermentation and timing in a way that felt emotional before it felt technical.
            </p>
            <p>
              Other styles will come later because I want to fall in love with those as well. DoughTools starts with the pizza that pulled me in first.
            </p>
          </StoryChapter>

          <StoryChapter
            eyebrow="Chapter 6"
            title="The evening that changed everything."
            reverse
            image={{
              src: "/images/timeline/bake-pizza.webp",
              alt: "Pizza baking in a hot oven.",
              caption: "One oven, many pizzas and a plan that finally disappeared into the evening.",
            }}
          >
            <p>
              The clearest proof came during a pizza night for twenty people. One pizza oven. Many pizzas. Everything prepared before the pressure started.
            </p>
            <p>
              The dough was ready. The toppings were ready. The order of the evening made sense. Everything was prepared. Everything worked.
            </p>
            <p>
              That was the first time the planning disappeared and the pizza became enjoyable. I was not fighting the schedule. I was making pizza.
            </p>
            <p className="text-xl font-extrabold leading-8 text-ink">
              Good planning gives you more time to enjoy the people around the table.
            </p>
          </StoryChapter>

          <StoryChapter
            eyebrow="Chapter 7"
            title="Then another problem appeared."
            image={{
              src: "/images/shopping/pizza-prosciutto.webp",
              alt: "Freshly baked pizza prepared for serving.",
              caption: "The harder the guest list became, the more the plan needed one source of truth.",
            }}
          >
            <p>
              When more friends came, the pizza itself was no longer the only challenge. Everyone wanted something different. One person changed their mind. Someone brought another guest. Choices were scattered across messages.
            </p>
            <PullQuote>
              <span className="block">{"I realised I wasn't planning pizza anymore."}</span>
              <span className="block text-tomato">I was organising messages.</span>
            </PullQuote>
            <p>
              Party Orders came from that exact friction. Share one link. Collect choices. Review totals. Create Pizza Session. The workflow keeps the human part intact while removing the message chaos around it.
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              {partyOrderSteps.map((step, index) => (
                <article key={step} className="rounded-[1.35rem] border border-white/80 bg-white/82 p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[.18em] text-tomato">Step {index + 1}</p>
                  <h3 className="mt-2 text-base font-extrabold text-ink">{step}</h3>
                </article>
              ))}
            </div>
            <div className="pt-2">
              <SecondaryLink href="/account/party-orders/new">Plan a Pizza Party</SecondaryLink>
            </div>
          </StoryChapter>
        </article>

        <section className="relative mt-8 overflow-hidden rounded-[2.5rem] bg-ink px-6 py-10 text-white shadow-card sm:px-10 sm:py-14">
          <div className="absolute -right-28 -top-28 h-64 w-64 rounded-full bg-tomato/20 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl">
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-orange">Chapter 8</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-6xl">What I believe.</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {beliefs.map((belief) => (
                <p key={belief} className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 text-base font-bold leading-7 text-white/78">
                  {belief}
                </p>
              ))}
            </div>
            <PullQuote dark>
              <span className="block">Transparent tools, not magic.</span>
            </PullQuote>
            <p className="max-w-3xl text-base leading-8 text-white/70">
              That is why the methodology stays visible, why the product avoids unsupported promises and why it keeps reminding the maker that the dough, oven and real evening still matter.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl py-12 sm:py-16">
          <p className="text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Chapter 9</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
            Still building.
          </h2>
          <div className="mt-6 space-y-4 text-base leading-8 text-ink/68">
            <p>
              I still make pizza. I still experiment. I still notice problems while preparing for friends, changing a schedule or trying to understand why one dough felt better than another.
            </p>
            <p>
              Then I build. Then I test. Then I learn again.
            </p>
          </div>
          <PullQuote>
            <span className="block">If DoughTools helps you make your first great pizza...</span>
            <span className="block">or confidently host twenty friends...</span>
            <span className="block text-tomato">then every evening spent building it has been worth it.</span>
          </PullQuote>
          <p className="text-lg font-extrabold leading-8 text-ink">{"I'd love to hear your ideas."}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Share an idea
            </Link>
            <SecondaryLink href="/session/start">Explore Pizza Sessions</SecondaryLink>
          </div>
        </section>

        <section className="grid gap-4 rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-sm sm:grid-cols-3 sm:p-6">
          <div>
            <h2 className="text-base font-extrabold text-ink">Trust and methodology</h2>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              DoughTools gives planning guidance, not guarantees. The calculation method and limits stay visible.
            </p>
          </div>
          <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/62 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-8 border-t border-ink/10 py-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
