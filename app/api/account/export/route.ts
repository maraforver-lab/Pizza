import { NextResponse } from "next/server";
import {
  accountDataExportFilename,
  accountDataExportHtmlFilename,
  assembleAccountDataExport,
  renderAccountDataExportHtml,
} from "@/lib/account-data-export";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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
    const format = new URL(request.url).searchParams.get("format");
    const isReadableHtml = format === "html";
    const body = isReadableHtml ? renderAccountDataExportHtml(payload) : JSON.stringify(payload, null, 2);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": isReadableHtml ? "text/html; charset=utf-8" : "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${isReadableHtml ? accountDataExportHtmlFilename(exportedAt) : accountDataExportFilename(exportedAt)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Your data export could not be prepared.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
