"use client";

import Link from "next/link";
import { useEffect } from "react";
import AppSignature from "@/components/AppSignature";
import {
  latestPublicUpdate,
  MAX_VISIBLE_UPDATES,
  visiblePatchHistory,
  visiblePublicUpdates,
} from "@/lib/changelog";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${value}T12:00:00Z`));

export default function UpdatesPage() {
  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  const latest = latestPublicUpdate ?? visiblePublicUpdates[0];

  return (
    <main className="min-h-screen px-4 py-8 pb-28 text-ink sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="py-8 sm:py-14">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">DoughTools updates</p>
          <h1 className="mt-3 max-w-4xl font-display text-5xl font-semibold leading-[.92] sm:text-7xl">
            What changed in DoughTools.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-ink/55 sm:text-base">
            A readable changelog for the pizza-making workspace: product improvements, safer calculations,
            launch-readiness work and local saved bakes.
          </p>
        </section>

        {latest && (
          <section className="grid overflow-hidden rounded-[2rem] bg-ink text-white shadow-2xl md:grid-cols-[1fr_auto]">
            <div className="p-6 sm:p-9">
              <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#e8c98a]">
                Latest update · {latest.category} · {formatDate(latest.date)}
              </span>
              <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold sm:text-5xl">{latest.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">{latest.summary}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{latest.userImpact}</p>
              <ul className="mt-5 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                {latest.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8c98a]" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              {latest.technicalNote && (
                <p className="mt-5 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-white/55">
                  {latest.technicalNote}
                </p>
              )}
            </div>
            <Link
              href="/"
              className="m-5 grid min-h-14 place-items-center rounded-2xl bg-tomato px-6 text-center text-sm font-extrabold md:min-w-52"
            >
              Open calculator →
            </Link>
          </section>
        )}

        <section className="mt-8 rounded-[1.5rem] border border-leaf/15 bg-leaf/[.07] p-5 text-sm leading-6 text-ink/65">
          DoughTools is live for testing and still protected by noindex while launch checks continue.
          This update does not enable search indexing, public bake pages, photo upload, share cards or cloud sync.
        </section>

        <section className="mt-12">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Release history</p>
            <h2 className="mt-2 font-display text-4xl font-semibold">What changed</h2>
            <p className="mt-3 text-sm leading-6 text-ink/55">
              Showing the newest {MAX_VISIBLE_UPDATES} update cards at most. Older update data can stay in the changelog
              without making this page harder to scan.
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {visiblePatchHistory.map((entry) => (
              <article key={entry.patch} className="rounded-2xl border border-white bg-white/75 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <strong className="font-mono text-sm text-tomato">Patch {String(entry.patch).padStart(2, "0")}</strong>
                  <span className="rounded-full bg-ink/[.06] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/45">
                    {entry.category}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold leading-tight">{entry.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/55">{entry.summary}</p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/60">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-6 text-ink/65">{entry.userImpact}</p>
                {entry.technicalNote && (
                  <p className="mt-4 rounded-2xl bg-ink/[.04] p-3 text-xs leading-5 text-ink/50">
                    {entry.technicalNote}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-[#5d3025] p-7 text-white sm:p-10">
            <span className="text-3xl">🍕</span>
            <h2 className="mt-5 font-display text-4xl font-semibold">Why DoughTools exists</h2>
            <p className="mt-5 text-sm leading-7 text-white/65">
              DoughTools grew from a desire to make home pizza easier to understand. Great pizza is not just one
              recipe: flour, water, time, temperature, the oven and the baker’s goals all shape the result.
              The site brings calculation, planning, learning and personal experience together in one place.
            </p>
          </article>
          <article className="rounded-[2rem] border border-white/80 bg-white/65 p-7 sm:p-10">
            <span className="text-3xl">✍</span>
            <h2 className="mt-5 font-display text-4xl font-semibold">About the creator</h2>
            <p className="mt-5 text-sm leading-7 text-ink/55">
              DoughTools is maintained by Marcin Arcisz. The project focuses on practical tools,
              transparent calculations and better planning for home pizza makers.
            </p>
          </article>
        </section>

        <div className="mt-8 flex justify-center">
          <Link href="/" className="rounded-full bg-tomato px-6 py-3 text-sm font-extrabold text-white">
            Open calculator →
          </Link>
        </div>
        <footer className="mt-10 border-t border-ink/10 py-6"><AppSignature /></footer>
      </div>
    </main>
  );
}
