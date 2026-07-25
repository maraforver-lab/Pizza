import Link from "next/link";
import { DoughToolsIcon } from "@/components/icons";
import { homepageVersionRegistry } from "@/lib/homepage-versions";

const upcomingCapabilities = [
  {
    title: "Seasonal appearance",
    description: "Manage seven prebuilt public theme foundations and seasonal schedules.",
    href: "/admin/appearance",
  },
  {
    title: "Bake Timer sounds",
    description: "Manage which prebuilt Bake Timer sound themes are available and which one is the product default.",
    href: "/admin/bake-timer-sounds",
  },
  {
    title: "Public statistics",
    description: "Patch 447 will add privacy-safe aggregate registered-user counts.",
    href: null,
  },
] as const;

function homepageVersionStatusLabel(status: string) {
  return status === "live" ? "LIVE" : status.toUpperCase();
}

export default function AdminPage() {
  const liveHomepageVersions = homepageVersionRegistry.filter((version) => version.status === "live");

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
            This protected workspace is ready for public product configuration. It does not expose private pizza plans, Party Orders, photos, notes, emails or account preferences.
          </p>
          <p className="mt-4 rounded-2xl border border-leaf/20 bg-leaf/[.08] px-4 py-3 text-sm font-bold leading-6 text-ink/65">
            Authorized admin access confirmed.
          </p>
        </section>

        <section
          className="mt-6 rounded-[2rem] border border-ink/10 bg-white/80 p-5 shadow-card sm:p-7"
          aria-labelledby="admin-homepage-versions-heading"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Homepage</p>
              <h2 id="admin-homepage-versions-heading" className="mt-2 font-display text-3xl font-semibold leading-none text-ink">
                Homepage versions
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-ink/60">
                Preview and manage Homepage presentation versions without changing Pizza Plan or calculation logic.
              </p>
            </div>
            <p className="inline-flex min-h-10 items-center justify-center rounded-full border border-leaf/20 bg-leaf/[.08] px-4 text-sm font-extrabold text-leaf">
              {homepageVersionRegistry.length} version
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {homepageVersionRegistry.map((version) => (
              <article key={version.id} className="rounded-[1.5rem] border border-ink/10 bg-cream/70 p-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-[.2em] text-leaf">
                      {homepageVersionStatusLabel(version.status)}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-ink">{version.name}</h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-ink/58">{version.description}</p>
                  </div>
                  {version.previewAvailable ? (
                    <Link
                      href={`/admin/homepage-preview/${version.id}`}
                      aria-label={`Preview ${version.name} Homepage version`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
                    >
                      Preview
                      <DoughToolsIcon name="forward" size={20} />
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-4 text-xs font-bold leading-5 text-ink/45">
            {liveHomepageVersions.length === 1 ? "One live Homepage version is registered." : "Homepage version registry needs one live version."}
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Upcoming admin capabilities">
          {upcomingCapabilities.map((capability) => (
            <article key={capability.title} className="rounded-[1.5rem] border border-ink/10 bg-white/78 p-4 shadow-sm">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[.2em] text-ink/42">
                {capability.href ? "Available" : "Not enabled yet"}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{capability.title}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-ink/58">{capability.description}</p>
              {capability.href ? (
                <Link
                  href={capability.href}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  {capability.title === "Bake Timer sounds" ? "Open sound settings" : "Open appearance"}
                  <DoughToolsIcon name="forward" size={20} />
                </Link>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
