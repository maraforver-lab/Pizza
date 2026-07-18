"use client";

import { FormEvent, useMemo, useState } from "react";
import { PIZZA_CATALOG_OPTIONS } from "@/lib/pizza-catalog";
import { dateTimeLocalToUtc, utcToZonedFormValue } from "@/lib/party-order-time";
import { normalizePartyOrderRow, type PartyOrderRow } from "@/lib/party-orders";

type PartyOrderSettingsEditFormProps = {
  event: PartyOrderRow;
  onCancel: () => void;
  onSaved: (event: PartyOrderRow) => void;
};

export function PartyOrderSettingsEditForm({ event, onCancel, onSaved }: PartyOrderSettingsEditFormProps) {
  const initialPizzaIds = useMemo(() => event.allowed_pizza_ids, [event.allowed_pizza_ids]);
  const initialPizzaDateTime = useMemo(
    () => utcToZonedFormValue({ instant: event.pizza_datetime, timeZone: event.time_zone }),
    [event.pizza_datetime, event.time_zone],
  );
  const initialOrdersCloseAt = useMemo(
    () => utcToZonedFormValue({ instant: event.orders_close_at, timeZone: event.time_zone }),
    [event.orders_close_at, event.time_zone],
  );
  const [title, setTitle] = useState(event.title);
  const [pizzaDateTime, setPizzaDateTime] = useState(() => initialPizzaDateTime);
  const [ordersCloseAt, setOrdersCloseAt] = useState(() => initialOrdersCloseAt);
  const [guestNote, setGuestNote] = useState(event.guest_note ?? "");
  const [allowedPizzaIds, setAllowedPizzaIds] = useState<string[]>(initialPizzaIds);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const togglePizza = (id: string) => {
    setAllowedPizzaIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const submit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    setError("");
    if (allowedPizzaIds.length === 0) {
      setError("Choose at least one pizza option.");
      return;
    }
    const nextPizzaDateTime = pizzaDateTime === initialPizzaDateTime
      ? event.pizza_datetime
      : dateTimeLocalToUtc(pizzaDateTime, event.time_zone);
    if (typeof nextPizzaDateTime !== "string" && !nextPizzaDateTime.ok) {
      setError(nextPizzaDateTime.error);
      return;
    }
    const nextOrdersCloseAt = ordersCloseAt === initialOrdersCloseAt
      ? event.orders_close_at
      : dateTimeLocalToUtc(ordersCloseAt, event.time_zone);
    if (typeof nextOrdersCloseAt !== "string" && !nextOrdersCloseAt.ok) {
      setError(nextOrdersCloseAt.error);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/party-orders/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          pizzaDateTime: typeof nextPizzaDateTime === "string" ? nextPizzaDateTime : nextPizzaDateTime.instant,
          ordersCloseAt: typeof nextOrdersCloseAt === "string" ? nextOrdersCloseAt : nextOrdersCloseAt.instant,
          timeZone: event.time_zone,
          guestNote,
          allowedPizzaIds,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Party Order details could not be saved.");
      const updated = normalizePartyOrderRow(payload.event);
      if (!updated) throw new Error("Party Order details could not be verified.");
      onSaved(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Party Order details could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-5 rounded-[1.5rem] border border-tomato/15 bg-tomato/[.04] p-4" aria-labelledby="party-order-edit-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Edit party details</p>
          <h2 id="party-order-edit-heading" className="mt-2 font-display text-2xl font-semibold">Update invitation and menu</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Existing guest orders stay intact. New guest orders will use the updated pizza options.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/70 transition hover:border-ink/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-5">
        <label className="block text-sm font-extrabold text-ink/70">
          Event title
          <input
            required
            maxLength={120}
            value={title}
            onChange={(inputEvent) => setTitle(inputEvent.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-bold text-ink outline-none focus:border-tomato"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-extrabold text-ink/70">
            Pizza date/time
            <input
              required
              type="datetime-local"
              value={pizzaDateTime}
              onChange={(inputEvent) => setPizzaDateTime(inputEvent.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-bold text-ink outline-none focus:border-tomato"
            />
          </label>
          <label className="block text-sm font-extrabold text-ink/70">
            Orders close date/time
            <input
              required
              type="datetime-local"
              value={ordersCloseAt}
              onChange={(inputEvent) => setOrdersCloseAt(inputEvent.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-bold text-ink outline-none focus:border-tomato"
            />
          </label>
        </div>
        <p className="text-xs font-bold leading-5 text-ink/50">
          Times use this Party Order time zone: {event.time_zone}.
        </p>

        <label className="block text-sm font-extrabold text-ink/70">
          Guest note / invitation text
          <textarea
            value={guestNote}
            maxLength={500}
            onChange={(inputEvent) => setGuestNote(inputEvent.target.value)}
            className="mt-2 min-h-28 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base font-bold text-ink outline-none focus:border-tomato"
          />
        </label>

        <section aria-labelledby="edit-allowed-pizzas-heading">
          <h3 id="edit-allowed-pizzas-heading" className="font-display text-2xl font-semibold">Allowed pizzas</h3>
          <p className="mt-1 text-sm leading-6 text-ink/55">These options come from the shared DoughTools pizza catalog.</p>
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
                    selected ? "border-tomato/45 bg-white" : "border-ink/10 bg-cream/65 hover:border-tomato/25"
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
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
