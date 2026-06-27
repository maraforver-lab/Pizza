"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type SessionViewportResetProps = {
  watchKey?: string | number;
};

export function SessionViewportReset({ watchKey }: SessionViewportResetProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const reset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    reset();
    const frame = window.requestAnimationFrame(reset);

    return () => {
      window.cancelAnimationFrame(frame);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [pathname, watchKey]);

  return null;
}
