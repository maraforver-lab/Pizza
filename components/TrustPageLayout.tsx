import SiteFooter from "@/components/SiteFooter";
import { DoughToolsIcon } from "@/components/icons";
import { projectContactEmail, type TrustPage, type TrustPageSection } from "@/lib/trust-pages";
import Image from "next/image";
import Link from "next/link";

const sourceCategoryLabel = {
  "doughtools-adaptation": "DoughTools adaptation",
  "expert-guidance": "Expert practical guidance",
  "food-safety": "Food-safety guidance",
  standard: "Traditional standard",
} as const;

function LinkedParagraph({ text }: { text: string }) {
  const parts = text.split(projectContactEmail);

  if (parts.length === 1) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 && (
            <a className="font-bold text-tomato underline underline-offset-2 break-all" href={`mailto:${projectContactEmail}`}>
              {projectContactEmail}
            </a>
          )}
        </span>
      ))}
    </>
  );
}

function SourceList({ section }: { section: TrustPageSection }) {
  if (!section.sources?.length) return null;

  return (
    <ul className="mt-5 grid gap-3" aria-label={`${section.heading} public sources`}>
      {section.sources.map((source) => (
        <li key={source.id} className="rounded-2xl border border-ink/10 bg-white/75 p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-tomato">
            {sourceCategoryLabel[source.category]}
          </p>
          <h3 className="mt-2 text-sm font-extrabold text-ink">{source.title}</h3>
          <p className="mt-1 text-xs font-bold text-ink/45">{source.organization}</p>
          <p className="mt-2 text-sm leading-6 text-ink/60">{source.note}</p>
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-10 items-center rounded-xl text-sm font-extrabold text-tomato underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              Open public source ↗
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function TableOfContents({ page }: { page: TrustPage }) {
  const links = page.sections
    .filter((section) => section.id)
    .map((section) => ({ href: `#${section.id}`, label: section.heading }));

  if (!links.length) return null;

  return (
    <>
      <details className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white/75 p-4 shadow-sm lg:hidden">
        <summary className="cursor-pointer text-sm font-extrabold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
          On this page
        </summary>
        <nav className="mt-3 grid gap-2" aria-label={`${page.navLabel} page sections`}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 text-sm font-bold text-ink/60 transition hover:bg-cream hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </details>

      <aside className="hidden lg:block">
        <nav
          className="sticky top-24 rounded-[1.5rem] border border-white/80 bg-white/70 p-4 shadow-card backdrop-blur"
          aria-label={`${page.navLabel} page sections`}
        >
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">On this page</p>
          <ol className="mt-3 grid gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-xl px-3 py-2 text-sm font-bold leading-5 text-ink/58 transition hover:bg-cream hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    </>
  );
}

function SummaryCards({ page }: { page: TrustPage }) {
  if (!page.summary?.length) return null;

  return (
    <section id={`${page.id}-summary`} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={`${page.navLabel} at a glance`}>
      {page.summary.map((item) => (
        <a
          key={item.title}
          href={item.href}
          className="group rounded-[1.5rem] border border-white/80 bg-white/75 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-tomato/25 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-tomato/10 text-tomato" aria-hidden="true">
            <DoughToolsIcon name="information" size={20} />
          </span>
          <h2 className="mt-3 text-base font-extrabold leading-tight text-ink">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/58">{item.body}</p>
          <span className="mt-3 inline-flex text-xs font-extrabold uppercase tracking-[.14em] text-tomato group-hover:underline">
            Read section
          </span>
        </a>
      ))}
    </section>
  );
}

function TrustHero({ page }: { page: TrustPage }) {
  const image = page.heroImage;

  return (
    <section className="overflow-hidden rounded-hero border border-white/80 bg-white/75 shadow-card">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch">
        <div className="p-5 sm:p-8 lg:p-10">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-tomato/15 bg-tomato/[.06] px-4 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">
            <DoughToolsIcon name={page.id === "terms" ? "checklist" : "information"} size={16} />
            {page.eyebrow}
          </span>
          <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink/62 sm:text-base">
            <LinkedParagraph text={page.intro} />
          </p>
          {(page.lastUpdated || page.effectiveFrom) && (
            <dl className="mt-6 grid gap-3 rounded-[1.5rem] border border-ink/10 bg-cream/55 p-4 text-sm sm:grid-cols-2">
              {page.effectiveFrom && (
                <div>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[.16em] text-ink/40">Effective from</dt>
                  <dd className="mt-1 font-extrabold text-ink">{page.effectiveFrom}</dd>
                </div>
              )}
              {page.lastUpdated && (
                <div>
                  <dt className="text-[11px] font-extrabold uppercase tracking-[.16em] text-ink/40">Last updated</dt>
                  <dd className="mt-1 font-extrabold text-ink">{page.lastUpdated}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {image && (
          <picture className="relative block min-h-72 overflow-hidden bg-cream lg:min-h-full">
            {image.mobileSrc && <source media="(max-width: 767px)" srcSet={image.mobileSrc} />}
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              priority
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 100vw, 48vw"
              className="h-full min-h-72 w-full object-cover lg:min-h-full"
            />
          </picture>
        )}
      </div>
    </section>
  );
}

export default function TrustPageLayout({ page }: { page: TrustPage }) {
  return (
    <main className="min-h-screen px-4 py-8 text-ink sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <TrustHero page={page} />
        <SummaryCards page={page} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
          <TableOfContents page={page} />
          <section className="grid min-w-0 gap-4">
            {page.sections.map((section) => (
              <article
                key={section.heading}
                id={section.id}
                className="scroll-mt-24 rounded-[1.5rem] border border-white/80 bg-white/72 p-5 shadow-sm sm:p-7"
              >
                <h2 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className={`mt-3 break-words text-sm leading-7 sm:text-[15px] ${
                      paragraph.startsWith("[") ? "rounded-2xl bg-tomato/[.07] px-4 py-3 font-bold text-tomato" : "text-ink/62"
                    }`}
                  >
                    <LinkedParagraph text={paragraph} />
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 grid gap-2">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-ink/62 sm:text-[15px]">
                        <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf text-[10px] font-extrabold text-white">✓</span>
                        <span className="min-w-0 break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <SourceList section={section} />
              </article>
            ))}
            <Link
              href="/"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
            >
              Back to DoughTools
            </Link>
          </section>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
