"use client";

import Link from "next/link";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";

export type LearningLink = {
  href: string;
  title: string;
  description: string;
  icon?: DoughToolsIconName;
};

type LearningBreadcrumbsProps = {
  current: string;
  parentHref?: string;
  parentLabel?: string;
};

type RelatedLearningProps = {
  eyebrow?: string;
  title?: string;
  intro?: string;
  links: readonly LearningLink[];
  cta?: LearningLink;
};

export function LearningBreadcrumbs({
  current,
  parentHref = "/guide",
  parentLabel = "Pizza guides",
}: LearningBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs font-extrabold text-ink/45">
      <Link
        href={parentHref}
        className="rounded-sm text-tomato underline-offset-2 transition hover:text-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
      >
        {parentLabel}
      </Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page" className="text-ink/55">{current}</span>
    </nav>
  );
}

export default function RelatedLearning({
  eyebrow = "Pizza guides",
  title = "Practical pizza tips",
  intro = "Move naturally to the next useful pizza topic.",
  links,
  cta,
}: RelatedLearningProps) {
  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white/72 p-5 shadow-card sm:p-7" aria-labelledby="related-learning-title">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{eyebrow}</p>
      <h2 id="related-learning-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">{intro}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.title}`}
            href={link.href}
            className="group rounded-[1.35rem] border border-ink/10 bg-white p-4 transition hover:-translate-y-0.5 hover:border-tomato/30 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <span className="flex items-center gap-3">
              {link.icon && (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                  <DoughToolsIcon name={link.icon} size={24} />
                </span>
              )}
              <span className="font-extrabold text-ink transition group-hover:text-tomato">{link.title}</span>
            </span>
            <span className="mt-2 block text-sm leading-6 text-ink/55">{link.description}</span>
            <span className="mt-4 inline-flex text-sm font-extrabold text-tomato transition group-hover:text-ink">
              Explore guide
            </span>
          </Link>
        ))}
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
        >
          {cta.title}
        </Link>
      )}
    </section>
  );
}
