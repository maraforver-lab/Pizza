"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  downloadPartyOrderInvitationImage,
  downloadPartyOrderInvitationPdf,
} from "@/lib/party-order-invitation-export";
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
type ExportState = "idle" | "preparing" | "saved" | "error";

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

function PartyOrderInvitationExportCard({
  event,
  qrCodeDataUrl,
  shareLink,
}: {
  event: PartyOrderRow;
  qrCodeDataUrl: string;
  shareLink: string;
}) {
  return (
    <div
      className="relative overflow-hidden bg-ink text-white"
      style={{
        width: 1080,
        height: 1350,
        backgroundImage:
          "linear-gradient(180deg, rgba(32, 37, 31, .48) 0%, rgba(32, 37, 31, .72) 54%, rgba(32, 37, 31, .9) 100%), url('/images/homepage/hero-desktop-bg.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,248,241,.28),transparent_28%),linear-gradient(135deg,rgba(15,61,46,.82),transparent_54%)]" />
      <div className="relative flex h-full flex-col justify-between p-16">
        <div className="max-w-[760px] rounded-[48px] border border-white/18 bg-ink/68 p-12 shadow-[0_30px_100px_rgba(0,0,0,.35)] backdrop-blur">
          <p className="text-3xl font-black uppercase tracking-[.18em] text-white/76">DoughTools · Pizza Party</p>
          <h3 className="mt-8 break-words font-display text-[88px] font-semibold leading-[.9] text-white">
            {event.title}
          </h3>
          <div className="mt-10 grid grid-cols-2 gap-5">
            <p className="rounded-[28px] border border-white/16 bg-white/12 p-6 text-2xl font-bold leading-snug text-white/78">
              Pizza time:<br />
              <span className="text-3xl text-white">{partyOrderDateTimeLabel(event.pizza_datetime)}</span>
            </p>
            <p className="rounded-[28px] border border-white/16 bg-white/12 p-6 text-2xl font-bold leading-snug text-white/78">
              Order by:<br />
              <span className="text-3xl text-white">{partyOrderDateTimeLabel(event.orders_close_at)}</span>
            </p>
          </div>
          {event.guest_note && (
            <p className="mt-8 whitespace-pre-line rounded-[30px] border border-white/16 bg-white/12 p-7 text-3xl font-semibold leading-snug text-white/88">
              {event.guest_note}
            </p>
          )}
        </div>

        <div className="grid grid-cols-[1fr_330px] items-end gap-8 rounded-[48px] border border-white/18 bg-white/92 p-9 text-ink shadow-[0_30px_100px_rgba(0,0,0,.32)]">
          <div>
            <p className="text-2xl font-black uppercase tracking-[.16em] text-leaf">Scan to choose your pizza</p>
            <p className="mt-4 text-4xl font-black leading-tight text-ink">Open the menu, pick your pizzas, and send your order.</p>
            <p className="mt-6 break-all text-2xl font-bold leading-snug text-ink/58">{shareLink}</p>
          </div>
          <div className="rounded-[32px] border border-ink/10 bg-white p-6">
            {qrCodeDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodeDataUrl} alt="QR code for public pizza order link" className="h-[282px] w-[282px]" />
            ) : (
              <div className="grid h-[282px] w-[282px] place-items-center text-lg font-bold text-ink/45">
                QR code loading…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PartyOrderInvitationCard({ event, shareLink }: PartyOrderInvitationCardProps) {
  const exportCardRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [copyLinkState, setCopyLinkState] = useState<CopyState>("idle");
  const [copyTextState, setCopyTextState] = useState<CopyState>("idle");
  const [imageExportState, setImageExportState] = useState<ExportState>("idle");
  const [pdfExportState, setPdfExportState] = useState<ExportState>("idle");
  const [exportError, setExportError] = useState("");
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
      width: 360,
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

  const exportInvitation = async (type: "image" | "pdf") => {
    const setState = type === "image" ? setImageExportState : setPdfExportState;
    setExportError("");
    setState("preparing");
    try {
      if (!exportCardRef.current || !qrCodeDataUrl) throw new Error("Invitation export is not ready yet.");
      if (type === "image") {
        await downloadPartyOrderInvitationImage(exportCardRef.current);
      } else {
        await downloadPartyOrderInvitationPdf(exportCardRef.current);
      }
      setState("saved");
      window.setTimeout(() => setState("idle"), 2200);
    } catch {
      setExportError("Could not export the invitation. Please try again.");
      setState("error");
      window.setTimeout(() => setState("idle"), 2500);
    }
  };

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

      <div className="pointer-events-none fixed left-[-12000px] top-0" aria-hidden="true">
        <div ref={exportCardRef}>
          <PartyOrderInvitationExportCard event={event} qrCodeDataUrl={qrCodeDataUrl} shareLink={shareLink} />
        </div>
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
          <button
            type="button"
            onClick={() => exportInvitation("image")}
            disabled={!qrCodeDataUrl || imageExportState === "preparing"}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-xs font-extrabold text-ink transition hover:border-leaf/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {imageExportState === "preparing" ? "Preparing image…" : imageExportState === "saved" ? "Image downloaded" : "Download invitation image"}
          </button>
          <button
            type="button"
            onClick={() => exportInvitation("pdf")}
            disabled={!qrCodeDataUrl || pdfExportState === "preparing"}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-xs font-extrabold text-ink transition hover:border-leaf/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pdfExportState === "preparing" ? "Preparing PDF…" : pdfExportState === "saved" ? "PDF downloaded" : "Download invitation PDF"}
          </button>
        </div>
        {exportError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{exportError}</p>}
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-cream/70 p-4 text-xs font-bold leading-5 text-ink/58">
          {invitationText}
        </pre>
      </div>
    </section>
  );
}
