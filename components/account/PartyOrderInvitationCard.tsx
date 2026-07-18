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

function displayShareLink(value: string) {
  try {
    const url = new URL(value);
    const displayValue = `${url.host}${url.pathname}`;
    return displayValue.length > 46 ? `${displayValue.slice(0, 34)}…${displayValue.slice(-8)}` : displayValue;
  } catch {
    return value.length > 46 ? `${value.slice(0, 34)}…${value.slice(-8)}` : value;
  }
}

function normalizePublicGuestUrl(value: string) {
  const compactValue = value.trim().replace(/\s+/g, "");
  if (!compactValue) return "";
  try {
    return new URL(compactValue).toString();
  } catch {
    return compactValue;
  }
}

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
  publicGuestUrl,
}: {
  event: PartyOrderRow;
  qrCodeDataUrl: string;
  publicGuestUrl: string;
}) {
  const displayedShareLink = displayShareLink(publicGuestUrl);

  return (
    <div
      className="relative overflow-hidden bg-ink text-white"
      style={{
        width: 1080,
        height: 1350,
        backgroundImage:
          "linear-gradient(180deg, rgba(32, 37, 31, .48) 0%, rgba(32, 37, 31, .72) 54%, rgba(32, 37, 31, .9) 100%), url('/images/homepage/doughtools-hero-desktop.webp')",
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
              <span className="text-3xl text-white">{partyOrderDateTimeLabel(event.pizza_datetime, event.time_zone)}</span>
            </p>
            <p className="rounded-[28px] border border-white/16 bg-white/12 p-6 text-2xl font-bold leading-snug text-white/78">
              Order by:<br />
              <span className="text-3xl text-white">{partyOrderDateTimeLabel(event.orders_close_at, event.time_zone)}</span>
            </p>
          </div>
          {event.guest_note && (
            <p className="mt-8 whitespace-pre-line rounded-[30px] border border-white/16 bg-white/12 p-7 text-3xl font-semibold leading-snug text-white/88">
              {event.guest_note}
            </p>
          )}
        </div>

        <div className="grid grid-cols-[1fr_356px] items-center gap-8" data-invitation-lower-layout="separate">
          <div
            className="rounded-[48px] border border-white/65 bg-[#fff8f1] p-9 text-ink shadow-[0_10px_28px_rgba(0,0,0,.14)]"
            data-invitation-lower-panel="true"
          >
            <p className="text-2xl font-black uppercase tracking-[.16em] text-leaf">Scan to choose your pizza</p>
            <p className="mt-4 text-4xl font-black leading-tight text-ink">Open the menu, pick your pizzas, and send your order.</p>
            <p className="mt-6 max-w-[570px] truncate text-2xl font-extrabold leading-snug text-ink/72">{displayedShareLink}</p>
          </div>
          <div
            className="relative z-10 rounded-[34px] border border-ink/10 bg-white p-7 shadow-[0_18px_55px_rgba(0,0,0,.16)]"
            data-qr-container="true"
          >
            {qrCodeDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeDataUrl}
                alt="QR code for public pizza order link"
                width={286}
                height={286}
                data-party-order-export-qr="true"
                data-qr-url={publicGuestUrl}
                className="h-[286px] w-[286px]"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <div className="grid h-[286px] w-[286px] place-items-center text-lg font-bold text-ink/45">
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
  const exportInFlightRef = useRef(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [copyLinkState, setCopyLinkState] = useState<CopyState>("idle");
  const [copyTextState, setCopyTextState] = useState<CopyState>("idle");
  const [imageExportState, setImageExportState] = useState<ExportState>("idle");
  const [pdfExportState, setPdfExportState] = useState<ExportState>("idle");
  const [exportError, setExportError] = useState("");
  const publicGuestUrl = useMemo(() => normalizePublicGuestUrl(shareLink), [shareLink]);
  const invitationText = useMemo(() => partyOrderInvitationText(event, publicGuestUrl), [event, publicGuestUrl]);
  const displayedShareLink = useMemo(() => displayShareLink(publicGuestUrl), [publicGuestUrl]);
  const exportPreparing = imageExportState === "preparing" || pdfExportState === "preparing";

  useEffect(() => {
    let cancelled = false;
    if (!publicGuestUrl) {
      setQrCodeDataUrl("");
      return;
    }

    QRCode.toDataURL(publicGuestUrl, {
      errorCorrectionLevel: "M",
      margin: 4,
      width: 640,
      color: {
        dark: "#1F1F1F",
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
  }, [publicGuestUrl]);

  const exportInvitation = async (type: "image" | "pdf") => {
    if (exportInFlightRef.current) return;
    const setState = type === "image" ? setImageExportState : setPdfExportState;
    setExportError("");
    exportInFlightRef.current = true;
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
      setExportError("We couldn’t prepare the QR code for the invitation image. Try again.");
      setState("error");
      window.setTimeout(() => setState("idle"), 2500);
    } finally {
      exportInFlightRef.current = false;
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
        <Link href={publicGuestUrl || "#"} className="inline-flex min-h-10 items-center text-sm font-extrabold text-tomato transition hover:text-ink">
          Open public guest page →
        </Link>
      </div>

      <div className="pointer-events-none fixed left-[-12000px] top-0" aria-hidden="true">
        <div ref={exportCardRef}>
          <PartyOrderInvitationExportCard event={event} qrCodeDataUrl={qrCodeDataUrl} publicGuestUrl={publicGuestUrl} />
        </div>
      </div>

      <div
        className="mt-5 overflow-hidden rounded-[2rem] border border-white/25 bg-ink text-white shadow-card"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(32, 37, 31, .94) 0%, rgba(32, 37, 31, .76) 48%, rgba(32, 37, 31, .42) 100%), url('/images/homepage/doughtools-hero-desktop.webp')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="grid gap-5 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/75">DoughTools · Pizza Party</p>
            <h3 className="mt-3 break-words font-display text-4xl font-semibold leading-[.95] sm:text-5xl">
              {event.title}
            </h3>
            <div className="mt-5 grid gap-3 text-sm font-bold leading-6 text-white/82 sm:grid-cols-2">
              <p className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                Pizza time:<br />
                <span className="text-base text-white">{partyOrderDateTimeLabel(event.pizza_datetime, event.time_zone)}</span>
              </p>
              <p className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                Order by:<br />
                <span className="text-base text-white">{partyOrderDateTimeLabel(event.orders_close_at, event.time_zone)}</span>
              </p>
            </div>
            {event.guest_note && (
              <p className="mt-4 whitespace-pre-line rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-white/86 backdrop-blur">
                {event.guest_note}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center" data-invitation-lower-layout="separate">
            <div
              className="min-w-0 rounded-[1.5rem] border border-white/60 bg-[#fff8f1] p-4 text-ink shadow-sm sm:p-5"
              data-invitation-lower-panel="true"
            >
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Scan to choose your pizza</p>
              <p className="mt-2 text-xl font-black leading-tight text-ink">
                Open the menu, pick your pizzas, and send your order.
              </p>
              <p className="mt-3 truncate text-sm font-extrabold leading-6 text-ink/70">{displayedShareLink}</p>
            </div>
            <div className="relative z-10 rounded-[1.35rem] border border-ink/10 bg-white p-3 text-center shadow-sm sm:w-56" data-qr-container="true">
              <div
                className="mx-auto grid aspect-square w-48 place-items-center rounded-2xl bg-white"
                data-qr-url={publicGuestUrl}
                aria-label={`QR code for ${publicGuestUrl}`}
              >
                {qrCodeDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeDataUrl}
                    alt="QR code for public pizza order link"
                    width={192}
                    height={192}
                    data-party-order-preview-qr="true"
                    data-qr-url={publicGuestUrl}
                    className="h-full w-full"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="text-xs font-bold leading-5 text-ink/45">QR code loading…</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-ink/10 bg-white/85 p-4">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Public guest link</p>
        <p className="mt-2 break-all text-sm font-extrabold text-ink/70">{publicGuestUrl}</p>
        <p className="mt-3 text-sm leading-6 text-ink/60">
          Guests can open this link to choose pizzas and send their order without signing in.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => copyText(publicGuestUrl, setCopyLinkState)}
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
            disabled={!qrCodeDataUrl || exportPreparing}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-xs font-extrabold text-ink transition hover:border-leaf/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {imageExportState === "preparing" ? "Preparing invitation image…" : imageExportState === "saved" ? "Image downloaded" : "Download invitation image"}
          </button>
          <button
            type="button"
            onClick={() => exportInvitation("pdf")}
            disabled={!qrCodeDataUrl || exportPreparing}
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
