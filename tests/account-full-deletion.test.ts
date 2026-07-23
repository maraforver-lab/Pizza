import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function fullDeletionFunctionSource() {
  const helper = source("lib/account-full-deletion.ts");
  return helper.slice(helper.indexOf("export async function deleteSignedInUserAccount"));
}

describe("Full account deletion orchestration", () => {
  it("adds an authenticated API that derives identity from the server session only", () => {
    const route = source("app/api/account/delete/route.ts");

    expect(route).toContain("export async function DELETE()");
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("deleteSignedInUserAccount({ user })");
    expect(route).toContain("Sign in to delete your DoughTools account.");
    expect(route).toContain("supabase.auth.signOut({ scope: \"local\" })");
    expect(route).not.toContain("request.json");
    expect(route).not.toMatch(/userId|user_id.*request|createSignedUrl/i);
  });

  it("blocks self-service deletion for admin accounts before destructive cleanup", () => {
    const helper = fullDeletionFunctionSource();

    expect(helper).toContain("ACCOUNT_ADMIN_SELF_DELETION_ERROR");
    expect(helper).toContain("loadAccountDeletionUserRole(serviceSupabase, user.id)");
    expect(helper).toContain("role === \"admin\"");
    expect(helper).toContain("blockedReason: \"adminRole\"");
    expect(helper.indexOf("role === \"admin\"")).toBeLessThan(helper.indexOf("collectOwnedReviewPhotoPaths"));
    expect(helper.indexOf("role === \"admin\"")).toBeLessThan(helper.indexOf("deleteOwnedReviewPhotoStorageObjects"));
    expect(helper.indexOf("role === \"admin\"")).toBeLessThan(helper.indexOf("deleteSignedInUserCloudApplicationData"));
    expect(helper.indexOf("role === \"admin\"")).toBeLessThan(helper.indexOf("auth.admin.deleteUser"));
  });

  it("deletes Storage, app data and Auth in the required order", () => {
    const sourceText = source("lib/account-full-deletion.ts");
    const helper = fullDeletionFunctionSource();

    const collectIndex = helper.indexOf("collectOwnedReviewPhotoPaths({ serviceSupabase, userId: user.id })");
    const storageIndex = helper.indexOf("deleteOwnedReviewPhotoStorageObjects");
    const appDataIndex = helper.indexOf("deleteSignedInUserCloudApplicationData({ user, serviceSupabase })");
    const authDeleteIndex = helper.indexOf("auth.admin.deleteUser(user.id)");

    expect(sourceText).toContain(".from(\"pizza_sessions\")");
    expect(sourceText).toContain(".eq(\"user_id\", userId)");
    expect(sourceText).toContain(".from(PIZZA_SESSION_PHOTO_BUCKET)");
    expect(sourceText).toContain(".remove(paths)");
    expect(collectIndex).toBeGreaterThan(-1);
    expect(storageIndex).toBeGreaterThan(-1);
    expect(appDataIndex).toBeGreaterThan(-1);
    expect(authDeleteIndex).toBeGreaterThan(-1);
    expect(collectIndex).toBeLessThan(storageIndex);
    expect(storageIndex).toBeLessThan(appDataIndex);
    expect(appDataIndex).toBeLessThan(authDeleteIndex);
  });

  it("does not delete Auth after Storage or app-data failures", () => {
    const helper = fullDeletionFunctionSource();

    expect(helper).toContain("if (!storageResult.completed)");
    expect(helper).toContain("if (!appDataResult.success)");
    expect(helper.indexOf("if (!storageResult.completed)")).toBeLessThan(helper.indexOf("deleteSignedInUserCloudApplicationData"));
    expect(helper.indexOf("if (!appDataResult.success)")).toBeLessThan(helper.indexOf("auth.admin.deleteUser"));
  });

  it("returns safe metadata without private Storage paths", () => {
    const helper = source("lib/account-full-deletion.ts");
    const route = source("app/api/account/delete/route.ts");

    expect(helper).toContain("ownedPhotoCount");
    expect(helper).toContain("deletedCount");
    expect(helper).toContain("storageCleanupQueuedCount");
    expect(helper).not.toContain("queuedPhotoPaths,");
    expect(route).not.toContain("queuedPhotoPaths");
    expect(route).not.toMatch(/access_token|refresh_token|signedUrl|createSignedUrl/i);
  });

  it("preserves public admin configuration and avoids cross-user or name-matched deletion", () => {
    const helper = source("lib/account-full-deletion.ts");
    const appDataHelper = source("lib/account-data-deletion.ts");

    expect(appDataHelper).toContain("adminPublicConfiguration");
    expect(appDataHelper).toContain("Public theme campaigns and sound settings");
    expect(helper).not.toMatch(/theme_campaigns|bake_timer_sound_theme_settings|guest_name|title\.ilike|name.*delete/i);
    expect(helper).toContain(".eq(\"user_id\", userId)");
    expect(helper).toContain("extractOwnedPizzaSessionPhotoPaths");
  });
});
