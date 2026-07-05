"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  partyOrderDateTimeLabel,
  partyOrderInvitationText,
  type PartyOrderRow,
} from "@/lib/party-orders";

type PartyOrderInvitationCardProps = {
  event: PartyOrderRow;
  shareLink: string;
};

type CopyState = "idle" | "copied" | "unavailable";

async function copyText(value: string, setState: (state: CopyState) => void) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(value);
    setState("copied");
    window.setTimeout(() => setState("idle"), 2000);
  } catch {
    setState("unavailable");
    window.setTimeout(() => setState("idle"), 2500);
  }
}

export function PartyOrderInvitationCard({ event, shareLink }: PartyOrderInvitationCardProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [copyLinkState, setCopyLinkState] = useState<CopyState>("idle");
  const [copyTextState, setCopyTextState] = useState<CopyState>("idle");
  const invitationText = useMemo(() => partyOrderInvitationText(event, shareLink), [event, shareLink]);

  useEffect(() => {
    let cancelled = false;
    if (!shareLink) {
      setQrCodeDataUrl("");
      return;
    }

    QRCode.toDataURL(shareLink, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: {
        dark: "#20251f",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrCodeDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrCodeDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [shareLink]);

  return (
    <section className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-leaf/[.06] p-4" aria-labelledby="party-order-invitation-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Share invitation</p>
          <h2 id="party-order-invitation-heading" className="mt-2 font-display text-2xl font-semibold">
            Pizza party invitation
          </h2>
        </div>
        <Link href={shareLink || "#"} className="text-sm font-extrabold text-tomato transition hover:text-ink">
          Open public guest page →
        </Link>
      </div>

      <div
        className="mt-5 overflow-hidden rounded-[2rem] border border-white/25 bg-ink text-white shadow-card"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(32, 37, 31, .94) 0%, rgba(32, 37, 31, .76) 48%, rgba(32, 37, 31, .42) 100%), url('/images/homepage/hero-desktop-bg.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/75">DoughTools · Pizza Party</p>
            <h3 className="mt-3 break-words font-display text-4xl font-semibold leading-[.95] sm:text-5xl">
              {event.title}
            </h3>
            <div className="mt-5 grid gap-3 text-sm font-bold leading-6 text-white/82 sm:grid-cols-2">
              <p className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                Pizza time:<br />
                <span className="text-base text-white">{partyOrderDateTimeLabel(event.pizza_datetime)}</span>
              </p>
              <p className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                Order by:<br />
                <span className="text-base text-white">{partyOrderDateTimeLabel(event.orders_close_at)}</span>
              </p>
            </div>
            {event.guest_note && (
              <p className="mt-4 whitespace-pre-line rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-white/86 backdrop-blur">
                {event.guest_note}
              </p>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-white/25 bg-white p-4 text-center text-ink shadow-card sm:w-64">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Scan to choose</p>
            <div
              className="mx-auto mt-3 grid aspect-square w-44 place-items-center rounded-2xl bg-white sm:w-48"
              data-qr-url={shareLink}
              aria-label={`QR code for ${shareLink}`}
            >
              {qrCodeDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCodeDataUrl} alt="QR code for public pizza order link" className="h-full w-full" />
              ) : (
                <span className="text-xs font-bold leading-5 text-ink/45">QR code loading…</span>
              )}
            </div>
            <p className="mt-3 break-all text-xs font-bold leading-5 text-ink/55">{shareLink}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-ink/10 bg-white/85 p-4">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Public guest link</p>
        <p className="mt-2 break-all text-sm font-extrabold text-ink/70">{shareLink}</p>
        <p className="mt-3 text-sm leading-6 text-ink/60">
          Guests can open this link to choose pizzas and send their order without signing in.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => copyText(shareLink, setCopyLinkState)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 text-xs font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {copyLinkState === "copied" ? "Link copied" : copyLinkState === "unavailable" ? "Copy unavailable" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={() => copyText(invitationText, setCopyTextState)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-xs font-extrabold text-ink transition hover:border-leaf/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {copyTextState === "copied" ? "Invitation text copied" : copyTextState === "unavailable" ? "Copy unavailable" : "Copy invitation text"}
          </button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-cream/70 p-4 text-xs font-bold leading-5 text-ink/58">
          {invitationText}
        </pre>
      </div>
    </section>
  );
}
