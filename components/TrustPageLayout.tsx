import AppSignature from "@/components/AppSignature";
import { UtilityHeader } from "@/components/page-hero/PageHeroSystem";
import { projectContactEmail, type TrustPage, type TrustPageSection } from "@/lib/trust-pages";

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

export default function TrustPageLayout({ page }: { page: TrustPage }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <UtilityHeader
          actions={[{ href: "/", label: "Back to DoughTools", variant: "secondary" }]}
          body={page.intro}
          eyebrow={page.eyebrow}
          icon="information"
          title={page.title}
        />

        <section className="mt-6 grid gap-4">
          {page.sections.map((section) => (
            <article
              key={section.heading}
              id={section.id}
              className="scroll-mt-24 rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-sm sm:p-7"
            >
              <h2 className="font-display text-2xl font-semibold">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className={`mt-3 break-words text-sm leading-7 ${
                    paragraph.startsWith("[") ? "rounded-2xl bg-tomato/[.07] px-4 py-3 font-bold text-tomato" : "text-ink/60"
                  }`}
                >
                  <LinkedParagraph text={paragraph} />
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 grid gap-2">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-ink/60">
                      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf text-[10px] font-extrabold text-white">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              <SourceList section={section} />
            </article>
          ))}
        </section>

        <footer className="mt-8 border-t border-ink/10 py-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
