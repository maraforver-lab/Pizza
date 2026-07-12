"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PartyOrderInvitationCard } from "@/components/account/PartyOrderInvitationCard";
import { PartyOrderPrepSummaryCard } from "@/components/account/PartyOrderPrepSummaryCard";
import { PartyOrderSessionHandoff } from "@/components/account/PartyOrderSessionHandoff";
import { PartyOrderSettingsEditForm } from "@/components/account/PartyOrderSettingsEditForm";
import {
  normalizePartyOrderActivity,
  normalizePartyOrderRow,
  partyOrderEmptyActivity,
  partyOrderAllowedPizzaOptions,
  partyOrderDateTimeLabel,
  partyOrderOwnerStatusSummary,
  type PartyOrderActivity,
  type PartyOrderStatus,
  type PartyOrderRow,
} from "@/lib/party-orders";

type PartyOrderDetailProps = {
  eventId: string;
};

async function loadPartyOrderDetail(eventId: string) {
  const response = await fetch(`/api/party-orders/${eventId}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Party Order could not be loaded.");
  const nextEvent = normalizePartyOrderRow(payload.event);
  if (!nextEvent) throw new Error("Party Order could not be found.");
  return {
    event: nextEvent,
    activity: normalizePartyOrderActivity(payload.activity),
  };
}

export function PartyOrderDetail({ eventId }: PartyOrderDetailProps) {
  const [event, setEvent] = useState<PartyOrderRow | null>(null);
  const [activity, setActivity] = useState<PartyOrderActivity>(partyOrderEmptyActivity);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [editing, setEditing] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState("");
  const [deletingSubmissionId, setDeletingSubmissionId] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const shareLink = useMemo(() => (
    event && typeof location !== "undefined" ? `${location.origin}/order/${event.public_token}` : ""
  ), [event]);

  useEffect(() => {
    let mounted = true;
    async function loadEvent() {
      setReady(false);
      setError("");
      try {
        const nextDetail = await loadPartyOrderDetail(eventId);
        if (mounted) {
          setEvent(nextDetail.event);
          setActivity(nextDetail.activity);
        }
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : "Party Order could not be loaded.");
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (!ready) {
    return (
      <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 text-sm font-bold text-ink/45 shadow-card sm:p-7">
        Loading Party Order…
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="mt-8 rounded-[2rem] border border-tomato/15 bg-white p-5 shadow-card sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Party Order unavailable</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Party Order not found.</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">{error || "This Party Order could not be loaded."}</p>
        <Link href="/account/party-orders" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink">
          ← Back to Party Orders
        </Link>
      </section>
    );
  }

  const allowedPizzas = partyOrderAllowedPizzaOptions(event);
  const statusSummary = partyOrderOwnerStatusSummary(event);

  const updateOrderStatus = async (status: PartyOrderStatus) => {
    setStatusUpdating(true);
    setStatusMessage("");
    setStatusError("");
    try {
      const response = await fetch(`/api/party-orders/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Party Order status could not be updated.");
      const nextEvent = normalizePartyOrderRow(payload.event);
      if (!nextEvent) throw new Error("Party Order status could not be verified.");
      setEvent(nextEvent);
      setStatusMessage(
        nextEvent.status === "archived"
          ? "Party Order archived."
          : status === "closed"
            ? "Orders are now closed."
            : event.status === "archived"
              ? "Party Order restored."
              : "Orders are open again.",
      );
    } catch (caught) {
      setStatusError(caught instanceof Error ? caught.message : "Party Order status could not be updated.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const deleteGuestOrder = async (submissionId: string) => {
    setDeletingSubmissionId(submissionId);
    setDeleteMessage("");
    setDeleteError("");
    try {
      const response = await fetch(`/api/party-orders/${event.id}/submissions/${submissionId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Guest order could not be deleted.");
      const nextDetail = await loadPartyOrderDetail(event.id);
      setEvent(nextDetail.event);
      setActivity(nextDetail.activity);
      setConfirmingDeleteId("");
      setDeleteMessage("Guest order deleted.");
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "Guest order could not be deleted.");
    } finally {
      setDeletingSubmissionId("");
    }
  };

  return (
    <article className="mt-6 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-card sm:mt-8 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Party Order</p>
          <h1 className="mt-3 break-words [overflow-wrap:anywhere] font-display text-4xl font-semibold leading-tight sm:text-5xl">{event.title}</h1>
          <p className="mt-3 text-xs font-extrabold uppercase tracking-[.16em] text-leaf">{event.status}</p>
        </div>
        <Link href="/account/party-orders" className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-cream/60 px-4 text-sm font-extrabold text-ink sm:w-auto">
          ← Back
        </Link>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-ink/10 bg-cream/55 p-4">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Quick actions</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm leading-6 text-ink/55">
          Edit the invitation details and allowed pizza options without changing existing guest orders.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setDetailsMessage("");
          }}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
        >
          Edit party details
        </button>
        </div>
      </div>
      {detailsMessage && <p role="status" className="mt-3 text-sm font-extrabold text-leaf">{detailsMessage}</p>}

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <p className="rounded-[1.25rem] bg-cream/70 p-4 text-sm font-bold leading-6 text-ink/70">
          Pizza time: {partyOrderDateTimeLabel(event.pizza_datetime)}
        </p>
        <p className="rounded-[1.25rem] bg-cream/70 p-4 text-sm font-bold leading-6 text-ink/70">
          Orders close: {partyOrderDateTimeLabel(event.orders_close_at)}
        </p>
      </section>

      {editing && (
        <PartyOrderSettingsEditForm
          event={event}
          onCancel={() => setEditing(false)}
          onSaved={(updatedEvent) => {
            setEvent(updatedEvent);
            setEditing(false);
            setDetailsMessage("Party Order details saved.");
          }}
        />
      )}

      <section className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-leaf/[.06] p-4" aria-labelledby="party-order-status-control-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Order status</p>
            <h2 id="party-order-status-control-heading" className="mt-2 font-display text-2xl font-semibold">
              {statusSummary.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">{statusSummary.helper}</p>
            {statusMessage && <p role="status" className="mt-3 text-sm font-extrabold text-leaf">{statusMessage}</p>}
            {statusError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{statusError}</p>}
          </div>
          {statusSummary.canClose && (
            <button
              type="button"
              onClick={() => updateOrderStatus("closed")}
              disabled={statusUpdating}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-tomato/15 bg-white px-4 text-sm font-extrabold text-tomato transition hover:border-tomato/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {statusUpdating ? "Closing…" : "Close orders"}
            </button>
          )}
          {statusSummary.canReopen && (
            <button
              type="button"
              onClick={() => updateOrderStatus("open")}
              disabled={statusUpdating}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {statusUpdating ? "Reopening…" : "Reopen orders"}
            </button>
          )}
          {statusSummary.canArchive && (
            <button
              type="button"
              onClick={() => updateOrderStatus("archived")}
              disabled={statusUpdating}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/70 transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {statusUpdating ? "Archiving…" : "Archive party order"}
            </button>
          )}
          {statusSummary.canRestore && (
            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={() => updateOrderStatus("open")}
                disabled={statusUpdating}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {statusUpdating ? "Restoring…" : "Restore party order"}
              </button>
              <p className="mt-2 max-w-52 text-xs font-bold leading-5 text-ink/50">
                Move this Party Order back to your active list.
              </p>
            </div>
          )}
        </div>
        {event.status !== "archived" && (
          <p className="mt-4 rounded-2xl bg-white/70 p-3 text-sm font-bold leading-6 text-ink/58">
            Archived party orders are hidden from the active list. Existing guest orders are kept.
          </p>
        )}
      </section>

      {event.guest_note && (
        <section className="mt-5 rounded-[1.5rem] border border-ink/10 bg-cream/60 p-4">
          <h2 className="text-sm font-extrabold uppercase tracking-[.16em] text-ink/45">Guest note</h2>
          <p className="mt-2 whitespace-pre-line [overflow-wrap:anywhere] text-sm leading-6 text-ink/70">{event.guest_note}</p>
        </section>
      )}

      <section className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-leaf/[.06] p-4" aria-labelledby="party-order-summary-heading">
        <h2 id="party-order-summary-heading" className="font-display text-2xl font-semibold">Summary</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <p className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-bold leading-6 text-ink/70">
            Guest orders: <strong className="text-ink">{activity.submissionCount}</strong>
          </p>
          <p className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-bold leading-6 text-ink/70">
            Total pizzas: <strong className="text-ink">{activity.totalPizzaCount}</strong>
          </p>
          <p className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-bold leading-6 text-ink/70">
            Order status: <strong className="capitalize text-ink">{event.status}</strong>
          </p>
          <p className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-bold leading-6 text-ink/70">
            Pizza time: <strong className="text-ink">{partyOrderDateTimeLabel(event.pizza_datetime)}</strong>
          </p>
          <p className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-bold leading-6 text-ink/70 sm:col-span-2">
            Orders close: <strong className="text-ink">{partyOrderDateTimeLabel(event.orders_close_at)}</strong>
          </p>
        </div>
      </section>

      <PartyOrderSessionHandoff event={event} activity={activity} />

      <PartyOrderInvitationCard event={event} shareLink={shareLink} />

      {event.status === "archived" && (
        <section className="mt-5 rounded-[1.5rem] border border-tomato/15 bg-tomato/[.06] p-4">
          <h2 className="font-display text-2xl font-semibold">Public ordering is paused</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            This Party Order is archived, so the public link is visible but not accepting guest orders.
          </p>
        </section>
      )}

      <section className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white p-4" aria-labelledby="party-order-pizza-mix-heading">
        <h2 id="party-order-pizza-mix-heading" className="font-display text-2xl font-semibold">Pizza mix</h2>
        {activity.pizzaMix.length ? (
          <div className="mt-4 grid gap-2">
            {activity.pizzaMix.map((pizza) => (
              <div key={pizza.pizza_id} className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-ink/10 bg-cream/65 px-4 py-3">
                <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-extrabold text-ink">{pizza.pizza_name_snapshot}</span>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-extrabold text-leaf ring-1 ring-leaf/15">
                  {pizza.quantity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1.25rem] border border-ink/10 bg-cream/65 p-4">
            <h3 className="text-base font-extrabold text-ink">No guest orders yet.</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Share the public guest link to start collecting pizza choices.
            </p>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white p-4" aria-labelledby="party-order-guest-orders-heading">
        <h2 id="party-order-guest-orders-heading" className="font-display text-2xl font-semibold">Guest orders</h2>
        {deleteMessage && <p role="status" className="mt-3 text-sm font-extrabold text-leaf">{deleteMessage}</p>}
        {deleteError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{deleteError}</p>}
        {activity.guestOrders.length ? (
          <div className="mt-4 grid gap-3">
            {activity.guestOrders.map((order) => (
              <article key={order.id} className="rounded-[1.25rem] border border-ink/10 bg-cream/65 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="min-w-0 [overflow-wrap:anywhere] text-base font-extrabold text-ink">{order.guest_name}</h3>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <p className="text-xs font-bold text-ink/45">Submitted {partyOrderDateTimeLabel(order.created_at)}</p>
                    {confirmingDeleteId !== order.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingDeleteId(order.id);
                          setDeleteMessage("");
                          setDeleteError("");
                        }}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-2xl border border-tomato/15 bg-white px-3 text-xs font-extrabold text-tomato transition hover:border-tomato/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
                      >
                        Delete order
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {order.items.map((item, index) => (
                    <p key={`${order.id}-${item.pizza_id}-${index}`} className="[overflow-wrap:anywhere] text-sm font-bold leading-6 text-ink/68">
                      {item.quantity} × {item.pizza_name_snapshot}
                    </p>
                  ))}
                </div>
                {order.guest_comment && (
                  <p className="mt-3 rounded-2xl bg-white/75 p-3 [overflow-wrap:anywhere] text-sm leading-6 text-ink/65">
                    <span className="font-extrabold text-ink">Comment:</span> {order.guest_comment}
                  </p>
                )}
                {confirmingDeleteId === order.id && (
                  <div className="mt-4 rounded-[1.1rem] border border-tomato/15 bg-white p-4">
                    <h4 className="text-sm font-extrabold text-ink">Delete this guest order?</h4>
                    <p className="mt-2 text-sm leading-6 text-ink/60">
                      This will remove the guest’s pizzas from the party summary. This cannot be undone.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId("")}
                        disabled={deletingSubmissionId === order.id}
                        className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/70 transition hover:border-ink/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGuestOrder(order.id)}
                        disabled={Boolean(deletingSubmissionId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingSubmissionId === order.id ? "Deleting…" : "Delete order"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1.25rem] border border-ink/10 bg-cream/65 p-4">
            <h3 className="text-base font-extrabold text-ink">No guest orders yet.</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Share the public guest link to start collecting pizza choices.
            </p>
          </div>
        )}
      </section>

      <PartyOrderPrepSummaryCard event={event} activity={activity} shareLink={shareLink} />

      <section className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white p-4" aria-labelledby="selected-pizzas-heading">
        <h2 id="selected-pizzas-heading" className="font-display text-2xl font-semibold">Selected allowed pizzas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {allowedPizzas.map((pizza) => (
            <div key={pizza.id} className="rounded-[1.25rem] border border-ink/10 bg-cream/65 p-4">
              <p className="[overflow-wrap:anywhere] text-sm font-extrabold text-ink">{pizza.marker} {pizza.name}</p>
              <p className="mt-2 [overflow-wrap:anywhere] text-xs font-bold leading-5 text-ink/50">{pizza.ingredientSummary}</p>
            </div>
          ))}
        </div>
      </section>

    </article>
  );
}
