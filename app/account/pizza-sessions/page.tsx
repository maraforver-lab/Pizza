import Link from "next/link";
import { AccountPizzaSessionHistory } from "@/components/account/AccountPizzaSessionHistory";

export default function PizzaPlanHistoryPage() {
  return (
    <main className="min-h-screen bg-cream px-4 py-10 pb-28 text-ink sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 max-w-3xl" aria-labelledby="pizza-plan-history-page-heading">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Account</p>
          <h1 id="pizza-plan-history-page-heading" className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Pizza plan history
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink/60 sm:text-base sm:leading-7">
            Open any completed pizza plan from your retained account history.
          </p>
          <Link
            href="/account"
            className="mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            ← Back to account
          </Link>
        </section>
        <AccountPizzaSessionHistory enabled />
      </div>
    </main>
  );
}
