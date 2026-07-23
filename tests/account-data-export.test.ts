import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DATA_EXPORT_FORMAT_VERSION,
  accountDataExportFilename,
  sanitizeAccountExportValue,
} from "@/lib/account-data-export";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Account data export", () => {
  it("defines a stable export format and safe downloadable filename", () => {
    expect(ACCOUNT_DATA_EXPORT_FORMAT_VERSION).toBe(1);
    expect(accountDataExportFilename(new Date("2026-07-23T12:34:00.000Z"))).toBe("doughtools-data-export-2026-07-23.json");
  });

  it("sanitizes tokens, credentials and signed URLs from exported values", () => {
    expect(sanitizeAccountExportValue({
      title: "Completed pizza",
      public_token: "public-token",
      editToken: "edit-token",
      access_token: "access-token",
      password_hash: "hash",
      photo: {
        path: "user/session/photo.webp",
        signedUrl: "https://example.com/signed",
        url: "https://example.com/public",
      },
      nested: [{ refreshToken: "refresh", guest_name: "Alex" }],
    })).toEqual({
      title: "Completed pizza",
      photo: {
        path: "user/session/photo.webp",
      },
      nested: [{ guest_name: "Alex" }],
    });
  });

  it("adds an authenticated export API that derives identity from the server session", () => {
    const route = source("app/api/account/export/route.ts");
    const helper = source("lib/account-data-export.ts");

    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("assembleAccountDataExport");
    expect(route).toContain("Content-Disposition");
    expect(route).toContain("application/json; charset=utf-8");
    expect(route).toContain("Cache-Control");
    expect(route).toContain("no-store");
    expect(route).not.toContain("request.json");
    expect(route).not.toMatch(/userId|user_id.*request|createSignedUrl|service_role|auth\.admin/i);

    expect(helper).toContain("user: User");
    expect(helper).toContain(".eq(\"user_id\", user.id)");
    expect(helper).toContain(".rpc(\"current_user_app_role\")");
  });

  it("exports the categories identified by the GDPR audit without accepting cross-user selectors", () => {
    const helper = source("lib/account-data-export.ts");

    expect(helper).toContain("accountPreferences");
    expect(helper).toContain("pizzaPlans");
    expect(helper).toContain("reviewPhotos");
    expect(helper).toContain("partyOrders");
    expect(helper).toContain("partyOrderGuestSubmissions");
    expect(helper).toContain("partyOrderItems");
    expect(helper).toContain("role: { role }");
    expect(helper).toContain(".from(\"account_preferences\")");
    expect(helper).toContain(".from(\"pizza_sessions\")");
    expect(helper).toContain(".from(\"party_orders\")");
    expect(helper).toContain(".from(\"party_order_submissions\")");
    expect(helper).toContain(".from(\"party_order_items\")");
    expect(helper).toContain(".in(\"party_order_id\", partyOrderIds)");
    expect(helper).toContain(".in(\"submission_id\", submissionIds)");
    expect(helper).toContain("PARTY_ORDERS_EXPORT_SELECT = \"id,user_id,title");
    expect(helper).not.toMatch(/createSignedUrl|storage\.from/i);
  });

  it("surfaces Download my data under Account Settings Privacy and data", () => {
    const settingsPage = source("app/account/settings/page.tsx");
    const privacyPage = source("app/account/settings/privacy/page.tsx");
    const component = source("components/account/AccountDataExportCard.tsx");

    expect(settingsPage).toContain("/account/settings/privacy");
    expect(settingsPage).not.toContain("<AccountDataExportCard />");
    expect(privacyPage).toContain("AccountDataExportCard");
    expect(privacyPage).toContain("<AccountDataExportCard />");
    expect(component).toContain("Privacy and data");
    expect(component).toContain("Download my data");
    expect(component).toContain('fetch("/api/account/export"');
    expect(component).toContain("downloads without navigating away");
    expect(component).not.toMatch(/delete account|account deletion|localStorage|sessionStorage/i);
  });
});
