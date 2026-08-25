import Link from "next/link";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { buttonClass, cardClass, cx } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/tools/pizza-party-planner");

const createPartyHref = "/account/party-orders/new";

const contrasts = [
  { label: "Instead of", text: "\"Who wanted Margherita again?\"" },
  { label: "Instead of", text: "Scrolling through 47 messages" },
  { label: "Instead of", text: "Building a pizza spreadsheet" },
] as const;

const eventLabels = ["Friends", "Families", "Birthday parties", "Team nights", "Big pizza evenings"] as const;

const steps = [
  {
    title: "Create your pizza party",
    body: "Set the date, pizza time and ordering deadline, then choose the pizzas you want to offer.",
    icon: "calendar",
  },
  {
    title: "Send one invitation",
    body: "Share the guest link, QR code, invitation image or PDF - however you want to invite your group.",
    icon: "share",
  },
  {
    title: "Guests choose their pizzas",
    body: "Everyone opens the link and sends their own pizza choice. They don't need a DoughTools account.",
    icon: "pizza",
  },
  {
    title: "See the totals and start cooking",
    body: "DoughTools collects the choices into one organizer view. When everyone has ordered, turn the final totals into your pizza plan and start preparing the dough.",
    icon: "checklist",
  },
] satisfies readonly { body: string; icon: DoughToolsIconName; title: string }[];

const benefits = [
  { title: "One invitation", body: "Everything starts from one party link.", icon: "share" },
  { title: "No account for guests", body: "They simply open the invitation and order.", icon: "account" },
  { title: "All choices together", body: "No searching through messages.", icon: "checklist" },
  { title: "Clear final totals", body: "Know which pizzas your group actually chose.", icon: "success" },
  { title: "Continue into Pizza Plan", body: "Turn the finished order into the existing DoughTools preparation workflow.", icon: "forward" },
] satisfies readonly { body: string; icon: DoughToolsIconName; title: string }[];

const relatedLinks = [
  { label: "Pizza Dough Calculator", href: "/calculator/quick", text: "Calculate flour, water, salt and yeast for your dough." },
  { label: "Build a complete pizza plan", href: "/session/start", text: "Turn pizza choices into a guided preparation flow." },
  { label: "Choose your oven setup", href: "/ovens", text: "Plan the bake around the oven you actually have." },
] as const;

function DemoQr() {
  const cells = [
    1, 1, 1, 0, 1, 0, 1,
    1, 0, 1, 1, 0, 0, 1,
    1, 1, 1, 0, 1, 1, 1,
    0, 1, 0, 1, 0, 1, 0,
    1, 0, 1, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0,
    1, 1, 0, 1, 0, 1, 1,
  ];

  return (
    <div className="grid aspect-square w-24 grid-cols-7 gap-1 rounded-[1rem] bg-white p-3 shadow-sm sm:w-28" aria-hidden="true">
      {cells.map((filled, index) => (
        <span key={index} className={cx("rounded-[0.18rem]", filled ? "bg-ink" : "bg-cream")} />
      ))}
    </div>
  );
}

function DemoInvitationCard() {
  return (
    <aside
      className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-ink text-white shadow-overlay sm:rounded-[2.5rem]"
      aria-label="Example DoughTools pizza party invitation"
    >
      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(32,37,31,.32) 0%, rgba(32,37,31,.9) 100%), url('/images/homepage/doughtools-hero-desktop.webp')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        aria-hidden="true"
      />
      <div className="relative grid gap-5 p-5 sm:p-6">
        <div className="rounded-[1.75rem] border border-white/15 bg-ink/72 p-5 backdrop-blur">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/72">DoughTools · Pizza Party</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-none sm:text-5xl">Saturday Pizza</h2>
          <p className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-bold leading-6 text-white/82">
            Best pizza night
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <p className="rounded-2xl border border-white/15 bg-white/12 p-4 text-sm font-bold leading-6 text-white/82 backdrop-blur">
            Pizza time:<br />
            <span className="text-base text-white">Saturday · 20:00</span>
          </p>
          <p className="rounded-2xl border border-white/15 bg-white/12 p-4 text-sm font-bold leading-6 text-white/82 backdrop-blur">
            Order by:<br />
            <span className="text-base text-white">Friday · 14:00</span>
          </p>
        </div>

        <div className="grid gap-4 rounded-[1.75rem] border border-white/65 bg-warm-background p-4 text-ink sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-basil">Scan to choose your pizza</p>
            <p className="mt-2 text-xl font-black leading-tight text-ink">
              Open the menu, pick your pizzas, and send your order.
            </p>
            <p className="mt-3 truncate text-sm font-extrabold text-ink/70">doughtools.app/order/example</p>
          </div>
          <DemoQr />
        </div>
      </div>
    </aside>
  );
}

function SectionHeading({
  eyebrow,
  id,
  title,
  body,
}: {
  body?: string;
  eyebrow?: string;
  id: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.24em] text-tomato">{eyebrow}</p>}
      <h2 id={id} className="mt-3 font-display text-4xl font-semibold leading-none text-ink sm:text-5xl">{title}</h2>
      {body && <p className="mt-4 text-base leading-7 text-ink/68">{body}</p>}
    </div>
  );
}

export default function PizzaPartyPlannerPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_14%_0%,rgba(233,75,46,0.10),transparent_32rem),linear-gradient(180deg,#fff8f1_0%,#f1e6d8_46%,#fff8f1_100%)] text-ink">
      <section className="px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8" aria-labelledby="pizza-party-planner-heading">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] bg-forest-dark p-5 text-white shadow-overlay sm:rounded-[2.75rem] sm:p-7 lg:min-h-[34rem] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:p-8 xl:p-10">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.3em] text-oven-gold">PIZZA NIGHT, MADE EASY</p>
            <h1 id="pizza-party-planner-heading" className="mt-4 font-display text-[clamp(3rem,13vw,5.5rem)] font-semibold leading-[.88] text-white sm:max-w-[10ch] sm:text-7xl lg:text-[clamp(4.5rem,5.4vw,6rem)]">
              Pizza Party Planner
            </h1>
            <p className="mt-5 max-w-xl font-display text-3xl font-semibold leading-none text-white sm:text-4xl">
              Four friends or forty guests. One simple pizza plan.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/82 sm:text-lg sm:leading-8">
              Create the party, share one invitation and let everyone choose their own pizza. You see every choice and the final totals in one place - without chasing WhatsApp messages or building a spreadsheet.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={createPartyHref} className={buttonClass({ className: "min-h-12 rounded-2xl px-6 text-base", tone: "tomato" })}>
                Start my pizza party
              </Link>
            </div>
            <p className="mt-3 max-w-lg text-sm font-bold leading-6 text-white/68">
              Sign in to create and save your party. Your guests won&apos;t need an account.
            </p>
          </div>
          <DemoInvitationCard />
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="party-chaos-heading">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="party-chaos-heading"
            title="No WhatsApp chaos. No spreadsheets. Just pizza."
            body="Planning the pizzas shouldn't be harder than making them. Instead of asking everyone what they want across group chats, notes and spreadsheets, send one DoughTools invitation and let your guests choose for themselves."
          />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {contrasts.map((item) => (
              <article key={item.text} className={cardClass({ className: "p-5 shadow-sm" })}>
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{item.label}</p>
                <p className="mt-3 text-lg font-extrabold leading-6 text-ink">{item.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 rounded-[1.5rem] bg-forest-dark px-5 py-4 text-xl font-extrabold leading-7 text-white shadow-card">
            One link. Everyone chooses. You get the totals.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="party-size-heading">
        <div className="mx-auto grid max-w-7xl gap-5 rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[0.75fr_1fr] lg:items-center">
          <SectionHeading
            id="party-size-heading"
            title="Dinner for 4. Pizza night for 40."
            body="The workflow stays simple whether you're inviting a few friends or organizing a bigger pizza night. Create the menu once, share one invitation and keep every guest choice together."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {eventLabels.map((label) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-cream/70 px-4 py-3 text-sm font-extrabold text-ink/72">
                <DoughToolsIcon name="party" size={20} className="shrink-0 text-tomato" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="party-workflow-heading">
        <div className="mx-auto max-w-7xl">
          <SectionHeading id="party-workflow-heading" title="From invitation to pizza plan" />
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className={cardClass({ className: "p-5 shadow-sm" })}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tomato text-sm font-extrabold text-white">{index + 1}</span>
                  <DoughToolsIcon name={step.icon} size={24} className="text-leaf" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold leading-none text-ink">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/62">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="party-invitation-heading">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] bg-forest-dark p-5 text-white shadow-card sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Invitation preview</p>
            <h2 id="party-invitation-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              An invitation people actually want to open
            </h2>
            <p className="mt-4 text-base leading-7 text-white/76">
              Your pizza party gets its own shareable invitation with the important details, guest ordering link and QR code. Send the link directly or share the invitation as an image or PDF.
            </p>
          </div>
          <DemoInvitationCard />
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="organizer-guest-heading">
        <div className="mx-auto max-w-7xl">
          <SectionHeading id="organizer-guest-heading" title="One party. Two simple jobs." />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <article className={cardClass({ className: "p-5 sm:p-6" })}>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Organizer</p>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-none">You stay in control</h3>
              <p className="mt-4 text-base leading-7 text-ink/66">
                Create the menu, share the invitation, follow the orders and see exactly how many of each pizza your group chose.
              </p>
            </article>
            <article className={cardClass({ className: "p-5 sm:p-6" })}>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Guests</p>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-none">They just choose pizza</h3>
              <p className="mt-4 text-base leading-7 text-ink/66">
                Guests open the link, pick their pizza and send the order. No account, no app setup and no messages back and forth.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="party-benefits-heading">
        <div className="mx-auto max-w-7xl">
          <SectionHeading id="party-benefits-heading" title="More pizza. Less organizing." />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {benefits.map((benefit) => (
              <article key={benefit.title} className={cardClass({ className: "p-4 shadow-sm" })}>
                <DoughToolsIcon name={benefit.icon} size={24} className="text-tomato" aria-hidden="true" />
                <h3 className="mt-4 text-base font-extrabold leading-tight text-ink">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">{benefit.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="party-final-cta-heading">
        <div className="mx-auto grid max-w-7xl gap-5 rounded-[2rem] bg-forest-dark p-5 text-white shadow-overlay sm:rounded-[2.5rem] sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Ready</p>
            <h2 id="party-final-cta-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Ready to make pizza night easier?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/74">
              Create your party, invite your guests and let DoughTools keep the orders organized while you focus on the pizza.
            </p>
            <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-white/66">
              Sign in to create and save your party. Guests can order without signing in.
            </p>
          </div>
          <Link href={createPartyHref} className={buttonClass({ className: "min-h-12 rounded-2xl px-6 text-base", tone: "tomato" })}>
            Start my pizza party
          </Link>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-labelledby="party-related-heading">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="party-related-heading"
            title="Once the orders are in, plan the pizza"
            body="Know what you're making? Use DoughTools to calculate the dough and build the preparation and baking plan."
          />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[1.5rem] border border-ink/10 bg-white/82 p-5 shadow-sm transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <span className="text-base font-extrabold text-ink">{link.label}</span>
                <span className="mt-2 block text-sm leading-6 text-ink/60">{link.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
