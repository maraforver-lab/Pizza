"use client";

import { useEffect, useRef } from "react";
import type { PizzaSession } from "@/lib/pizza-session";
import { queueCloudActivePizzaSessionSave } from "@/lib/cloud-pizza-session-client";

type CloudPizzaSessionSyncProps = {
  session: PizzaSession | null | undefined;
};

export function CloudPizzaSessionSync({ session }: CloudPizzaSessionSyncProps) {
  const lastSyncedKey = useRef("");

  useEffect(() => {
    if (!session) return;
    const syncKey = [
      session.id,
      session.currentStep,
      session.status,
      session.updatedAt,
      session.lastSavedAt,
    ].join(":");
    if (lastSyncedKey.current === syncKey) return;
    void queueCloudActivePizzaSessionSave(session).then((result) => {
      if (!("skipped" in result) || !("reason" in result) || result.reason !== "unauthenticated") {
        lastSyncedKey.current = syncKey;
      }
    }).catch(() => {
      // Keep Pizza Session usable if account sync is temporarily unavailable.
    });
  }, [session]);

  return null;
}
