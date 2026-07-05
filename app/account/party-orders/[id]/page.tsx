import { redirect } from "next/navigation";
import { PartyOrderDetail } from "@/components/account/PartyOrderDetail";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function requireSignedInUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/account");
}

export default async function PartyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSignedInUser();
  const { id } = await params;

  return (
    <main className="min-h-screen bg-cream px-4 py-10 pb-28 text-ink sm:px-6">
      <div className="mx-auto max-w-4xl">
        <PartyOrderDetail eventId={id} />
      </div>
    </main>
  );
}
