import { notFound } from "next/navigation";
import { PublicPartyOrderEditForm } from "@/components/party-orders/PublicPartyOrderEditForm";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  isPartyOrderOpen,
  normalizePublicPartyOrderEditableSubmission,
  partyOrderAllowedPizzaOptions,
  partyOrderDateTimeLabel,
  type PublicPartyOrderEditableSubmission,
} from "@/lib/party-orders";

async function loadEditableSubmission(publicToken: string, submissionToken: string) {
  const token = publicToken.trim();
  const editToken = submissionToken.trim();
  if (!token || !editToken) return undefined;

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .rpc("get_public_party_order_submission", {
        token_value: token,
        edit_token_value: editToken,
      })
      .maybeSingle();

    if (error) return undefined;
    return normalizePublicPartyOrderEditableSubmission(data);
  } catch {
    return undefined;
  }
}

function orderStatusLabel(editable: PublicPartyOrderEditableSubmission, now = new Date()) {
  if (!isPartyOrderOpen(editable.event, now)) return "Orders closed";
  return "Orders open";
}

export default async function PublicPartyOrderEditPage({
  params,
}: {
  params: Promise<{ publicToken: string; submissionToken: string }>;
}) {
  const { publicToken, submissionToken } = await params;
  const editable = await loadEditableSubmission(publicToken, submissionToken);
  if (!editable) notFound();

  const allowedPizzas = partyOrderAllowedPizzaOptions(editable.event);
  const statusLabel = orderStatusLabel(editable);
  const isOpen = statusLabel === "Orders open";

  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-20 text-ink sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-card">
        <section className="bg-[radial-gradient(circle_at_top_right,rgba(216,75,42,0.18),transparent_36%),linear-gradient(135deg,rgba(84,116,90,0.14),rgba(246,243,234,0.7))] p-5 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">DoughTools Party Order</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-6xl">{editable.event.title}</h1>
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
            <p className="mt-2 text-sm font-extrabold text-ink/75">{partyOrderDateTimeLabel(editable.event.pizza_datetime)}</p>
          </div>
          <div className="rounded-[1.35rem] bg-cream/70 p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Orders close</p>
            <p className="mt-2 text-sm font-extrabold text-ink/75">{partyOrderDateTimeLabel(editable.event.orders_close_at)}</p>
          </div>
        </section>

        {editable.event.guest_note && (
          <section className="mx-5 rounded-[1.5rem] border border-ink/10 bg-cream/60 p-4 sm:mx-8">
            <h2 className="text-sm font-extrabold uppercase tracking-[.16em] text-ink/45">Host note</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/70">{editable.event.guest_note}</p>
          </section>
        )}

        <PublicPartyOrderEditForm
          editable={editable}
          editToken={submissionToken.trim()}
          allowedPizzas={allowedPizzas}
          isOpen={isOpen}
        />
      </article>
    </main>
  );
}
