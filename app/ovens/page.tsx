import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import OvenGuideHero from "@/components/ovens/OvenGuideHero";
import OvensQuickAnswer from "@/components/ovens/OvensQuickAnswer";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

const homeProfile = getPizzaSessionBakeProfile("home");
const pizzaProfile = getPizzaSessionBakeProfile("gas");

type OvenTeachingImage = {
  src: string;
  alt: string;
  caption: string;
};

const surfaceReadinessImage = {
  src: "/ovens/teaching/oven-surface-temperature-check.webp",
  alt: "Infrared thermometer aimed at a hot pizza stone inside a home oven.",
  caption: "Check that the baking surface is fully heated before launching.",
} as const satisfies OvenTeachingImage;

const bottomDonenessImage = {
  src: "/ovens/teaching/pizza-bottom-doneness-comparison.webp",
  alt: "Comparison of pale, properly baked and burnt pizza bases viewed from underneath.",
  caption: "Look for an evenly baked base: not pale and soft, but not deeply burnt.",
} as const satisfies OvenTeachingImage;

const heatBalanceImage = {
  src: "/ovens/teaching/pizza-heat-balance-comparison.webp",
  alt: "Comparison of uneven and balanced pizza baking with top and base doneness shown separately.",
  caption: "Judge the top and bottom separately before deciding which heat source needs adjustment.",
} as const satisfies OvenTeachingImage;

const recoveryImage = {
  src: "/ovens/teaching/oven-surface-recovery-between-pizzas.webp",
  alt: "Baking surface recovering in a pizza oven while the next unbaked pizza waits on a peel.",
  caption: "Let the baking surface recover before launching the next pizza.",
} as const satisfies OvenTeachingImage;

const ovenSetupPaths = [
  {
    title: "Home oven with baking steel",
    icon: "flame" as DoughToolsIconName,
    summary: "Steel transfers heat quickly. It gives strong base colour but may require careful top-heat management.",
    tone: "default",
    image: {
      src: "/ovens/teaching/home-oven-steel-position.webp",
      alt: "Baking steel positioned on an upper rack inside a home oven.",
      caption: "Place the baking steel in the recommended upper position so the base receives strong conductive heat while the top can still brown.",
    },
    steps: [
      {
        label: "Preheat",
        action: `Preheat for the current ${homeProfile.preheatDurationMinutes} min pizza-plan window.`,
        explanation: "A steel stores heat first, then transfers it into the base quickly.",
      },
      {
        label: "Position",
        action: "Start in the upper half of the oven.",
        explanation: "This helps the top keep up with the steel's strong bottom heat.",
      },
      {
        label: "Launch",
        action: "Launch quickly onto the hot steel.",
        explanation: "Keep the peel dry and moving so the dough does not stick before it reaches the surface.",
      },
      {
        label: "Manage the bake",
        action: "Add controlled top heat only when the top lags.",
        explanation: "A dark base with a pale top means bottom heat is outrunning top heat.",
      },
      {
        label: "Know when it is ready",
        action: "Remove when the base has colour and the top has caught up.",
        explanation: `Start checking near ${homeProfile.bakeTimeLabel}; steel can finish the base early.`,
      },
    ],
  },
  {
    title: "Home oven with pizza stone",
    icon: "oven" as DoughToolsIconName,
    summary: "Stone heats the base more gently than steel and usually needs a thorough preheat.",
    tone: "default",
    image: {
      src: "/ovens/teaching/home-oven-stone-position.webp",
      alt: "Pizza stone positioned on an upper-middle rack inside a home oven.",
      caption: "Position the stone correctly and give it a thorough preheat before launching the pizza.",
    },
    steps: [
      {
        label: "Preheat",
        action: `Preheat for the current ${homeProfile.preheatDurationMinutes} min pizza-plan window.`,
        explanation: "A stone often needs more time to heat through than the oven air display suggests.",
      },
      {
        label: "Position",
        action: "Start in the upper-middle or upper third.",
        explanation: "This keeps the top browning while the gentler stone sets the base.",
      },
      {
        label: "Launch",
        action: "Launch only when the stone is fully ready.",
        explanation: "An underheated stone leaves the underside pale, soft or bread-like.",
      },
      {
        label: "Manage the bake",
        action: "Use brief top heat when browning lags.",
        explanation: "Stone is more forgiving than steel, but the top can still need help near the end.",
      },
      {
        label: "Know when it is ready",
        action: "Check that the base is baked, not just the top.",
        explanation: `Plan around ${homeProfile.bakeTimeLabel}, then use the baked result to adjust the next pizza.`,
      },
    ],
  },
  {
    title: "Home oven with baking tray",
    icon: "oven" as DoughToolsIconName,
    summary: "A baking tray is less powerful than steel or stone, so the dough and topping load must remain realistic for the available heat.",
    tone: "information",
    image: {
      src: "/ovens/teaching/home-oven-tray-position.webp",
      alt: "Metal baking tray positioned on an upper rack inside a home oven.",
      caption: "Use the tray in the recommended position and keep the pizza realistic for the heat available.",
    },
    steps: [
      {
        label: "Preheat",
        action: "Preheat until the oven and tray setup are ready.",
        explanation: "The oven reaching its set temperature may be enough for a tray, but results still depend on real surface heat.",
      },
      {
        label: "Position",
        action: "Start in the upper half of the oven.",
        explanation: "A tray has less stored heat, so top heat and a realistic topping load matter.",
      },
      {
        label: "Launch",
        action: "Move the pizza onto the tray cleanly.",
        explanation: "Avoid overloading the pizza before it reaches the heat.",
      },
      {
        label: "Manage the bake",
        action: "Keep moisture low and rotate for hot spots.",
        explanation: "A weak surface struggles when sauce, cheese or toppings release too much water.",
      },
      {
        label: "Know when it is ready",
        action: "Accept a longer, less pizza-oven-like result.",
        explanation: `Use ${homeProfile.bakeTimeLabel} as the plan, then judge the base, rim and toppings.`,
      },
    ],
  },
  {
    title: "Pizza oven",
    icon: "flame" as DoughToolsIconName,
    summary: "A pizza oven bakes quickly, so launch position, turning and flame exposure matter throughout the bake.",
    tone: "dark",
    image: {
      src: "/ovens/teaching/pizza-oven-launch-position.webp",
      alt: "Pizza being launched from a peel onto a pizza oven floor away from the strongest flame.",
      caption: "Launch onto the hot oven floor with enough distance from the strongest flame.",
    },
    supplementalImage: {
      src: "/ovens/teaching/pizza-oven-turning.webp",
      alt: "Pizza being turned with a turning peel inside a pizza oven near a steady flame.",
      caption: "Turn the pizza before the flame-facing side colours too far.",
    },
    steps: [
      {
        label: "Preheat",
        action: `Preheat for the current ${pizzaProfile.preheatDurationMinutes} min pizza-plan window.`,
        explanation: "Judge the oven floor, not only the flame or air heat.",
      },
      {
        label: "Position",
        action: "Launch where floor heat and flame exposure are balanced.",
        explanation: "Too close to the strongest heat can scorch the rim before the base is ready.",
      },
      {
        label: "Launch",
        action: "Launch with a stable flame and clear floor spot.",
        explanation: "A stable launch gives the base time to set before turning starts.",
      },
      {
        label: "Manage the bake",
        action: "Turn frequently and move relative to the flame.",
        explanation: `${pizzaProfile.rotationGuidance} A short ${pizzaProfile.bakeTimeLabel} bake leaves little time to recover from hot spots.`,
      },
      {
        label: "Know when it is ready",
        action: "Remove when the base, rim and toppings are all baked.",
        explanation: "Let the floor recover before launching the next pizza.",
      },
    ],
  },
] as const;

const unevenBakeItems = [
  {
    title: "Base burns before the top is ready",
    action: "Reduce bottom heat or move the pizza away from the hottest surface area. Finish with more controlled top heat.",
  },
  {
    title: "Top browns before the base is ready",
    action: "Reduce top exposure and give the base more time on the baking surface.",
  },
  {
    title: "Base stays pale",
    action: "Preheat the baking surface longer and confirm that it has recovered before launching.",
  },
  {
    title: "Centre stays wet",
    action: "Reduce topping moisture and topping load before increasing bake time.",
  },
] as const;

const sessionEffects = [
  "Home oven and Pizza oven are the supported pizza-plan choices.",
  "The selected oven changes the preheat window and the baking copy used in Timeline and Kitchen.",
  "DoughTools keeps the preheat and Kitchen instructions aligned with the oven choice.",
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

function OvenTeachingFigure({
  image,
  dark = false,
  priority = false,
}: {
  image: OvenTeachingImage;
  dark?: boolean;
  priority?: boolean;
}) {
  return (
    <figure className={`overflow-hidden rounded-[1.35rem] border shadow-soft ${dark ? "border-white/10 bg-white/[.08]" : "border-ink/10 bg-white"}`}>
      <Image
        src={image.src}
        alt={image.alt}
        width={1200}
        height={1000}
        sizes="(max-width: 768px) 100vw, 42vw"
        className="aspect-[6/5] h-auto w-full object-cover"
        priority={priority}
      />
      <figcaption className={`border-t px-4 py-3 text-xs font-bold leading-5 ${dark ? "border-white/10 text-white/62" : "border-ink/10 text-ink/62"}`}>
        {image.caption}
      </figcaption>
    </figure>
  );
}

export default function OvensPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <LearningBreadcrumbs current="Baking guides" />
        <OvenGuideHero />
        <OvensQuickAnswer />

        <section id="oven-comparison" className="mt-8 scroll-mt-24" aria-labelledby="oven-comparison-title">
          <div className="rounded-[1.75rem] border border-leaf/20 bg-leaf/10 p-5 sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Practical setup paths</p>
            <h2 id="oven-comparison-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Choose your oven setup
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-ink/65 sm:text-base">
              Follow the setup that matches your oven and baking surface. Each setup needs a different balance of preheating, position and top heat.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {ovenSetupPaths.map((setup) => {
              const dark = setup.tone === "dark";
              const fullWidth = setup.title === "Pizza oven";

              return (
                <article
                  key={setup.title}
                  className={cardClass({
                    className: `p-5 sm:p-6 ${fullWidth ? "lg:col-span-2" : ""}`,
                    variant: setup.tone === "dark" ? "dark" : setup.tone === "information" ? "information" : "default",
                  })}
                  aria-labelledby={`${setup.title.toLowerCase().replaceAll(" ", "-")}-title`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${dark ? "bg-white/10 text-oven-gold" : "bg-tomato/10 text-tomato"}`} aria-hidden="true">
                      <DoughToolsIcon name={setup.icon} size={24} />
                    </span>
                    <div>
                      <h3 id={`${setup.title.toLowerCase().replaceAll(" ", "-")}-title`} className="font-display text-3xl font-semibold">
                        {setup.title}
                      </h3>
                      <p className={`mt-2 max-w-3xl text-sm leading-6 ${dark ? "text-white/70" : "text-ink/64"}`}>{setup.summary}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(16rem,.5fr)_minmax(0,1fr)] lg:items-start">
                    <OvenTeachingFigure image={setup.image} dark={dark} />

                    <ol className="grid gap-3 md:grid-cols-5 lg:grid-cols-5">
                      {setup.steps.map((step, index) => (
                        <li
                          key={`${setup.title}-${step.label}`}
                          className={`rounded-[1rem] border p-3 ${dark ? "border-white/10 bg-white/[.07]" : "border-ink/10 bg-white/70"}`}
                        >
                          <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${dark ? "bg-oven-gold text-ink" : "bg-tomato text-white"}`}>
                            {index + 1}
                          </span>
                          <h4 className={`mt-3 text-sm font-extrabold ${dark ? "text-white" : "text-ink"}`}>{step.label}</h4>
                          <p className={`mt-2 text-sm font-bold leading-5 ${dark ? "text-white/82" : "text-ink/74"}`}>{step.action}</p>
                          <p className={`mt-2 text-xs leading-5 ${dark ? "text-white/60" : "text-ink/58"}`}>{step.explanation}</p>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {"supplementalImage" in setup && (
                    <div className="mt-5 max-w-2xl">
                      <OvenTeachingFigure image={setup.supplementalImage} dark={dark} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <OvenTeachingFigure image={surfaceReadinessImage} />
            <OvenTeachingFigure image={bottomDonenessImage} />
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.34fr)]" aria-labelledby="uneven-bake-title">
          <article className={cardClass({ className: "p-5 sm:p-6", variant: "default" })}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Troubleshooting</p>
                <h2 id="uneven-bake-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Fix an uneven bake</h2>
              </div>
              <Link href="/guide/pizza-troubleshooting" className={buttonClass({ className: "w-full shrink-0 sm:w-auto", variant: "secondary" })}>
                Open troubleshooting
              </Link>
            </div>
            <div className="mt-5">
              <OvenTeachingFigure image={heatBalanceImage} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {unevenBakeItems.map((item) => (
                <section key={item.title} className="rounded-[1rem] border border-ink/10 bg-flour/70 p-4" aria-label={item.title}>
                  <h3 className="text-sm font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/64">{item.action}</p>
                </section>
              ))}
            </div>
          </article>

          <aside className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.08] p-5" aria-labelledby="multiple-pizzas-title">
            <DoughToolsIcon name="timer" size={24} className="text-leaf" />
            <h2 id="multiple-pizzas-title" className="mt-3 font-display text-3xl font-semibold">Bake more than one pizza</h2>
            <p className="mt-3 text-sm leading-7 text-ink/64">
              Let the baking surface recover between pizzas. A second pizza launched too soon may bake more slowly and remain pale underneath.
            </p>
            <div className="mt-4">
              <OvenTeachingFigure image={recoveryImage} />
            </div>
          </aside>
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
