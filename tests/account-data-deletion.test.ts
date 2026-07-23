import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractOwnedPizzaSessionPhotoPaths,
} from "@/lib/account-data-deletion";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Account data deletion backend", () => {
  it("extracts only owned pizza photo paths for later Storage cleanup", () => {
    expect(extractOwnedPizzaSessionPhotoPaths([
      {
        id: "owned-with-photo",
        session_data: {
          photo: {
            path: "user-1/session-a/photo.webp",
            signedUrl: "https://example.com/signed",
          },
        },
      },
      {
        id: "owned-duplicate",
        session_data: {
          photo: {
            path: "user-1/session-a/photo.webp",
          },
        },
      },
      {
        id: "other-user",
        session_data: {
          photo: {
            path: "user-2/session-b/photo.webp",
          },
        },
      },
      {
        id: "missing-photo",
        session_data: {},
      },
    ], "user-1")).toEqual(["user-1/session-a/photo.webp"]);
  });

  it("adds an authenticated API that derives identity from the server session only", () => {
    const route = source("app/api/account/data/route.ts");

    expect(route).toContain("export async function DELETE()");
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("deleteSignedInUserCloudApplicationData({ user })");
    expect(route).toContain("Sign in to delete your DoughTools cloud data.");
    expect(route).toContain("status: result.success ? 200 : 207");
    expect(route).not.toContain("request.json");
    expect(route).not.toMatch(/userId|user_id.*request|auth\.admin|deleteUser|storage\.from|createSignedUrl/i);
  });

  it("keeps service-role access server-only and out of browser-facing code", () => {
    const serviceRole = source("lib/supabase/service-role.ts");
    const route = source("app/api/account/data/route.ts");
    const exportRoute = source("app/api/account/export/route.ts");

    expect(serviceRole).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serviceRole).toContain("persistSession: false");
    expect(serviceRole).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE");
    expect(route).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(exportRoute).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("deletes owner-scoped cloud data in dependency order and reports partial failures", () => {
    const helper = source("lib/account-data-deletion.ts");
    const route = source("app/api/account/data/route.ts");

    expect(helper).toContain(".from(\"pizza_sessions\")");
    expect(helper).toContain(".from(\"party_orders\")");
    expect(helper).toContain(".from(\"party_order_submissions\")");
    expect(helper).toContain(".from(\"party_order_items\")");
    expect(helper).toContain(".from(\"account_preferences\")");
    expect(helper).toContain(".from(\"user_roles\")");
    expect(helper).toContain(".eq(\"user_id\", user.id)");
    expect(helper).toContain(".eq(\"role\", \"basic\")");
    expect(helper).toContain(".in(\"party_order_id\", partyOrderIds)");
    expect(helper).toContain(".in(\"submission_id\", submissionIds)");
    expect(helper).toContain("const partyItemsFailed");
    expect(helper).toContain("const submissionsFailed");
    expect(route).toContain("status: result.success ? 200 : 207");
    const orderItemsDelete = helper.indexOf(".from(\"party_order_items\")");
    const submissionsDelete = helper.indexOf(".from(\"party_order_submissions\")", orderItemsDelete);
    const partyOrdersDelete = helper.indexOf(".from(\"party_orders\")", submissionsDelete);
    const pizzaPlansDelete = helper.indexOf(".from(\"pizza_sessions\")", helper.indexOf("queuedPhotoPaths"));

    expect(orderItemsDelete).toBeLessThan(submissionsDelete);
    expect(submissionsDelete).toBeLessThan(partyOrdersDelete);
    expect(helper.indexOf("queuedPhotoPaths")).toBeLessThan(pizzaPlansDelete);
  });

  it("preserves Auth, Storage objects and admin public configuration for later patches", () => {
    const helper = source("lib/account-data-deletion.ts");

    expect(helper).toContain("supabaseAuthUser");
    expect(helper).toContain("Auth account deletion is reserved");
    expect(helper).toContain("pizzaSessionPhotoStorageObjects");
    expect(helper).toContain("queuedPhotoPaths");
    expect(helper).toContain("adminPublicConfiguration");
    expect(helper).toContain("Public theme campaigns and sound settings");
    expect(helper).toContain("role === \"admin\"");
    expect(helper).toContain("Admin role rows are preserved");
    expect(helper).not.toMatch(/deleteUser|auth\.admin|storage\.from|theme_campaigns|bake_timer_sound_theme_settings|public_token|edit_token/i);
  });

  it("uses idempotent empty-category results instead of treating absence as failure", () => {
    const helper = source("lib/account-data-deletion.ts");

    expect(helper).toContain("No owned Party Order items were present.");
    expect(helper).toContain("No owned Party Order guest submissions were present.");
    expect(helper).toContain("No owned Party Orders were present.");
    expect(helper).toContain("deletedCounts");
    expect(helper).toContain("completedCategories");
    expect(helper).toContain("failedCategories");
    expect(helper).toContain("preservedCategories");
  });
});
