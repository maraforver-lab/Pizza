import Link from "next/link";
import type { ReactNode } from "react";
import { SessionLocalOnlyNote } from "@/components/session/SessionLocalOnlyNote";

type SessionEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  body: ReactNode;
  eyebrow?: string;
  localNote?: ReactNode;
  title: ReactNode;
};

export function SessionEmptyState({
  actionHref = "/session/start",
  actionLabel = "Start Pizza Session →",
  body,
  eyebrow = "Pizza Session",
  localNote,
  title,
}: SessionEmptyStateProps) {
  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
      <section className="mx-auto max-w-3xl rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-card sm:rounded-[2rem] sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-ink/60">{body}</p>
        {localNote && <SessionLocalOnlyNote>{localNote}</SessionLocalOnlyNote>}
        <Link
          href={actionHref}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          {actionLabel}
        </Link>
      </section>
    </main>
  );
}
