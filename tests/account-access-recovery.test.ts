import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_RECOVERY_NEXT_PATH,
  appendAuthResult,
  authCallbackRedirectTo,
  safeInternalAuthPath,
  validateAccountEmail,
  validateAccountPasswordUpdate,
  validateNewAccountEmail,
} from "@/lib/account-access";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Patch 442 account access and recovery", () => {
  it("uses one safe internal redirect helper for auth callback URLs", () => {
    expect(safeInternalAuthPath("/account")).toBe("/account");
    expect(safeInternalAuthPath("/auth/update-password")).toBe(ACCOUNT_RECOVERY_NEXT_PATH);
    expect(safeInternalAuthPath("https://example.com")).toBe("/account");
    expect(safeInternalAuthPath("//example.com")).toBe("/account");
    expect(safeInternalAuthPath("/\\evil")).toBe("/account");
    expect(authCallbackRedirectTo("https://www.doughtools.app", ACCOUNT_RECOVERY_NEXT_PATH)).toBe(
      "https://www.doughtools.app/auth/callback?next=%2Fauth%2Fupdate-password",
    );
    expect(appendAuthResult("/auth/update-password", "authError", "recovery")).toBe("/auth/update-password?authError=recovery");
  });

  it("validates account email and password inputs without rewriting addresses beyond trimming", () => {
    expect(validateAccountEmail(" user+test@example.com ")).toEqual({ ok: true, email: "user+test@example.com" });
    expect(validateAccountEmail("bad-address")).toEqual({ ok: false, error: "Enter a valid email address." });
    expect(validateNewAccountEmail("same@example.com", "same@example.com")).toEqual({ ok: false, error: "Enter a different email address." });
    expect(validateAccountPasswordUpdate("short", "short")).toEqual({ ok: false, error: "Use at least 8 characters." });
    expect(validateAccountPasswordUpdate("long-enough", "different")).toEqual({ ok: false, error: "The passwords do not match." });
    expect(validateAccountPasswordUpdate("long-enough", "long-enough")).toEqual({ ok: true });
  });

  it("adds local-scope sign out and preserves DoughTools local-first storage", () => {
    const accountPage = source("app/account/page.tsx");
    const cloudClient = source("lib/cloud-pizza-session-client.ts");

    expect(accountPage).toContain('supabase.auth.signOut({ scope: "local" })');
    expect(accountPage).toContain("if (error) {");
    expect(accountPage).toContain("setUser(null);");
    expect(accountPage).not.toContain("localStorage.clear");
    expect(accountPage).not.toContain("clearActivePizzaSession()");
    expect(cloudClient).toContain("if (!auth.signedIn) return { skipped: true, reason: \"unauthenticated\" as const }");
  });

  it("wires forgot-password through the existing PKCE callback architecture", () => {
    const accountPage = source("app/account/page.tsx");
    const forgotClient = source("components/auth/ForgotPasswordClient.tsx");
    const callbackRoute = source("app/auth/callback/route.ts");

    expect(accountPage).toContain("Forgot password?");
    expect(accountPage).toContain('href="/auth/forgot-password"');
    expect(forgotClient).toContain("resetPasswordForEmail(validation.email, { redirectTo })");
    expect(forgotClient).toContain("authCallbackRedirectTo(location.origin, ACCOUNT_RECOVERY_NEXT_PATH)");
    expect(forgotClient).toContain("If an account exists for this email address");
    expect(callbackRoute).toContain("exchangeCodeForSession(code)");
    expect(callbackRoute).toContain("safeInternalAuthPath(requestedNext, \"/account\")");
    expect(callbackRoute).toContain("ACCOUNT_RECOVERY_NEXT_PATH");
    expect(callbackRoute).not.toMatch(/verifyOtp|token_hash/);
  });

  it("adds update-password states without rendering raw provider tokens", () => {
    const page = source("app/auth/update-password/page.tsx");
    const client = source("components/auth/UpdatePasswordClient.tsx");

    expect(page).toContain("noindexMetadata");
    expect(client).toContain("Checking your recovery link");
    expect(client).toContain("supabase.auth.getSession()");
    expect(client).toContain("PASSWORD_RECOVERY");
    expect(client).toContain("supabase.auth.updateUser({ password })");
    expect(client).toContain("New password");
    expect(client).toContain("Confirm new password");
    expect(client).not.toMatch(/prompt\(|alert\(|token_hash|access_token|refresh_token/);
  });

  it("adds self-service email change without optimistic confirmed-email replacement", () => {
    const accountPage = source("app/account/page.tsx");
    const component = source("components/account/AccountEmailAddressSettings.tsx");

    expect(accountPage).toContain("AccountEmailAddressSettings user={user}");
    expect(component).toContain("Confirmed email");
    expect(component).toContain("Change email address");
    expect(component).toContain("validateNewAccountEmail(newEmail, confirmedEmail)");
    expect(component).toContain("supabase.auth.updateUser(");
    expect(component).toContain("{ email: validation.email }");
    expect(component).toContain("emailRedirectTo: authCallbackRedirectTo(location.origin, \"/account\")");
    expect(component).toContain("Your current email remains active until Supabase completes the update.");
    expect(component).not.toContain("setConfirmedEmail");
  });

  it("keeps application ownership tied to immutable Supabase user ids", () => {
    const activeRoute = source("app/api/pizza-sessions/active/route.ts");
    const historyRoute = source("app/api/pizza-sessions/history/route.ts");
    const partyRoute = source("app/api/party-orders/route.ts");
    const accountPreferencesRoute = source("app/api/account/preferences/route.ts");

    expect(activeRoute).toContain('.eq("user_id", user.id)');
    expect(activeRoute).toContain(".insert({ ...payload, user_id: user.id");
    expect(historyRoute).toContain('.eq("user_id", user.id)');
    expect(partyRoute).toContain("user_id: user.id");
    expect(accountPreferencesRoute).toContain(".insert({ ...payload, user_id: user.id, created_at: updatedAt })");
  });
});
