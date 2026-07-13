import Link from "next/link";
import { heatFeedbackPatterns, ovenProblems } from "@/lib/oven-education";

export default function OvenProblemGuide() {
  return (
    <section id="common-oven-problems" className="scroll-mt-24" aria-labelledby="oven-problems-title">
      <div className="rounded-[2rem] bg-forest-dark p-5 text-white shadow-raised sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">Top heat vs bottom heat</p>
        <h2 id="oven-problems-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Read the bake like a heat map.</h2>
        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          {heatFeedbackPatterns.map((pattern) => (
            <article key={pattern.title} className="rounded-[1.25rem] border border-white/10 bg-white/[.07] p-4">
              <h3 className="text-sm font-extrabold">{pattern.title}</h3>
              <p className="mt-2 text-xs leading-5 text-white/62">{pattern.imbalance}</p>
              <p className="mt-3 rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/72">{pattern.correction}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Common problems</p>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">What went wrong in the oven?</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {ovenProblems.map((problem) => (
            <article key={problem.id} className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-card">
              <h3 className="font-display text-2xl font-semibold">{problem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/60"><strong>What you see:</strong> {problem.sees}</p>
              <details className="mt-4 rounded-[1.1rem] bg-flour/70 p-4">
                <summary className="cursor-pointer text-sm font-extrabold">Likely causes and corrections</summary>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-ink/65">
                  <div>
                    <strong className="text-ink">Likely causes</strong>
                    <ul className="mt-2 grid gap-1">
                      {problem.likelyCauses.map((cause) => <li key={cause}>• {cause}</li>)}
                    </ul>
                  </div>
                  <p><strong className="text-ink">Do now:</strong> {problem.doNow}</p>
                  <p><strong className="text-ink">Next bake:</strong> {problem.nextBake}</p>
                  <Link href={problem.relatedHref} className="font-extrabold text-tomato underline-offset-2 hover:underline">
                    Open related troubleshooting →
                  </Link>
                </div>
              </details>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
