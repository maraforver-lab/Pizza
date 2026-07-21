import Link from "next/link";
import AdminBakeTimerSoundsClient from "@/components/admin/AdminBakeTimerSoundsClient";
import { DoughToolsIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth/admin";
import { bakeTimerSoundSettingsResponse } from "@/lib/bake-timer-sound-settings";

export const dynamic = "force-dynamic";

export default async function AdminBakeTimerSoundsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_list_bake_timer_sound_theme_settings");

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
          <AdminBakeTimerSoundsClient initialSettings={bakeTimerSoundSettingsResponse(data)} />
        </div>
      </div>
    </main>
  );
}
