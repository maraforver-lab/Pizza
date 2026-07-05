import Link from "next/link";
import AppSignature from "@/components/AppSignature";
import { projectContactEmail, type TrustPage } from "@/lib/trust-pages";

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

export default function TrustPageLayout({ page }: { page: TrustPage }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur sm:p-8">
          <Link href="/" className="inline-flex rounded-full bg-ink px-4 py-2 text-xs font-extrabold text-white">
            Back to DoughTools
          </Link>
          <p className="mt-8 text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{page.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-ink/60 sm:text-base">{page.intro}</p>
        </section>

        <section className="mt-6 grid gap-4">
          {page.sections.map((section) => (
            <article key={section.heading} className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-sm sm:p-7">
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
