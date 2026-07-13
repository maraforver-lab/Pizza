import Link from "next/link";
import type { DoughToolsIconName } from "@/components/icons";

export type PublicPageEndingLink = {
  description: string;
  href: string;
  icon?: DoughToolsIconName;
  title: string;
};

type PublicPageEndingProps = {
  action?: PublicPageEndingLink;
  actionEyebrow?: string;
  actionTitle?: string;
  className?: string;
  links: readonly PublicPageEndingLink[];
  relatedEyebrow?: string;
  relatedTitle: string;
};

function validatePageEndingLinks(links: readonly PublicPageEndingLink[], action?: PublicPageEndingLink) {
  if (links.length > 3) {
    throw new Error("Public page endings support at most three related-learning links.");
  }

  const destinations = [...links.map((link) => link.href), action?.href].filter(Boolean);
  if (new Set(destinations).size !== destinations.length) {
    throw new Error("Public page endings cannot repeat the same destination.");
  }
}

export default function PublicPageEnding({
  action,
  actionEyebrow = "Ready for the next step?",
  actionTitle,
  className = "mt-16",
  links,
  relatedEyebrow = "Related learning",
  relatedTitle,
}: PublicPageEndingProps) {
  validatePageEndingLinks(links, action);

  if (links.length === 0 && !action) return null;

  return (
    <div className={className}>
      {links.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-3" aria-labelledby="public-page-related-learning-title">
          <div className="lg:col-span-3">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{relatedEyebrow}</p>
            <h2 id="public-page-related-learning-title" className="mt-3 font-display text-4xl font-semibold">
              {relatedTitle}
            </h2>
          </div>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[1.5rem] border border-ink/10 bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tomato"
            >
              <h3 className="text-base font-extrabold">{link.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{link.description}</p>
            </Link>
          ))}
        </section>
      ) : null}

      {action ? (
        <section className="mt-16 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">{actionEyebrow}</p>
            {actionTitle ? <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{actionTitle}</h2> : null}
          </div>
          <Link
            href={action.href}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-extrabold text-tomato shadow-soft transition hover:-translate-y-0.5 hover:bg-flour focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:mt-0"
          >
            {action.title}
          </Link>
        </section>
      ) : null}
    </div>
  );
}

