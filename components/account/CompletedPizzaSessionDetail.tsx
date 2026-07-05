"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cloudPizzaSessionDetailSummary,
  normalizeCloudPizzaSessionHistoryRow,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession } from "@/lib/pizza-session";
import {
  PIZZA_SESSION_PHOTO_ACCEPTED_TYPES,
  PIZZA_SESSION_PHOTO_MAX_BYTES,
  PIZZA_SESSION_PHOTO_OUTPUT_TYPE,
  PIZZA_SESSION_PHOTO_PROCESS_ERROR,
  PIZZA_SESSION_PHOTO_SIZE_ERROR,
  PIZZA_SESSION_PHOTO_TYPE_ERROR,
  PIZZA_SESSION_PHOTO_UPLOAD_ERROR,
  isAcceptedPizzaSessionPhotoType,
} from "@/lib/pizza-session-photo";
import { optimizePizzaSessionPhotoForUpload } from "@/lib/pizza-session-photo-optimizer";

type CompletedPizzaSessionDetailProps = {
  sessionId: string;
};

export function CompletedPizzaSessionDetail({ sessionId }: CompletedPizzaSessionDetailProps) {
  const [session, setSession] = useState<CloudPizzaSessionRow | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCompletedSession() {
      setReady(false);
      setError("");
      try {
        const response = await fetch(`/api/pizza-sessions/history/${sessionId}`, { method: "GET" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Completed pizza session could not be loaded.");
        }
        const row = normalizeCloudPizzaSessionHistoryRow(payload.session);
        if (!row) throw new Error("Completed pizza session could not be found.");
        if (mounted) setSession(row);
      } catch (caught) {
        if (mounted) {
          setSession(null);
          setError(caught instanceof Error ? caught.message : "Completed pizza session could not be loaded.");
        }
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadCompletedSession();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  if (!ready) {
    return (
      <section className="rounded-[2rem] border border-ink/10 bg-white p-5 text-sm font-bold text-ink/45 shadow-card sm:p-7">
        Loading completed pizza session…
      </section>
    );
  }

  if (error || !session) {
    return (
      <section className="rounded-[2rem] border border-tomato/15 bg-white p-5 shadow-card sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Session unavailable</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Completed session not found.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink/60">
          {error || "This completed Pizza Session could not be loaded."}
        </p>
        <Link
          href="/account"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          ← Back to account
        </Link>
      </section>
    );
  }

  const summary = cloudPizzaSessionDetailSummary(session);
  const sessionData = migratePizzaSession(session.session_data);
  const photo = sessionData?.photo;

  const uploadPhoto = async (file: File | undefined) => {
    setPhotoMessage("");
    setPhotoError("");
    if (!file) return;
    if (!isAcceptedPizzaSessionPhotoType(file.type)) {
      setPhotoError(PIZZA_SESSION_PHOTO_TYPE_ERROR);
      return;
    }
    if (file.size > PIZZA_SESSION_PHOTO_MAX_BYTES) {
      setPhotoError(PIZZA_SESSION_PHOTO_SIZE_ERROR);
      return;
    }

    setUploadingPhoto(true);
    try {
      const optimizedPhoto = await optimizePizzaSessionPhotoForUpload(file);
      const formData = new FormData();
      formData.set("photo", optimizedPhoto.file);
      formData.set("originalFileName", optimizedPhoto.originalFileName);
      formData.set("originalContentType", optimizedPhoto.originalContentType);
      formData.set("originalSize", String(optimizedPhoto.originalSize));
      formData.set("optimizedSize", String(optimizedPhoto.optimizedSize));
      formData.set("width", String(optimizedPhoto.width));
      formData.set("height", String(optimizedPhoto.height));
      formData.set("compressionQuality", String(optimizedPhoto.compressionQuality));
      formData.set("maxDimensionUsed", String(optimizedPhoto.maxDimensionUsed));
      const response = await fetch(`/api/pizza-sessions/history/${sessionId}/photo`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || PIZZA_SESSION_PHOTO_UPLOAD_ERROR);
      const nextSession = normalizeCloudPizzaSessionHistoryRow(payload.session);
      if (!nextSession) throw new Error(PIZZA_SESSION_PHOTO_UPLOAD_ERROR);
      setSession(nextSession);
      setPhotoMessage("Pizza photo saved");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : PIZZA_SESSION_PHOTO_UPLOAD_ERROR;
      setPhotoError(message === PIZZA_SESSION_PHOTO_PROCESS_ERROR ? PIZZA_SESSION_PHOTO_PROCESS_ERROR : message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <article className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Completed session</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{summary.title}</h1>
          <p className="mt-2 text-sm font-extrabold leading-6 text-leaf">{summary.statusLine}</p>
        </div>
        <Link
          href="/account"
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-2xl border border-ink/10 bg-cream/60 px-4 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          ← Back to account
        </Link>
      </div>

      <section className="mt-6 grid gap-3 rounded-[1.5rem] border border-leaf/15 bg-leaf/[.06] p-4 sm:grid-cols-2">
        <p className="rounded-[1.15rem] bg-white/85 p-4 text-sm font-bold leading-6 text-ink/70">{summary.doughLine}</p>
        <p className="rounded-[1.15rem] bg-white/85 p-4 text-sm font-bold leading-6 text-ink/70">{summary.bakeLine}</p>
        {summary.hydrationLine && (
          <p className="rounded-[1.15rem] bg-white/85 p-4 text-sm font-bold leading-6 text-ink/70">{summary.hydrationLine}</p>
        )}
        {summary.fermentationLine && (
          <p className="rounded-[1.15rem] bg-white/85 p-4 text-sm font-bold leading-6 text-ink/70">{summary.fermentationLine}</p>
        )}
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-ink/10 bg-white p-4 sm:p-5" aria-labelledby="completed-session-photo-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Pizza photo</p>
            <h2 id="completed-session-photo-heading" className="mt-2 font-display text-3xl font-semibold">Pizza photo</h2>
            {!photo?.url && (
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Add a photo of your finished pizza to remember this bake.
              </p>
            )}
          </div>
          <label className="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center rounded-2xl bg-tomato px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-tomato focus-within:ring-offset-2 focus-within:ring-offset-cream">
            {uploadingPhoto ? "Uploading…" : "Upload pizza photo"}
            <input
              type="file"
              accept={PIZZA_SESSION_PHOTO_ACCEPTED_TYPES.join(",")}
              data-output-type={PIZZA_SESSION_PHOTO_OUTPUT_TYPE}
              className="sr-only"
              disabled={uploadingPhoto}
              onChange={(event) => {
                uploadPhoto(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {photo?.url && (
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-cream/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt="Finished pizza photo"
              className="max-h-[36rem] w-full object-cover"
            />
          </div>
        )}
        {photoMessage && <p role="status" className="mt-3 text-sm font-extrabold text-leaf">{photoMessage}</p>}
        {photoError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{photoError}</p>}
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-ink/10 bg-cream/65 p-4 sm:p-5" aria-labelledby="completed-session-review-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Review notes</p>
            <h2 id="completed-session-review-heading" className="mt-2 font-display text-3xl font-semibold">What happened</h2>
          </div>
          {summary.review.ratingLine && (
            <p className="w-fit rounded-full bg-white px-3 py-2 text-xs font-extrabold text-ink/65 ring-1 ring-ink/10">
              {summary.review.ratingLine}
            </p>
          )}
        </div>

        {summary.review.notes.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {summary.review.notes.map((note) => (
              <div key={note.label} className="rounded-[1.15rem] border border-white/80 bg-white/85 p-4">
                <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">{note.label}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/70">{note.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-[1.15rem] border border-white/80 bg-white/85 p-4 text-sm leading-6 text-ink/55">
            No review notes were saved for this session.
          </p>
        )}
      </section>
    </article>
  );
}
