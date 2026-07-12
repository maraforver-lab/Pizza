"use client";

import { useMemo, useState } from "react";
import type { PizzaCatalogOption } from "@/lib/pizza-catalog";
import type { PartyOrderSubmissionSummary, PublicPartyOrderEditableSubmission } from "@/lib/party-orders";

type PublicPartyOrderEditFormProps = {
  editable: PublicPartyOrderEditableSubmission;
  editToken: string;
  allowedPizzas: PizzaCatalogOption[];
  isOpen: boolean;
};

const MAX_QUANTITY_PER_PIZZA = 10;

export function PublicPartyOrderEditForm({ editable, editToken, allowedPizzas, isOpen }: PublicPartyOrderEditFormProps) {
  const [guestName, setGuestName] = useState(editable.submission.guest_name);
  const [guestComment, setGuestComment] = useState(editable.submission.guest_comment ?? "");
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const allowedIds = new Set<string>(allowedPizzas.map((pizza) => pizza.id));
    return Object.fromEntries(
      editable.submission.items
        .filter((item) => allowedIds.has(item.pizza_id))
        .map((item) => [item.pizza_id, item.quantity]),
    );
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [updatedOrder, setUpdatedOrder] = useState<PartyOrderSubmissionSummary | null>(null);

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

  const saveOrder = async () => {
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/party-orders/public/${editable.event.public_token}/submissions/${editToken}`, {
        method: "PATCH",
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
      if (!response.ok) throw new Error(payload.error || "Your order could not be updated. Please try again.");
      const submission = payload.submission;
      setUpdatedOrder({
        guest_name: typeof submission?.guestName === "string" ? submission.guestName : guestName.trim(),
        guest_comment: typeof submission?.guestComment === "string" ? submission.guestComment : null,
        items: Array.isArray(submission?.items) ? submission.items : selectedItems,
        totalQuantity: typeof submission?.totalQuantity === "number" ? submission.totalQuantity : totalQuantity,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your order could not be updated. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const summary = updatedOrder ?? editable.submission;

  if (!isOpen) {
    return (
      <section className="border-t border-ink/10 bg-tomato/[.06] p-5 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Orders are closed</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          This party order is no longer accepting edits. Ask your host if anything needs to change.
        </p>
        <OrderSummary order={summary} />
      </section>
    );
  }

  if (updatedOrder) {
    return (
      <section className="border-t border-ink/10 bg-leaf/[.06] p-5 sm:p-8" aria-live="polite">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Order updated</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Your pizza order was updated.</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          {updatedOrder.guest_name}, your host will see the latest version in the party summary.
        </p>
        <OrderSummary order={updatedOrder} />
      </section>
    );
  }

  return (
    <section className="border-t border-ink/10 bg-leaf/[.06] p-5 sm:p-8" aria-labelledby="guest-order-edit-form-heading">
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Edit your pizza order</p>
      <h2 id="guest-order-edit-form-heading" className="mt-2 font-display text-3xl font-semibold">Edit your pizza order</h2>
      <p className="mt-2 text-sm leading-6 text-ink/60">
        Update your name, pizza choices or comment. Saving replaces your previous pizza quantities.
      </p>

      <div className="mt-5 grid gap-5">
        <label className="block text-sm font-extrabold text-ink/70">
          Your name
          <input
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            maxLength={80}
            className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-bold text-ink outline-none focus:border-tomato"
          />
        </label>

        <section aria-labelledby="edit-your-pizzas-heading">
          <h3 id="edit-your-pizzas-heading" className="font-display text-2xl font-semibold">Choose your pizzas</h3>
          <p className="mt-1 text-sm leading-6 text-ink/55">Only the currently available party menu can be saved.</p>
          <div className="mt-3 grid gap-3">
            {allowedPizzas.map((pizza) => {
              const quantity = quantities[pizza.id] ?? 0;
              return (
                <article key={pizza.id} className="rounded-[1.35rem] border border-ink/10 bg-white p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 [overflow-wrap:anywhere]">
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
          />
        </label>

        {error && <p role="alert" className="rounded-2xl bg-tomato/10 p-4 text-sm font-extrabold text-tomato">{error}</p>}

        <button
          type="button"
          onClick={saveOrder}
          disabled={saving || totalQuantity < 1}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </section>
  );
}

function OrderSummary({ order }: { order: PartyOrderSubmissionSummary }) {
  return (
    <div className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-white/80 p-4">
      <p className="text-sm font-extrabold text-ink">Your order summary</p>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/70">
        {order.items.map((item) => (
          <li key={item.pizza_id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/70 px-3 py-2">
            <span>{item.pizza_name_snapshot}</span>
            <strong>{item.quantity}</strong>
          </li>
        ))}
      </ul>
      {order.guest_comment && (
        <p className="mt-3 text-sm leading-6 text-ink/55">Comment: {order.guest_comment}</p>
      )}
    </div>
  );
}
