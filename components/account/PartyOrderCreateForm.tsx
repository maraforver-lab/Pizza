"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PIZZA_CATALOG_OPTIONS } from "@/lib/pizza-catalog";
import { dateTimeLocalToUtc, detectBrowserPartyOrderTimeZone } from "@/lib/party-order-time";
import { normalizePartyOrderRow } from "@/lib/party-orders";

export function PartyOrderCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pizzaDateTime, setPizzaDateTime] = useState("");
  const [ordersCloseAt, setOrdersCloseAt] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [allowedPizzaIds, setAllowedPizzaIds] = useState<string[]>(["margherita"]);
  const [timeZone, setTimeZone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeZone(detectBrowserPartyOrderTimeZone() ?? "");
  }, []);

  const togglePizza = (id: string) => {
    setAllowedPizzaIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (allowedPizzaIds.length === 0) {
      setError("Choose at least one pizza option.");
      return;
    }
    const detectedTimeZone = detectBrowserPartyOrderTimeZone();
    if (!detectedTimeZone) {
      setError("We couldn’t detect your time zone. Refresh the page and try again.");
      return;
    }
    setTimeZone(detectedTimeZone);
    const pizzaTimeResult = dateTimeLocalToUtc(pizzaDateTime, detectedTimeZone);
    if (!pizzaTimeResult.ok) {
      setError(pizzaTimeResult.error);
      return;
    }
    const ordersCloseResult = dateTimeLocalToUtc(ordersCloseAt, detectedTimeZone);
    if (!ordersCloseResult.ok) {
      setError(ordersCloseResult.error);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/party-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          pizzaDateTime: pizzaTimeResult.instant,
          ordersCloseAt: ordersCloseResult.instant,
          timeZone: detectedTimeZone,
          guestNote,
          allowedPizzaIds,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Party Order could not be created.");
      const created = normalizePartyOrderRow(payload.event);
      if (!created) throw new Error("Party Order could not be verified.");
      router.push(`/account/party-orders/${created.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Party Order could not be created.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">New Party Order</p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">Create a Party Order</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
        Set the event details and choose which existing DoughTools pizza options guests will be allowed to order.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-5">
        <label className="block text-sm font-extrabold text-ink/70">
          Event title
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-cream/50 px-4 text-base font-bold text-ink outline-none focus:border-tomato"
            placeholder="Saturday pizza party"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-extrabold text-ink/70">
            Pizza date/time
            <input
              required
              type="datetime-local"
              value={pizzaDateTime}
              onChange={(event) => setPizzaDateTime(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-cream/50 px-4 text-base font-bold text-ink outline-none focus:border-tomato"
            />
          </label>
          <label className="block text-sm font-extrabold text-ink/70">
            Orders close date/time
            <input
              required
              type="datetime-local"
              value={ordersCloseAt}
              onChange={(event) => setOrdersCloseAt(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-cream/50 px-4 text-base font-bold text-ink outline-none focus:border-tomato"
            />
          </label>
        </div>
        <p className="text-xs font-bold leading-5 text-ink/50">
          {timeZone ? `Times use your browser time zone: ${timeZone}.` : "Detecting your browser time zone…"}
        </p>

        <label className="block text-sm font-extrabold text-ink/70">
          Guest note / instructions
          <textarea
            value={guestNote}
            onChange={(event) => setGuestNote(event.target.value)}
            className="mt-2 min-h-28 w-full rounded-2xl border border-ink/10 bg-cream/50 px-4 py-3 text-base font-bold text-ink outline-none focus:border-tomato"
            placeholder="Tell guests when orders close or what to expect."
          />
        </label>

        <section aria-labelledby="allowed-pizzas-heading">
          <h2 id="allowed-pizzas-heading" className="font-display text-2xl font-semibold">Allowed pizzas</h2>
          <p className="mt-1 text-sm leading-6 text-ink/55">These options come from the same catalog used by the Shopping list.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PIZZA_CATALOG_OPTIONS.map((option) => {
              const selected = allowedPizzaIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => togglePizza(option.id)}
                  className={`rounded-[1.35rem] border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                    selected ? "border-tomato/45 bg-tomato/[.08]" : "border-ink/10 bg-cream/65 hover:border-tomato/25"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-extrabold text-ink">
                    <span aria-hidden="true">{option.marker}</span>
                    {option.name}
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-ink/60">{option.shortDescription}</span>
                  <span className="mt-2 block text-xs font-bold leading-5 text-ink/45">{option.ingredientSummary}</span>
                </button>
              );
            })}
          </div>
        </section>

        {error && <p role="alert" className="rounded-2xl bg-tomato/10 p-4 text-sm font-extrabold text-tomato">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/account/party-orders" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink">
            Back
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create party order"}
          </button>
        </div>
      </form>
    </section>
  );
}
