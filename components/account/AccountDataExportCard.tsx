"use client";

import { useEffect, useRef, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";

type ExportState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function filenameFromContentDisposition(value: string | null) {
  const match = value?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? `doughtools-data-export-${new Date().toISOString().slice(0, 10)}.json`;
}

export function AccountDataExportCard() {
  const [state, setState] = useState<ExportState>({ status: "idle", message: "" });
  const downloadUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
  }, []);

  async function downloadData() {
    if (state.status === "loading") return;
    setState({ status: "loading", message: "Preparing your data export..." });

    if (downloadUrl.current) {
      URL.revokeObjectURL(downloadUrl.current);
      downloadUrl.current = null;
    }

    try {
      const response = await fetch("/api/account/export", { method: "GET" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Your data export could not be prepared.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      downloadUrl.current = url;
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromContentDisposition(response.headers.get("Content-Disposition"));
      document.body.appendChild(link);
      link.click();
      link.remove();
      setState({ status: "success", message: "Your data export is downloading." });
    } catch (caught) {
      setState({
        status: "error",
        message: caught instanceof Error ? caught.message : "Your data export could not be prepared.",
      });
    }
  }

  return (
    <section
      className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5"
      aria-labelledby="privacy-data-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Account data</p>
          <h2 id="privacy-data-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
            Privacy and data
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Download a JSON file with your account details, preferences, pizza plans, Review photo metadata, Party Orders, and related guest submissions for orders you own.
          </p>
        </div>
        <DoughToolsIcon name="download" size={24} className="mt-1 shrink-0 text-tomato" aria-hidden="true" />
      </div>

      <div className="mt-4 rounded-2xl border border-ink/10 bg-cream/65 p-3">
        <p className="text-xs font-bold leading-5 text-ink/55">
          The export downloads without navigating away. It does not include passwords, login tokens, raw Storage credentials, signed photo links, private Party Order tokens, or data from other users.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <p className="text-xs font-bold leading-5 text-ink/45" aria-live="polite">
          {state.message || "Nothing is changed or deleted when you download your data."}
        </p>
        <button
          type="button"
          onClick={() => void downloadData()}
          disabled={state.status === "loading"}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <DoughToolsIcon name="download" size={20} aria-hidden="true" />
          {state.status === "loading" ? "Preparing..." : "Download my data"}
        </button>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="mt-3 rounded-2xl bg-tomato/10 px-3 py-2 text-xs font-extrabold leading-5 text-tomato">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
