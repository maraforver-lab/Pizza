import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { DoughToolsIcon } from "@/components/icons";
import { productUpdates, updatesHeroImage } from "@/lib/product-updates";

const hasPublishedUpdates = productUpdates.length > 0;

export default function UpdatesPage() {
  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="overflow-hidden rounded-hero border border-white/80 bg-white/75 shadow-card">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,.85fr)] lg:items-stretch">
            <div className="p-5 sm:p-8 lg:p-10">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">DoughTools updates</p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
                Product updates, when they are ready to share.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">
                This is the future home for clear DoughTools release notes: what changed, why it matters for pizza
                making, and whether anything affects your workflow.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/session/start"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-forest active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  Plan my next pizza
                </Link>
                <Link
                  href="/about"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-extrabold text-ink/70 transition hover:border-tomato/30 hover:text-ink active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  Why DoughTools exists
                </Link>
              </div>
            </div>
            <figure className="relative min-h-64 overflow-hidden bg-ink/5 sm:min-h-80 lg:min-h-full">
              <Image
                src={updatesHeroImage.src}
                alt={updatesHeroImage.alt}
                width={updatesHeroImage.width}
                height={updatesHeroImage.height}
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
                className="h-full w-full object-cover"
              />
            </figure>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-start">
          <article className="rounded-panel border border-ink/10 bg-forest p-6 text-white shadow-card sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-oven-gold ring-1 ring-white/15" aria-hidden="true">
              <DoughToolsIcon name="information" size={24} />
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              No public updates are published yet.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/68">
              The page is intentionally quiet until there is a real product update worth documenting. No old patch
              history, build notes, or developer changelog entries are shown here.
            </p>
          </article>

          <div className="grid gap-4">
            <article className="rounded-panel border border-white/80 bg-white/75 p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-2xl font-semibold">What will appear here later</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink/62">
                {[
                  "Plain-language release notes for meaningful product changes.",
                  "A short explanation of why each change matters to home pizza makers.",
                  "Clear notes when a change affects workflow, privacy, storage, or calculations.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-basil text-[10px] font-extrabold text-white" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-panel border border-tomato/15 bg-tomato/[.06] p-5 sm:p-6">
              <h2 className="font-display text-2xl font-semibold">What this page is not</h2>
              <p className="mt-3 text-sm leading-6 text-ink/62">
                It is not a raw commit log, a version dashboard, or a promise about future features. Updates will be
                published only when they are useful to people using DoughTools.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-8 rounded-panel border border-white/80 bg-white/70 p-5 shadow-card sm:p-7" aria-labelledby="updates-interface-heading">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Release center status</p>
              <h2 id="updates-interface-heading" className="mt-2 font-display text-3xl font-semibold">
                Ready for future notes.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
                The route stays public and discoverable, but the content list is empty until a real release note is
                approved.
              </p>
            </div>
            <div className="rounded-2xl bg-cream px-4 py-3 text-sm font-extrabold text-ink/65">
              {hasPublishedUpdates ? `${productUpdates.length} published` : "0 published updates"}
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
