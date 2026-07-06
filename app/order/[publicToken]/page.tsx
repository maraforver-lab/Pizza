import { notFound } from "next/navigation";
import { PublicPartyOrderForm } from "@/components/party-orders/PublicPartyOrderForm";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizePublicPartyOrder,
  partyOrderAllowedPizzaOptions,
  partyOrderDateTimeLabel,
  type PublicPartyOrder,
} from "@/lib/party-orders";

async function loadPublicPartyOrder(publicToken: string) {
  const token = publicToken.trim();
  if (!token) return undefined;

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .rpc("get_public_party_order", { token_value: token })
      .maybeSingle();

    if (error) return undefined;
    return normalizePublicPartyOrder(data);
  } catch {
    return undefined;
  }
}

function orderStatusLabel(order: PublicPartyOrder, now = new Date()) {
  if (order.status === "closed" || order.status === "archived") return "Orders closed";
  const closeTime = new Date(order.orders_close_at).getTime();
  if (Number.isFinite(closeTime) && closeTime < now.getTime()) return "Orders closed";
  return "Orders open";
}

export default async function PublicPartyOrderPage({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const { publicToken } = await params;
  const event = await loadPublicPartyOrder(publicToken);
  if (!event) notFound();

  const allowedPizzas = partyOrderAllowedPizzaOptions(event);
  const statusLabel = orderStatusLabel(event);
  const isOpen = statusLabel === "Orders open";

  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-20 text-ink sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-card">
        <section className="bg-[radial-gradient(circle_at_top_right,rgba(216,75,42,0.18),transparent_36%),linear-gradient(135deg,rgba(84,116,90,0.14),rgba(246,243,234,0.7))] p-5 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">DoughTools Party Order</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-6xl">{event.title}</h1>
          <p className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.16em] ${
            isOpen ? "bg-leaf/10 text-leaf" : "bg-tomato/10 text-tomato"
          }`}
          >
            {statusLabel}
          </p>
        </section>

        <section className="grid gap-3 p-5 sm:grid-cols-2 sm:p-8">
          <div className="rounded-[1.35rem] bg-cream/70 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Pizza time</p>
            <p className="mt-2 text-sm font-extrabold text-ink/75">{partyOrderDateTimeLabel(event.pizza_datetime)}</p>
          </div>
          <div className="rounded-[1.35rem] bg-cream/70 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Orders close</p>
            <p className="mt-2 text-sm font-extrabold text-ink/75">{partyOrderDateTimeLabel(event.orders_close_at)}</p>
          </div>
        </section>

        {event.guest_note && (
          <section className="mx-5 rounded-[1.5rem] border border-ink/10 bg-cream/60 p-4 sm:mx-8">
            <h2 className="text-sm font-extrabold uppercase tracking-[.16em] text-ink/45">Host note</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/70">{event.guest_note}</p>
          </section>
        )}

        <section className="p-5 sm:p-8" aria-labelledby="guest-pizza-options-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="guest-pizza-options-heading" className="font-display text-3xl font-semibold">Choose from these pizzas</h2>
              <p className="mt-2 text-sm leading-6 text-ink/55">
                These are the pizza options your host made available for this event.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {allowedPizzas.map((pizza) => (
              <article key={pizza.id} className="rounded-[1.35rem] border border-ink/10 bg-cream/65 p-4">
                <p className="text-base font-extrabold text-ink">{pizza.marker} {pizza.name}</p>
                <p className="mt-2 text-sm leading-5 text-ink/60">{pizza.shortDescription}</p>
                <p className="mt-2 text-xs font-bold leading-5 text-ink/45">{pizza.ingredientSummary}</p>
              </article>
            ))}
          </div>
        </section>

        <PublicPartyOrderForm event={event} allowedPizzas={allowedPizzas} isOpen={isOpen} />
      </article>
    </main>
  );
}
