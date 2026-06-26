"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isUpdateRecent,
  latestPublicUpdate,
  newUpdateNotice,
  RECENT_UPDATE_NOTICE_VISIBLE_MS,
} from "@/lib/changelog";

export default function LatestUpdateNotice() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/session")) {
      setVisible(false);
      return;
    }

    if (!isUpdateRecent(latestPublicUpdate?.date)) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, RECENT_UPDATE_NOTICE_VISIBLE_MS);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  if (!visible || !latestPublicUpdate) return null;

  return (
    <div className="px-4 pt-3 sm:px-6">
      <Link
        href={newUpdateNotice.href}
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-tomato/15 bg-[#fff0e9] px-4 py-3 text-sm shadow-sm transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
      >
        <span className="min-w-0">
          <span className="block text-xs font-extrabold uppercase tracking-[.16em] text-tomato">
            {newUpdateNotice.label}
          </span>
          <span className="mt-0.5 block truncate font-bold text-ink">
            {newUpdateNotice.copy}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-tomato px-3 py-1.5 text-xs font-extrabold text-white">
          View →
        </span>
      </Link>
    </div>
  );
}
