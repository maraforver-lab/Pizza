"use client";

import { useMemo, useState } from "react";
import type { PizzaCatalogOption } from "@/lib/pizza-catalog";
import type { PartyOrderSubmissionSummary, PublicPartyOrder } from "@/lib/party-orders";

type PublicPartyOrderFormProps = {
  event: PublicPartyOrder;
  allowedPizzas: PizzaCatalogOption[];
  isOpen: boolean;
};

const MAX_QUANTITY_PER_PIZZA = 10;

type SubmittedPartyOrder = PartyOrderSubmissionSummary & {
  editPath?: string;
};

export function PublicPartyOrderForm({ event, allowedPizzas, isOpen }: PublicPartyOrderFormProps) {
  const [guestName, setGuestName] = useState("");
  const [guestComment, setGuestComment] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedPartyOrder | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "unavailable">("idle");

  const selectedItems = useMemo(() => (
    allowedPizzas.flatMap((pizza) => {
      const quantity = quantities[pizza.id] ?? 0;
      return quantity > 0
        ? [{
          pizza_id: pizza.id,
          pizza_name_snapshot: pizza.name,
          quantity,
        }]
        : [];
    })
  ), [allowedPizzas, quantities]);

  const totalQuantity = selectedItems.reduce((total, item) => total + item.quantity, 0);

  const updateQuantity = (pizzaId: string, delta: number) => {
    setQuantities((current) => {
      const next = Math.min(MAX_QUANTITY_PER_PIZZA, Math.max(0, (current[pizzaId] ?? 0) + delta));
      return { ...current, [pizzaId]: next };
    });
  };

  const submitOrder = async () => {
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/party-orders/public/${event.public_token}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          guestComment,
          items: selectedItems.map((item) => ({
            pizzaId: item.pizza_id,
            quantity: item.quantity,
          })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Your order could not be saved. Please try again.");
      const submission = payload.submission;
      setSubmittedOrder({
        guest_name: typeof submission?.guestName === "string" ? submission.guestName : guestName.trim(),
        guest_comment: typeof submission?.guestComment === "string" ? submission.guestComment : null,
        items: Array.isArray(submission?.items) ? submission.items : selectedItems,
        totalQuantity: typeof submission?.totalQuantity === "number" ? submission.totalQuantity : totalQuantity,
        editPath: typeof submission?.editPath === "string" ? submission.editPath : undefined,
      });
      setGuestName("");
      setGuestComment("");
      setQuantities({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your order could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <section className="border-t border-ink/10 bg-tomato/[.06] p-5 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Orders are closed</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          This party order is no longer accepting guest orders. Ask your host if anything needs to change.
        </p>
      </section>
    );
  }

  if (submittedOrder) {
    const editLink = submittedOrder.editPath && typeof location !== "undefined"
      ? `${location.origin}${submittedOrder.editPath}`
      : "";
    const copyEditLink = async () => {
      if (!editLink || !navigator.clipboard?.writeText) {
        setCopyState("unavailable");
        return;
      }
      await navigator.clipboard.writeText(editLink);
      setCopyState("copied");
    };

    return (
      <section className="border-t border-ink/10 bg-leaf/[.06] p-5 sm:p-8" aria-live="polite">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Order received</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Thanks, your pizza order was received.</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          {submittedOrder.guest_name}, your host will use this to plan the pizza night.
        </p>
        <div className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-white/80 p-4">
          <p className="text-sm font-extrabold text-ink">Your order summary</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/70">
            {submittedOrder.items.map((item) => (
              <li key={item.pizza_id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/70 px-3 py-2">
                <span>{item.pizza_name_snapshot}</span>
                <strong>{item.quantity}</strong>
              </li>
            ))}
          </ul>
          {submittedOrder.guest_comment && (
            <p className="mt-3 text-sm leading-6 text-ink/55">Comment: {submittedOrder.guest_comment}</p>
          )}
        </div>
        {editLink && (
          <div className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white/85 p-4">
            <p className="text-sm font-extrabold text-ink">Keep this private edit link if you need to change your order:</p>
            <p className="mt-2 break-all text-sm font-bold leading-6 text-ink/60">{editLink}</p>
            <button
              type="button"
              onClick={copyEditLink}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-leaf/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
            >
              {copyState === "copied" ? "Edit link copied" : copyState === "unavailable" ? "Copy unavailable" : "Copy edit link"}
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="border-t border-ink/10 bg-leaf/[.06] p-5 sm:p-8" aria-labelledby="guest-order-form-heading">
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Send your pizza order</p>
      <h2 id="guest-order-form-heading" className="mt-2 font-display text-3xl font-semibold">Send your pizza order</h2>
      <p className="mt-2 text-sm leading-6 text-ink/60">
        Choose what you would like to eat. Your host will use this to plan the pizza night.
      </p>

      <div className="mt-5 grid gap-5">
        <label className="block text-sm font-extrabold text-ink/70">
          Your name
          <input
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            maxLength={80}
            className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-bold text-ink outline-none focus:border-tomato"
            placeholder="Mara"
          />
        </label>

        <section aria-labelledby="choose-your-pizzas-heading">
          <h3 id="choose-your-pizzas-heading" className="font-display text-2xl font-semibold">Choose your pizzas</h3>
          <div className="mt-3 grid gap-3">
            {allowedPizzas.map((pizza) => {
              const quantity = quantities[pizza.id] ?? 0;
              return (
                <article key={pizza.id} className="rounded-[1.35rem] border border-ink/10 bg-white p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-extrabold text-ink">{pizza.marker} {pizza.name}</p>
                      <p className="mt-1 text-sm leading-5 text-ink/55">{pizza.ingredientSummary}</p>
                    </div>
                    <div className="flex w-full items-center justify-between rounded-2xl bg-cream/70 p-1 sm:w-40 sm:min-w-40">
                      <button
                        type="button"
                        onClick={() => updateQuantity(pizza.id, -1)}
                        disabled={quantity === 0}
                        className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-black text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={`Remove one ${pizza.name}`}
                      >
                        −
                      </button>
                      <span className="min-w-10 text-center text-xl font-extrabold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(pizza.id, 1)}
                        disabled={quantity >= MAX_QUANTITY_PER_PIZZA}
                        className="grid h-11 w-11 place-items-center rounded-xl bg-tomato text-xl font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label={`Add one ${pizza.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <label className="block text-sm font-extrabold text-ink/70">
          Comments
          <textarea
            value={guestComment}
            onChange={(event) => setGuestComment(event.target.value)}
            maxLength={500}
            className="mt-2 min-h-28 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base font-bold text-ink outline-none focus:border-tomato"
            placeholder="Any allergy note or pizza preference?"
          />
        </label>

        {error && <p role="alert" className="rounded-2xl bg-tomato/10 p-4 text-sm font-extrabold text-tomato">{error}</p>}

        <button
          type="button"
          onClick={submitOrder}
          disabled={saving || totalQuantity < 1}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
        >
          {saving ? "Sending…" : "Send order"}
        </button>
      </div>
    </section>
  );
}
