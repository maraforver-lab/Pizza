import Link from "next/link";
import AdminAppearanceClient from "@/components/admin/AdminAppearanceClient";
import { DoughToolsIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/admin";
import { getActivePublicTheme, normalizeAdminThemeCampaignRows } from "@/lib/public-theme-campaigns";

export const dynamic = "force-dynamic";

export default async function AdminAppearancePage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_list_theme_campaigns");
  const activeTheme = await getActivePublicTheme();

  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-24 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/70 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <DoughToolsIcon name="back" size={20} />
          Back to admin
        </Link>
        <div className="mt-6">
          <AdminAppearanceClient
            initialActiveTheme={activeTheme.theme}
            initialCampaigns={normalizeAdminThemeCampaignRows(data)}
          />
        </div>
      </div>
    </main>
  );
}
