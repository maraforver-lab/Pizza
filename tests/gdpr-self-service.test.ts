import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { trustPages } from "@/lib/trust-pages";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function privacyText() {
  return [
    trustPages.privacy.lastUpdated ?? "",
    ...(trustPages.privacy.summary?.flatMap((item) => [item.title, item.body]) ?? []),
    ...trustPages.privacy.sections.flatMap((section) => [
      section.heading,
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
    ]),
  ].join("\n");
}

function fullDeletionFunctionSource() {
  const helper = source("lib/account-full-deletion.ts");
  return helper.slice(helper.indexOf("export async function deleteSignedInUserAccount"));
}

describe("GDPR self-service safeguards", () => {
  it("blocks signed-out export and deletion requests", () => {
    const exportRoute = source("app/api/account/export/route.ts");
    const deleteRoute = source("app/api/account/delete/route.ts");

    expect(exportRoute).toContain("supabase.auth.getUser()");
    expect(exportRoute).toContain("Sign in to download your data.");
    expect(exportRoute).toContain("{ status: 401 }");
    expect(deleteRoute).toContain("supabase.auth.getUser()");
    expect(deleteRoute).toContain("Sign in to delete your DoughTools account.");
    expect(deleteRoute).toContain("{ status: 401 }");
  });

  it("ignores client-supplied user IDs for export and deletion", () => {
    const exportRoute = source("app/api/account/export/route.ts");
    const deleteRoute = source("app/api/account/delete/route.ts");
    const deletionHelper = source("lib/account-full-deletion.ts");

    expect(exportRoute).not.toContain("request.json");
    expect(deleteRoute).not.toContain("request.json");
    expect(exportRoute).not.toMatch(/userId|user_id.*request/i);
    expect(deleteRoute).not.toMatch(/userId|user_id.*request/i);
    expect(deletionHelper).toContain("user: User");
    expect(deletionHelper).toContain("user.id");
  });

  it("keeps cross-user export and deletion owner-scoped", () => {
    const exportHelper = source("lib/account-data-export.ts");
    const deletionHelper = source("lib/account-data-deletion.ts");
    const fullDeletionHelper = source("lib/account-full-deletion.ts");

    expect(exportHelper).toContain(".eq(\"user_id\", user.id)");
    expect(exportHelper).toContain(".in(\"party_order_id\", partyOrderIds)");
    expect(exportHelper).toContain(".in(\"submission_id\", submissionIds)");
    expect(deletionHelper).toContain(".eq(\"user_id\", user.id)");
    expect(deletionHelper).toContain(".eq(\"role\", \"basic\")");
    expect(fullDeletionHelper).toContain(".eq(\"user_id\", userId)");
    expect(fullDeletionHelper).toContain("extractOwnedPizzaSessionPhotoPaths");
    expect(fullDeletionHelper).not.toMatch(/guest_name|title\.ilike|name.*delete/i);
  });

  it("blocks admin self-deletion and prevents Auth deletion after critical failures", () => {
    const fullDeletionHelper = fullDeletionFunctionSource();

    expect(fullDeletionHelper).toContain("ACCOUNT_ADMIN_SELF_DELETION_ERROR");
    expect(fullDeletionHelper).toContain("role === \"admin\"");
    expect(fullDeletionHelper).toContain("blockedReason: \"adminRole\"");
    expect(fullDeletionHelper).toContain("if (!storageResult.completed)");
    expect(fullDeletionHelper).toContain("if (!appDataResult.success)");
    expect(fullDeletionHelper.indexOf("if (!storageResult.completed)")).toBeLessThan(fullDeletionHelper.indexOf("deleteSignedInUserCloudApplicationData({ user, serviceSupabase })"));
    expect(fullDeletionHelper.indexOf("if (!appDataResult.success)")).toBeLessThan(fullDeletionHelper.indexOf("auth.admin.deleteUser"));
  });

  it("excludes sensitive tokens and private Party Order tokens from exports and full-delete responses", () => {
    const exportHelper = source("lib/account-data-export.ts");
    const fullDeletionHelper = source("lib/account-full-deletion.ts");
    const deleteRoute = source("app/api/account/delete/route.ts");

    expect(exportHelper).toContain("\"public_token\"");
    expect(exportHelper).toContain("\"edit_token\"");
    expect(exportHelper).toContain("\"access_token\"");
    expect(exportHelper).toContain("\"refresh_token\"");
    expect(exportHelper).toContain("\"signedUrl\"");
    expect(fullDeletionHelper).not.toContain("queuedPhotoPaths,");
    expect(deleteRoute).not.toContain("queuedPhotoPaths");
    expect(`${fullDeletionHelper}\n${deleteRoute}`).not.toMatch(/access_token|refresh_token|public_token|edit_token|createSignedUrl/i);
  });

  it("keeps Settings wording aligned with actual export and deletion behavior", () => {
    const exportCard = source("components/account/AccountDataExportCard.tsx");
    const deleteCard = source("components/account/AccountDeleteAccountCard.tsx");
    const cleanup = source("components/account/account-local-data-cleanup.ts");

    expect(exportCard).toContain("Download my data");
    expect(exportCard).toContain("related guest submissions for orders you own");
    expect(exportCard).toContain("private Party Order tokens");
    expect(deleteCard).toContain("owned Review photos");
    expect(deleteCard).toContain("Public admin-created configuration is not deleted");
    expect(deleteCard).toContain("Admin accounts cannot use self-service deletion");
    expect(deleteCard).toContain("Backups may retain data for a limited period according to the Privacy Policy");
    expect(deleteCard).toContain("After success, this browser clears known DoughTools-owned local app data only");
    expect(cleanup).not.toMatch(/localStorage\.clear|sessionStorage\.clear|document\.cookie|indexedDB/i);
  });

  it("updates Privacy Policy for self-service export, deletion and retention limitations", () => {
    const privacy = privacyText();

    expect(trustPages.privacy.lastUpdated).toBe("23 July 2026");
    expect(privacy).toContain("Download my data");
    expect(privacy).toContain("Delete my account");
    expect(privacy).toContain("owned Review photos are removed from Supabase Storage before");
    expect(privacy).toContain("owned Party Orders, related guest submissions and items");
    expect(privacy).toContain("does not delete guest data by name matching");
    expect(privacy).toContain("deletes the Supabase Auth account after required cleanup succeeds");
    expect(privacy).toContain("clears known DoughTools-owned local app data from the current browser");
    expect(privacy).toContain("Admin-role accounts are blocked from self-service deletion");
    expect(privacy).toContain("backups, provider logs, build/runtime logs, support emails, security records, and infrastructure retention");
  });

  it("adds an operational runbook for safe support handling", () => {
    const runbookPath = "docs/runbooks/account-data-export-and-deletion.md";
    expect(existsSync(join(process.cwd(), runbookPath))).toBe(true);
    const runbook = source(runbookPath);

    expect(runbook).toContain("Export Verification");
    expect(runbook).toContain("Deletion Order");
    expect(runbook).toContain("Admin Self-Deletion Block");
    expect(runbook).toContain("Partial-Failure Handling");
    expect(runbook).toContain("Safe retry procedure");
    expect(runbook).toContain("Storage Orphan Checks");
    expect(runbook).toContain("Never accept a user ID from the browser");
    expect(runbook).toContain("Do not delete by user ID guesswork");
    expect(runbook).toContain("Do not delete Party Order guest data by guest name matching");
    expect(runbook).not.toMatch(/service-role key:\s*\S+|access token:\s*\S+|refresh token:\s*\S+|password:\s*\S+/i);
  });
});
