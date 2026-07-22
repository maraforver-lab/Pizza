import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import OvenGuideHero from "@/components/ovens/OvenGuideHero";
import { pizzaSessionOvenSupportSummary } from "@/lib/oven-education";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

const homeProfile = getPizzaSessionBakeProfile("home");
const pizzaProfile = getPizzaSessionBakeProfile("gas");

const ovenSetups = [
  {
    id: "home-oven",
    title: homeProfile.label,
    icon: "oven" as DoughToolsIconName,
    tone: "light",
    heat: homeProfile.temperatureLabel,
    preheat: "Preheat until the oven and baking surface are fully ready.",
    bake: `${homeProfile.bakeTimeLabel} planning default`,
    placement: "Upper-middle or upper-third rack to start; adjust for top and bottom balance.",
    result: "Longer bake, more drying risk, steadier workflow and good browning when the surface is hot.",
    useWhen: "Use this for normal home ovens, tray bakes, stone bakes and steel bakes.",
  },
  {
    id: "pizza-oven",
    title: pizzaProfile.label,
    icon: "flame" as DoughToolsIconName,
    tone: "dark",
    heat: pizzaProfile.temperatureLabel,
    preheat: `${pizzaProfile.preheatDurationMinutes} min pizza-plan preheat window`,
    bake: `${pizzaProfile.bakeTimeLabel} planning default`,
    placement: "Launch onto the hot floor or stone where top heat and floor heat are balanced.",
    result: "Fast oven spring, rapid colour, lower topping tolerance and a short turning window.",
    useWhen: "Use this for dedicated high-heat pizza ovens and high-heat round pizza styles.",
  },
] as const;

const comparisonRows = [
  ["Heat", "What temperature can it realistically reach?", "Heat"],
  ["Preheat", "How long should I preheat it?", "Preheat"],
  ["Placement", "Where should the pizza go?", "Placement"],
  ["Bake", "How long should it bake?", "Bake"],
  ["Expected result", "What should I expect?", "Expected result"],
] as const;

const pizzaOvenSteps = [
  `Preheat for the current ${pizzaProfile.preheatDurationMinutes} min pizza-plan window and judge the floor, not only the flame.`,
  "Launch onto a balanced floor spot where the base can set before the rim scorches.",
  `${pizzaProfile.rotationGuidance} Start checking early because ${pizzaProfile.bakeTimeLabel} is a short bake window.`,
  "Remove when the rim is browned, the bottom is baked, and the cheese is melted.",
] as const;

const homeOvenSteps = [
  "Preheat until the oven and baking surface are fully ready. The oven reaching its set temperature may be enough for a tray, but stone or steel often needs more time to heat through.",
  "Use the highest reliable oven temperature and start with the stone, steel or tray in the upper-middle or upper third of the oven.",
  "Check the actual surface temperature when you have an infrared thermometer; otherwise judge the first bake and adjust.",
  `${homeProfile.rotationGuidance} Use broiler or grill help briefly at the end only when it is safe for your oven and the top is lagging.`,
  `Plan around ${homeProfile.bakeTimeLabel}, then judge the rim, bottom and cheese instead of treating the clock as exact.`,
] as const;

const homeOvenLevelGuidance = [
  {
    level: "Beginner",
    title: "Use one reliable starting setup.",
    body:
      "Set the oven as hot as it reliably goes, place the stone, steel or tray in the upper-middle or upper third, wait until the oven and surface are ready, check the pizza after about 4 minutes, and use the grill or broiler briefly at the end only if the top needs help.",
  },
  {
    level: "Enthusiast",
    title: "Adjust from the baked result.",
    body:
      "If the top stays pale, move the surface higher or finish briefly with grill heat. If the base burns too early, move lower or reduce bottom heat. Steel heats and browns the base faster, stone is more forgiving, and both may need recovery time between pizzas.",
  },
  {
    level: "Pizza Nerd",
    title: "Separate oven air from surface heat.",
    body:
      "Oven air can reach the set temperature before a stone or steel is saturated. Calibrate the surface temperature when you can, balance top heat against bottom heat with rack position, and expect steel, stone and tray bakes to recover and brown differently between pizzas.",
  },
] as const;

const surfaceGuidance = [
  {
    title: "Steel",
    body: "Fast bottom heat and strong browning. Watch for the base finishing before the top.",
  },
  {
    title: "Stone",
    body: "Gentler transfer and balanced bottom heat. Give it enough time to soak through.",
  },
  {
    title: "Tray",
    body: "Accessible fallback for home ovens. Expect a longer, less pizza-oven-like result.",
  },
] as const;

const improvementItems = [
  {
    title: "Pale or soft base",
    icon: "oven" as DoughToolsIconName,
    body: "The baking surface is usually underheated, too gentle, or overloaded with wet toppings.",
  },
  {
    title: "Burnt base, pale top",
    icon: "flame" as DoughToolsIconName,
    body: "Bottom heat is outrunning top heat. Move to a cooler zone, higher rack, or gentler surface next time.",
  },
  {
    title: "Top burns first",
    icon: "warning" as DoughToolsIconName,
    body: "Top heat is too aggressive for the surface underneath. Let the stone, steel or floor recover.",
  },
  {
    title: "Later pizzas get worse",
    icon: "timer" as DoughToolsIconName,
    body: "The surface lost heat. Pause between pizzas and judge the launch area before the next bake.",
  },
] as const;

const sessionEffects = [
  "Home oven and Pizza oven are the supported pizza-plan choices.",
  "The selected oven changes the preheat window and the baking copy used in Timeline and Kitchen.",
  "DoughTools uses a planning default, while real bake time still depends on surface heat, topping moisture and visual doneness.",
  "Choosing Home oven does not promise a dedicated pizza-oven result; it plans for a longer home-oven rhythm.",
] as const;

const safetyItems = [
  "Follow your own appliance manual.",
  "Use outdoor-only ovens outdoors.",
  "Keep hot tools and launch paths clear.",
  "Let stone, steel and oven parts cool before handling.",
] as const;

const equipmentGroups = [
  {
    title: "Essential",
    intro: "Start with the tools that protect the dough, confirm heat and keep the launch controlled.",
    items: [
      {
        name: "Digital scale",
        image: {
          src: "/ovens/equipment/digital-scale.svg",
          alt: "Digital kitchen scale with a small bowl on top.",
        },
        use: "Measures flour, water, salt and dough-ball weight repeatably.",
        priority: "Essential",
        ovenFit: "Both",
        beginner: "Yes. Use it from the first batch.",
        tip: "Use at least 1 g resolution for dough and a 0.01 g scale when yeast amounts are tiny.",
      },
      {
        name: "Lidded proofing box",
        image: {
          src: "/ovens/equipment/lidded-proofing-box.svg",
          alt: "Clear lidded proofing box holding dough balls.",
        },
        use: "Keeps dough balls covered so they do not dry out before stretching.",
        priority: "Essential",
        ovenFit: "Both",
        beginner: "Yes, or use food-safe lidded containers.",
        tip: "Leave room between dough balls so they do not merge during proofing.",
      },
      {
        name: "Dough scraper",
        image: {
          src: "/ovens/equipment/dough-scraper.svg",
          alt: "Flat dough scraper beside a dough ball.",
        },
        use: "Releases dough from the box and helps move sticky dough without tearing it.",
        priority: "Essential",
        ovenFit: "Both",
        beginner: "Yes. It prevents rough handling.",
        tip: "Scrape under the dough instead of pulling the dough upward by force.",
      },
      {
        name: "Launching peel",
        image: {
          src: "/ovens/equipment/launching-peel.svg",
          alt: "Long launching peel holding an untopped pizza base.",
        },
        use: "Moves a topped pizza from the station to the hot surface.",
        priority: "Essential",
        ovenFit: "Both",
        beginner: "Yes for stone, steel and pizza-oven baking.",
        tip: "Do a short shake test before launch; if it sticks, lift the edge and add a tiny amount of flour.",
      },
      {
        name: "Infrared thermometer",
        image: {
          src: "/ovens/equipment/infrared-thermometer.svg",
          alt: "Infrared thermometer aimed at a hot baking surface.",
        },
        use: "Checks whether the stone, steel or oven floor is actually ready.",
        priority: "Essential",
        ovenFit: "Pizza oven; useful for home oven surfaces too",
        beginner: "Yes for pizza ovens. Useful for home ovens with stone or steel.",
        tip: "Measure the same floor spot each time instead of trusting only the top heat or air temperature.",
      },
      {
        name: "Fire blanket and heat gloves",
        image: {
          src: "/ovens/equipment/fire-blanket-heat-gloves.svg",
          alt: "Folded fire blanket beside heat gloves.",
        },
        use: "Basic protection around flame, hot metal, stones and trays.",
        priority: "Essential",
        ovenFit: "Both",
        beginner: "Yes when working with high heat.",
        tip: "Keep the blanket reachable and never use gas pizza ovens indoors or in enclosed spaces.",
      },
    ],
  },
  {
    title: "Useful",
    intro: "Add these when you want smoother turns, cleaner prep and better serving flow.",
    items: [
      {
        name: "Turning peel",
        image: {
          src: "/ovens/equipment/turning-peel.svg",
          alt: "Small round turning peel for rotating pizza.",
        },
        use: "Turns fast-baking pizza without pulling the whole pizza out of the oven.",
        priority: "Useful",
        ovenFit: "Pizza oven",
        beginner: "Not required immediately, but it helps once bakes get faster.",
        tip: "Lift slightly before turning so the peel does not push through toppings.",
      },
      {
        name: "Stable prep table",
        image: {
          src: "/ovens/equipment/stable-prep-table.svg",
          alt: "Stable prep table with organized pizza tools.",
        },
        use: "Gives a clean, steady surface for opening, topping and peel movement.",
        priority: "Useful",
        ovenFit: "Both",
        beginner: "Useful if your current surface is cramped or wobbly.",
        tip: "Keep raw dough, flour, hot tools and finished pizza in separate zones.",
      },
      {
        name: "Opening-flour tray",
        image: {
          src: "/ovens/equipment/opening-flour-tray.svg",
          alt: "Shallow tray with flour for coating dough.",
        },
        use: "Coats the dough ball evenly before stretching.",
        priority: "Useful",
        ovenFit: "Both",
        beginner: "Useful, but a shallow bowl or tray can work at first.",
        tip: "Use flour sparingly; too much loose flour can burn on hot stone or steel.",
      },
      {
        name: "Cooling rack and cutting board",
        image: {
          src: "/ovens/equipment/cooling-rack-cutting-board.svg",
          alt: "Cooling rack set above a cutting board.",
        },
        use: "Lets steam escape briefly before slicing and serving.",
        priority: "Useful",
        ovenFit: "Both",
        beginner: "Useful once the base is baking well.",
        tip: "Rest the pizza 30-60 seconds on a rack, then cut on a separate board.",
      },
      {
        name: "Wheel or pizza scissors",
        image: {
          src: "/ovens/equipment/wheel-pizza-scissors.svg",
          alt: "Pizza cutter wheel and pizza scissors.",
        },
        use: "Slices pizza without crushing the rim or dragging toppings.",
        priority: "Useful",
        ovenFit: "Both",
        beginner: "Useful but not a launch blocker.",
        tip: "Keep the blade sharp and avoid cutting on the peel.",
      },
    ],
  },
  {
    title: "Optional",
    intro: "These are convenience or maintenance upgrades, not things you need before the first bake.",
    items: [
      {
        name: "Stone brush or scraper",
        image: {
          src: "/ovens/equipment/stone-brush-scraper.svg",
          alt: "Stone brush and scraper for cleaning a baking surface.",
        },
        use: "Removes burned flour from the hot surface between pizzas.",
        priority: "Optional",
        ovenFit: "Pizza oven; useful for stone or steel home setups",
        beginner: "No. Add it when you bake often.",
        tip: "Use maker-approved tools and avoid shedding wire bristles. Never pour water on a hot stone.",
      },
      {
        name: "Cover and storage",
        image: {
          src: "/ovens/equipment/cover-storage.svg",
          alt: "Protective cover folded beside an outdoor pizza oven.",
        },
        use: "Protects outdoor oven parts from weather between uses.",
        priority: "Optional",
        ovenFit: "Pizza oven",
        beginner: "No, unless the oven lives outdoors.",
        tip: "Cover only when the oven is fully cool and dry so moisture is not trapped.",
      },
    ],
  },
] as const;

function metricValue(setup: (typeof ovenSetups)[number], label: (typeof comparisonRows)[number][0]) {
  if (label === "Heat") return setup.heat;
  if (label === "Preheat") return setup.preheat;
  if (label === "Placement") return setup.placement;
  if (label === "Bake") return setup.bake;
  return setup.result;
}

export default function OvensPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <LearningBreadcrumbs current="Baking guides" />
        <OvenGuideHero />

        <section id="oven-comparison" className="mt-6 scroll-mt-24" aria-labelledby="oven-comparison-title">
          <div className="rounded-[1.5rem] border border-leaf/20 bg-leaf/10 p-4 sm:p-5">
            <h2 id="oven-comparison-title" className="text-sm font-extrabold text-ink">
              Pick the oven path that matches your real heat
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-ink/65">{pizzaSessionOvenSupportSummary}</p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {ovenSetups.map((setup) => {
              const dark = setup.tone === "dark";
              return (
                <article key={setup.id} className={cardClass({ className: "p-5 sm:p-6", variant: dark ? "dark" : "default" })}>
                  <div className="flex items-start gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${dark ? "bg-white/10 text-oven-gold" : "bg-tomato/10 text-tomato"}`} aria-hidden="true">
                      <DoughToolsIcon name={setup.icon} size={24} />
                    </span>
                    <div>
                      <h3 className="font-display text-3xl font-semibold">{setup.title}</h3>
                      <p className={`mt-2 text-sm leading-6 ${dark ? "text-white/70" : "text-ink/64"}`}>{setup.useWhen}</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid gap-3">
                    {comparisonRows.map(([label, question]) => (
                      <div key={label} className={`rounded-[1rem] p-3 ${dark ? "bg-white/[.07]" : "bg-cream/70"}`}>
                        <dt className={`text-[0.68rem] font-black uppercase tracking-[.14em] ${dark ? "text-white/45" : "text-ink/42"}`}>
                          {question}
                        </dt>
                        <dd className={`mt-1 text-sm font-bold leading-5 ${dark ? "text-white/82" : "text-ink/74"}`}>{metricValue(setup, label)}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-labelledby="actionable-bake-title">
          <div className="lg:col-span-2">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Bake instructions</p>
            <h2 id="actionable-bake-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Preheat the surface, place the pizza deliberately, then watch the result.
            </h2>
          </div>

          <article className={cardClass({ className: "p-5 sm:p-6", variant: "dark" })} aria-labelledby="pizza-oven-steps-title">
            <h3 id="pizza-oven-steps-title" className="font-display text-3xl font-semibold">Pizza oven</h3>
            <ol className="mt-5 grid gap-3">
              {pizzaOvenSteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm leading-6 text-white/72">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-oven-gold text-xs font-black text-ink">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className={cardClass({ className: "p-5 sm:p-6", variant: "default" })} aria-labelledby="home-oven-steps-title">
            <h3 id="home-oven-steps-title" className="font-display text-3xl font-semibold">Home oven</h3>
            <ol className="mt-5 grid gap-3">
              {homeOvenSteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 text-sm leading-6 text-ink/66">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-tomato text-xs font-black text-white">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 grid gap-3" aria-label="Home oven guidance by experience level">
              {homeOvenLevelGuidance.map((item) => (
                <section key={item.level} className="rounded-[1rem] border border-ink/10 bg-flour/70 p-4">
                  <p className="text-[0.68rem] font-black uppercase tracking-[.14em] text-tomato">{item.level}</p>
                  <h4 className="mt-1 text-sm font-extrabold text-ink">{item.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-ink/62">{item.body}</p>
                </section>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.78fr)_minmax(0,1fr)]" aria-labelledby="surface-title">
          <aside className={cardClass({ className: "p-5 sm:p-6", variant: "information" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Stone, steel and tray</p>
            <h2 id="surface-title" className="mt-3 font-display text-3xl font-semibold">Home-oven surface choice changes the bottom heat.</h2>
            <dl className="mt-5 grid gap-3">
              {surfaceGuidance.map((item) => (
                <div key={item.title} className="rounded-[1rem] bg-white p-4">
                  <dt className="text-sm font-extrabold">{item.title}</dt>
                  <dd className="mt-1 text-sm leading-6 text-ink/62">{item.body}</dd>
                </div>
              ))}
            </dl>
          </aside>

          <article className={cardClass({ className: "p-5 sm:p-6", variant: "default" })} aria-labelledby="improve-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Improve the setup</p>
                <h2 id="improve-title" className="mt-3 font-display text-3xl font-semibold">Use the baked pizza as feedback.</h2>
              </div>
              <Link href="/guide/pizza-troubleshooting" className={buttonClass({ className: "w-full shrink-0 sm:w-auto", variant: "secondary" })}>
                Open troubleshooting
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {improvementItems.map((item) => (
                <section key={item.title} className="rounded-[1rem] border border-ink/10 bg-flour/70 p-4" aria-label={item.title}>
                  <DoughToolsIcon name={item.icon} size={20} className="text-tomato" />
                  <h3 className="mt-2 text-sm font-extrabold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/62">{item.body}</p>
                </section>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,.75fr)]" aria-labelledby="session-effect-title">
          <article className={cardClass({ className: "p-5 sm:p-6", variant: "success" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza plan effect</p>
            <h2 id="session-effect-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Use the same oven choice when you plan.
            </h2>
            <ul className="mt-5 grid gap-2 text-sm leading-6 text-ink/66">
              {sessionEffects.map((item) => (
                <li key={item} className="flex gap-2">
                  <DoughToolsIcon name="success" size={16} className="mt-1 shrink-0 text-leaf" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <aside className="rounded-[1.5rem] border border-tomato/15 bg-tomato/5 p-5" aria-labelledby="oven-safety-title">
            <h2 id="oven-safety-title" className="text-sm font-extrabold text-ink">Safety checks</h2>
            <ul className="mt-3 grid gap-2">
              {safetyItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-ink/64">
                  <DoughToolsIcon name="warning" size={16} className="mt-1 shrink-0 text-tomato" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section id="other-equipment" className="mt-8 scroll-mt-24" aria-labelledby="other-equipment-title">
          <div className="rounded-[1.5rem] border border-ink/10 bg-white/[.78] p-5 shadow-card sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,.72fr)_minmax(18rem,.28fr)] lg:items-start">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Other equipment</p>
                <h2 id="other-equipment-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                  Start with a small working station, not a full gear wall.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/64">
                  Most pizza nights need a scale, covered dough storage, a scraper, a safe way to launch, and heat awareness. Everything else should support the oven path you actually use.
                </p>
              </div>

              <dl className="grid gap-2 rounded-[1rem] bg-cream/80 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-bold text-ink/58">Essential</dt>
                  <dd className="font-extrabold">6 tools</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-bold text-ink/58">Useful</dt>
                  <dd className="font-extrabold">5 tools</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-bold text-ink/58">Optional</dt>
                  <dd className="font-extrabold">2 tools</dd>
                </div>
              </dl>
            </div>

            <details className="group mt-5 rounded-[1.2rem] border border-ink/10 bg-flour/70">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-extrabold text-ink transition hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-flour sm:px-5">
                <span>Show more equipment</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-white transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>

              <div className="border-t border-ink/10 p-4 sm:p-5">
                <div className="grid gap-4">
                  {equipmentGroups.map((group) => (
                    <section key={group.title} className="rounded-[1rem] bg-white p-4" aria-labelledby={`equipment-${group.title.toLowerCase()}-title`}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 id={`equipment-${group.title.toLowerCase()}-title`} className="font-display text-2xl font-semibold">
                          {group.title}
                        </h3>
                        <p className="max-w-2xl text-sm leading-6 text-ink/58">{group.intro}</p>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {group.items.map((item) => (
                          <article key={item.name} className="rounded-[1rem] border border-ink/10 bg-cream/70 p-3.5 sm:p-4">
                            <div className="grid gap-3 sm:grid-cols-[5rem_1fr] sm:items-start">
                              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
                                <Image
                                  src={item.image.src}
                                  alt={item.image.alt}
                                  fill
                                  sizes="(min-width: 1024px) 80px, (min-width: 640px) 80px, calc(100vw - 4rem)"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <h4 className="text-base font-extrabold">{item.name}</h4>
                                    <p className="mt-1 text-sm leading-6 text-ink/64">{item.use}</p>
                                  </div>
                                  <span className="w-fit rounded-full bg-tomato/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[.12em] text-tomato">
                                    {item.priority}
                                  </span>
                                </div>
                                <dl className="mt-3 grid gap-2 text-xs leading-5 text-ink/62 sm:grid-cols-2">
                                  <div>
                                    <dt className="font-extrabold text-ink">Oven fit</dt>
                                    <dd>{item.ovenFit}</dd>
                                  </div>
                                  <div>
                                    <dt className="font-extrabold text-ink">Beginner need</dt>
                                    <dd>{item.beginner}</dd>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <dt className="font-extrabold text-ink">Use or safety note</dt>
                                    <dd>{item.tip}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-forest-dark p-6 text-white shadow-raised sm:p-8" aria-labelledby="oven-final-cta-title">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">Ready to plan</p>
          <h2 id="oven-final-cta-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Plan with the oven you actually have.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Your pizza plan uses your Home oven or Pizza oven choice for the current preheat window, bake guidance and kitchen instructions.
          </p>
          <div className="mt-6">
            <Link href="/session/start" className={buttonClass({ className: "w-full sm:w-auto", variant: "primary" })}>
              Plan a pizza
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/52">
            For dough handling, use <Link href="/guides/dough" className="font-bold text-oven-gold underline-offset-2 hover:underline">Dough guides</Link>. For topping moisture, use <Link href="/toppings" className="font-bold text-oven-gold underline-offset-2 hover:underline">Topping guides</Link>.
          </p>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
