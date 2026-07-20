"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { ADMIN_APP_ROLE, normalizeAppRole, type AppRole } from "@/lib/auth/roles";

type AdminStatus = {
  isAdmin: boolean;
  role: AppRole;
};

export function AccountAdminEntryCard() {
  const [status, setStatus] = useState<AdminStatus | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAdminStatus() {
      try {
        const response = await fetch("/api/admin/status", { method: "GET" });
        if (!response.ok) return;
        const payload = await response.json() as Partial<AdminStatus>;
        if (!mounted) return;
        setStatus({
          isAdmin: payload.isAdmin === true,
          role: normalizeAppRole(payload.role),
        });
      } catch {
        if (mounted) setStatus(null);
      }
    }

    loadAdminStatus();
    return () => {
      mounted = false;
    };
  }, []);

  if (!status?.isAdmin || status.role !== ADMIN_APP_ROLE) return null;

  return (
    <section className="rounded-[1.75rem] border border-tomato/20 bg-tomato/[.06] p-4 shadow-sm sm:p-5" aria-labelledby="account-admin-heading">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Admin</p>
      <h2 id="account-admin-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
        Product admin
      </h2>
      <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
        Manage public DoughTools configuration. Private user activity is not exposed here.
      </p>
      <Link
        href="/admin"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      >
        <DoughToolsIcon name="experience-level" size={20} />
        Open admin
      </Link>
    </section>
  );
}
