import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pizza Troubleshooting Guide | DoughTools",
  description:
    "Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.",
};

type Problem = {
  title: string;
  whatYouSee: string;
  likelyCauses: string[];
  fixNow: string[];
  preventNextTime: string[];
};

type TroubleshootingSection = {
  id: string;
  title: string;
  intro: string;
  visual: {
    label: string;
    accent: string;
    motif: string;
  };
  problems: Problem[];
};

const troubleshootingSections: TroubleshootingSection[] = [
  {
    id: "dough-and-fermentation",
    title: "Dough and fermentation",
    intro: "Most dough problems come from time, temperature, yeast activity, hydration or gluten development.",
    visual: {
      label: "Time, temperature and dough strength",
      accent: "bg-leaf",
      motif: "Dough",
    },
    problems: [
      {
        title: "Dough is not rising",
        whatYouSee:
          "The dough looks almost the same after resting, with little volume increase and few signs of fermentation.",
        likelyCauses: [
          "yeast is old or inactive",
          "room temperature is too cold",
          "dough needs more time",
          "water was too hot and weakened the yeast",
          "yeast type or amount was not matched to the fermentation plan",
        ],
        fixNow: [
          "give the dough more time",
          "move it to a slightly warmer place",
          "keep it covered so it does not dry out",
          "continue the session only when the dough shows signs of fermentation",
        ],
        preventNextTime: [
          "use fresh yeast",
          "match yeast type to the recipe",
          "plan around the real room or fridge temperature",
          "avoid very hot water when mixing",
        ],
      },
      {
        title: "Dough is too sticky",
        whatYouSee:
          "The dough sticks heavily to your hands, bench, container or peel and is difficult to shape.",
        likelyCauses: [
          "hydration is high for the flour",
          "flour is too weak for the hydration",
          "dough is too warm",
          "dough is underdeveloped",
          "not enough rest",
          "too much water was added by feel",
        ],
        fixNow: [
          "rest the dough before shaping",
          "use lightly floured or lightly oiled hands",
          "keep the bench lightly floured",
          "chill briefly if the dough is very warm",
          "avoid adding too much extra flour at once",
        ],
        preventNextTime: [
          "lower hydration slightly",
          "use stronger flour",
          "measure water accurately",
          "give the dough enough rest and structure",
        ],
      },
      {
        title: "Dough springs back",
        whatYouSee: "The dough stretches, then quickly pulls back and refuses to stay open.",
        likelyCauses: [
          "dough is too cold",
          "gluten is too tight",
          "dough has not rested enough",
          "dough balls were shaped too tightly",
          "the dough was handled too aggressively",
        ],
        fixNow: [
          "cover the dough and rest it for 10–20 minutes",
          "let cold dough warm up before shaping",
          "stretch in stages instead of forcing it",
          "keep the rim intact and work gently from the center outward",
        ],
        preventNextTime: [
          "take dough balls out early enough before baking",
          "allow enough final rest after balling",
          "avoid over-tightening the dough balls",
        ],
      },
      {
        title: "Dough tears or gets holes",
        whatYouSee:
          "The dough rips during shaping, becomes very thin in the center, or develops holes.",
        likelyCauses: [
          "gluten is underdeveloped",
          "dough has not rested enough",
          "dough is too dry",
          "dough is too cold",
          "the center was stretched too thin",
          "shaping was too aggressive",
        ],
        fixNow: [
          "stop stretching and let the dough rest",
          "pinch small holes closed",
          "use gentler movements",
          "avoid pressing all air out of the rim",
        ],
        preventNextTime: [
          "develop the dough better during mixing or folding",
          "give it enough rest",
          "handle the center gently",
          "keep dough covered so it does not dry out",
        ],
      },
    ],
  },
  {
    id: "shaping-and-launching",
    title: "Shaping and launching",
    intro:
      "Many pizza problems happen after the dough is ready: stretching, topping and launching need a light touch and good timing.",
    visual: {
      label: "Gentle handling and quick launch",
      accent: "bg-tomato",
      motif: "Launch",
    },
    problems: [
      {
        title: "Pizza sticks to the peel",
        whatYouSee:
          "The topped pizza will not slide from the peel into the oven, or it stretches and deforms when launched.",
        likelyCauses: [
          "dough is too sticky",
          "peel is not floured enough",
          "pizza sat too long on the peel",
          "sauce or toppings made the base wet",
          "the pizza is overloaded",
          "a hole in the dough allowed moisture through",
        ],
        fixNow: [
          "gently shake the peel before launching",
          "lift an edge and add a little flour if needed",
          "launch quickly after topping",
          "if it is badly stuck, rescue it before forcing the launch",
        ],
        preventNextTime: [
          "build one pizza at a time",
          "keep toppings light",
          "use a small amount of flour or semolina on the peel",
          "avoid wet toppings leaking into the base",
          "check that the dough moves before going to the oven",
        ],
      },
    ],
  },
  {
    id: "baking-and-toppings",
    title: "Baking and toppings",
    intro:
      "A good bake depends on heat balance, topping moisture and how much weight is placed on the center of the pizza.",
    visual: {
      label: "Heat balance and topping moisture",
      accent: "bg-orange",
      motif: "Bake",
    },
    problems: [
      {
        title: "Pizza is soggy in the middle",
        whatYouSee: "The center is wet, soft or doughy even when the rim looks baked.",
        likelyCauses: [
          "too much sauce",
          "wet mozzarella or toppings",
          "too many toppings",
          "dough center is too thick",
          "stone or steel is not hot enough",
          "oven has not recovered between pizzas",
        ],
        fixNow: [
          "bake slightly longer if the top is not burning",
          "use less sauce next time",
          "drain mozzarella well",
          "keep the center lighter",
          "let the stone or steel reheat before the next pizza",
        ],
        preventNextTime: [
          "stretch the center thinner",
          "use less wet topping load",
          "preheat the oven, stone or steel fully",
          "give the oven time to recover between pizzas",
        ],
      },
      {
        title: "Crust burns but middle is doughy",
        whatYouSee: "The rim gets dark or burns before the center and base are fully cooked.",
        likelyCauses: [
          "top heat or flame is too strong",
          "stone is not heat-soaked enough",
          "pizza is too close to the flame",
          "dough is too thick",
          "toppings are too heavy or wet",
        ],
        fixNow: [
          "rotate the pizza more often",
          "move it away from the strongest flame if possible",
          "reduce flame after launch in a pizza oven",
          "give the base more time if the top can handle it",
        ],
        preventNextTime: [
          "preheat the stone properly",
          "manage flame during the bake",
          "stretch thinner",
          "use fewer wet toppings",
          "avoid overloading the center",
        ],
      },
      {
        title: "Base burns underneath",
        whatYouSee: "The bottom burns before the top is ready, often with bitter black flour spots.",
        likelyCauses: [
          "too much flour or semolina under the pizza",
          "stone is too hot for the dough style",
          "pizza stayed too long in one spot",
          "dough has sugar or oil and is baked too hot",
          "the oven is not managed between pizzas",
        ],
        fixNow: [
          "rotate earlier",
          "move the pizza to a slightly cooler area if possible",
          "remove loose burnt flour from the oven floor between pizzas",
        ],
        preventNextTime: [
          "use less launch flour",
          "brush off excess flour before launch",
          "match dough style to oven temperature",
          "avoid sugar/oil-rich doughs at very high heat",
        ],
      },
      {
        title: "Toppings release too much water",
        whatYouSee:
          "The pizza looks watery, cheese slides, the center softens, or toppings pool liquid during baking.",
        likelyCauses: [
          "mozzarella was too wet",
          "mushrooms, vegetables or fresh toppings released water",
          "sauce was too thin",
          "too many toppings were used",
          "toppings were concentrated in the center",
        ],
        fixNow: [
          "use less wet topping on the next pizza",
          "drain mozzarella",
          "keep the center lighter",
          "bake watery vegetables first if needed",
        ],
        preventNextTime: [
          "drain or dry wet ingredients",
          "use thicker sauce",
          "pre-cook watery vegetables when needed",
          "use fewer toppings per pizza",
          "spread toppings evenly and lightly",
        ],
      },
    ],
  },
  {
    id: "home-oven-problems",
    title: "Home oven problems",
    intro:
      "Home ovens usually need more heat management, longer preheating and a good baking surface to get closer to pizza-oven results.",
    visual: {
      label: "Heat-soaked stone, steel or tray",
      accent: "bg-ink",
      motif: "Home oven",
    },
    problems: [
      {
        title: "Home oven pizza is pale or soft",
        whatYouSee: "The pizza bakes slowly, the crust stays pale, or the base lacks crispness.",
        likelyCauses: [
          "oven is not hot enough",
          "stone or steel was not preheated long enough",
          "no stone, steel or hot baking surface is used",
          "too much moisture from sauce or toppings",
          "dough is too thick",
        ],
        fixNow: [
          "bake longer if needed",
          "move the pizza closer to stronger heat if safe",
          "finish briefly under the grill or broiler if appropriate for the oven",
        ],
        preventNextTime: [
          "preheat longer",
          "use a pizza stone, steel or hot tray if available",
          "use the hottest safe oven setting",
          "reduce wet toppings",
          "stretch the base thinner",
        ],
      },
    ],
  },
];

function VisualPanel({ visual, index }: { visual: TroubleshootingSection["visual"]; index: number }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] border border-white/80 bg-[#f3e8d7] shadow-card" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.9),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(233,75,46,.2),transparent_22%),radial-gradient(circle_at_65%_78%,rgba(59,166,107,.18),transparent_28%)]" />
      <div className="absolute -left-8 bottom-5 h-28 w-28 rounded-full border-[18px] border-white/60 bg-orange/20" />
      <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-tomato/15" />
      <div className="absolute right-8 top-8 grid h-14 w-14 rotate-12 place-items-center rounded-[1.1rem] bg-white/75 text-xl shadow-sm">
        {index === 0 ? "🌾" : index === 1 ? "🍕" : index === 2 ? "🍅" : "🔥"}
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/80 p-4 backdrop-blur">
        <span className={`mb-3 block h-1.5 w-16 rounded-full ${visual.accent}`} />
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-ink/40">{visual.motif}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink">{visual.label}</p>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink/60">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato/70" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <article className="rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-card backdrop-blur sm:p-6">
      <h3 className="font-display text-2xl font-semibold text-ink">{problem.title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-cream/70 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">What you see</h4>
          <p className="mt-2 text-sm leading-6 text-ink/65">{problem.whatYouSee}</p>
        </div>
        <div className="rounded-2xl bg-[#fff7ed]/80 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Likely causes</h4>
          <BulletList items={problem.likelyCauses} />
        </div>
        <div className="rounded-2xl bg-white p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">Fix it now</h4>
          <BulletList items={problem.fixNow} />
        </div>
        <div className="rounded-2xl bg-leaf/[.08] p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Prevent it next time</h4>
          <BulletList items={problem.preventNextTime} />
        </div>
      </div>
    </article>
  );
}

export default function PizzaTroubleshootingGuidePage() {
  return (
    <main className="guide-page min-h-screen overflow-x-clip px-4 py-5 text-ink sm:px-6 sm:py-10">
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/guide" className="flex items-center gap-2 text-sm font-bold text-ink/65 transition hover:text-ink">
            <span aria-hidden="true">←</span>
            Back to Guide
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-card backdrop-blur sm:p-10 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-8">
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">DoughTools guide</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[.95] tracking-tight sm:text-6xl">
              Pizza Troubleshooting Guide
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
              Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.
            </p>
            <p className="mt-4 max-w-2xl rounded-2xl bg-leaf/[.08] p-4 text-sm leading-6 text-ink/65">
              Pizza usually goes wrong for a reason: timing, temperature, hydration, flour strength, toppings or oven setup.
              This guide helps you diagnose common problems and choose a practical next step.
            </p>
          </div>
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-[#f1e2cd] shadow-card lg:mt-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(255,255,255,.86),transparent_24%),radial-gradient(circle_at_74%_22%,rgba(233,75,46,.25),transparent_22%),radial-gradient(circle_at_50%_76%,rgba(59,166,107,.16),transparent_30%)]" />
            <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-tomato/75 shadow-lg" />
            <div className="absolute right-10 top-16 h-16 w-16 rounded-full bg-leaf/70 shadow-lg" />
            <div className="absolute bottom-8 left-10 right-10 rounded-[2rem] border-[18px] border-[#d9a85c]/45 bg-white/35 p-10 backdrop-blur-sm" />
            <div className="absolute bottom-8 right-8 rounded-2xl bg-ink px-5 py-4 text-white shadow-card">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/45">Troubleshoot</p>
              <p className="font-display text-3xl font-semibold">10 common problems</p>
            </div>
          </div>
        </section>

        <nav className="sticky top-2 z-20 -mx-1 my-8 overflow-x-auto rounded-2xl border border-white/80 bg-cream/90 p-1.5 shadow-lg shadow-ink/5 backdrop-blur" aria-label="Troubleshooting sections">
          <div className="flex min-w-max gap-1">
            {troubleshootingSections.map((section, index) => (
              <a key={section.id} href={`#${section.id}`} className="rounded-xl px-3 py-2 text-xs font-bold text-ink/55 transition hover:bg-white hover:text-ink">
                <span className="mr-1 text-tomato">{index + 1}.</span>
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-12">
          {troubleshootingSections.map((section, sectionIndex) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
                <div className="lg:sticky lg:top-24">
                  <VisualPanel visual={section.visual} index={sectionIndex} />
                  <div className="mt-4 rounded-[1.5rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Section {sectionIndex + 1}</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold">{section.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-ink/60">{section.intro}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {section.problems.map((problem) => (
                    <ProblemCard key={problem.title} problem={problem} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
