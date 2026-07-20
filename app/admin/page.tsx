import Link from "next/link";
import { DoughToolsIcon } from "@/components/icons";

const upcomingCapabilities = [
  {
    title: "Seasonal appearance",
    description: "Patch 445 will add prebuilt theme campaigns such as Default, Halloween and Christmas.",
  },
  {
    title: "Bake Timer sounds",
    description: "Patch 446 will add prebuilt sound-theme availability controls.",
  },
  {
    title: "Public statistics",
    description: "Patch 447 will add privacy-safe aggregate registered-user counts.",
  },
] as const;

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-24 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/70 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <DoughToolsIcon name="back" size={20} />
          Back to account
        </Link>

        <section className="mt-6 rounded-[2rem] border border-ink/10 bg-white/80 p-5 shadow-card sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Admin</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[.98] text-ink sm:text-5xl">
            Product administration
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-ink/60 sm:text-base sm:leading-7">
            This protected workspace is ready for public product configuration. It does not expose private Pizza Sessions, Party Orders, photos, notes, emails or account preferences.
          </p>
          <p className="mt-4 rounded-2xl border border-leaf/20 bg-leaf/[.08] px-4 py-3 text-sm font-bold leading-6 text-ink/65">
            Authorized admin access confirmed.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Upcoming admin capabilities">
          {upcomingCapabilities.map((capability) => (
            <article key={capability.title} className="rounded-[1.5rem] border border-ink/10 bg-white/78 p-4 shadow-sm">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[.2em] text-ink/42">Not enabled yet</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{capability.title}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-ink/58">{capability.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
