import { NextResponse } from "next/server";
import {
  accountDataExportFilename,
  assembleAccountDataExport,
} from "@/lib/account-data-export";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });
  }

  try {
    const exportedAt = new Date();
    const payload = await assembleAccountDataExport({
      supabase,
      user,
      exportedAt: exportedAt.toISOString(),
    });
    const body = JSON.stringify(payload, null, 2);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${accountDataExportFilename(exportedAt)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Your data export could not be prepared.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
