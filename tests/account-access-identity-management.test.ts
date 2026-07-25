import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Account access and identity management", () => {
  it("adds a signed-out forgot-password entry without changing the account workspace", () => {
    const accountPage = source("app/account/page.tsx");

    expect(accountPage).toContain("Forgot password?");
    expect(accountPage).toContain('href="/account/forgot-password"');
    expect(accountPage).toContain('mode === "login"');
    expect(accountPage).toContain("<AccountActivePizzaSessionCard enabled");
    expect(accountPage).toContain("<AccountPizzaSessionHistory enabled latestOnly");
    expect(accountPage).toContain("<PartyOrdersAccountEntryCard enabled");
  });

  it("implements a generic forgot-password request through Supabase Auth", () => {
    const route = source("app/account/forgot-password/page.tsx");
    const form = source("components/account/AccountForgotPasswordForm.tsx");
    const messages = source("components/account/account-access-messages.ts");

    expect(route).toContain("<AccountForgotPasswordForm />");
    expect(form).toContain("Reset your password");
    expect(form).toContain("Enter your account email and we&rsquo;ll send you a secure password-reset link.");
    expect(form).toContain("Send reset link");
    expect(form).toContain("Back to sign in");
    expect(form).toContain("supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo })");
    expect(form).toContain("/auth/callback?next=/account/reset-password");
    expect(messages).toContain("If an account exists for that email, a password-reset link has been sent.");
    expect(form).toContain("if (pending) return");
    expect(form).toContain("email.trim()");
    expect(form).not.toMatch(/localStorage|sessionStorage|console\.log|searchParams\.set\(\"email\"/);
  });

  it("implements password reset completion with invalid-link protection", () => {
    const route = source("app/account/reset-password/page.tsx");
    const form = source("components/account/AccountResetPasswordForm.tsx");
    const messages = source("components/account/account-access-messages.ts");

    expect(route).toContain("<AccountResetPasswordForm />");
    expect(form).toContain("Choose a new password");
    expect(form).toContain("Use at least 8 characters. Choose a password you do not use elsewhere.");
    expect(form).toContain("This password-reset link is invalid or expired.");
    expect(form).toContain("Request a new reset link");
    expect(form).toContain("Back to sign in");
    expect(form).toContain("supabase.auth.getSession()");
    expect(form).toContain('event === "PASSWORD_RECOVERY"');
    expect(form).toContain('recoveryState !== "ready"');
    expect(form).toContain("supabase.auth.updateUser({ password })");
    expect(form).toContain('autoComplete="new-password"');
    expect(form).toContain('minLength={8}');
    expect(form).toContain('setPassword("")');
    expect(form).toContain('setConfirmation("")');
    expect(messages).toContain("Your password has been updated.");
    expect(form).not.toMatch(/console\.log|localStorage|sessionStorage|access_token|refresh_token|token_hash/i);
  });

  it("replaces the security link with real signed-in email and password controls", () => {
    const securityPage = source("app/account/settings/security/page.tsx");
    const controls = source("components/account/AccountSecurityControls.tsx");
    const messages = source("components/account/account-access-messages.ts");

    expect(securityPage).toContain("<AccountSecurityControls />");
    expect(controls).toContain("Current account email");
    expect(controls).toContain("Change email address");
    expect(controls).toContain("Change password");
    expect(controls).toContain("Sign out");
    expect(controls).toContain("supabase.auth.getUser()");
    expect(controls).toContain("supabase.auth.updateUser(");
    expect(controls).toContain("{ email: nextEmail }");
    expect(controls).toContain("{ password: newPassword }");
    expect(controls).toContain("EMAIL_CHANGE_SENT_MESSAGE");
    expect(messages).toContain("Confirmation instructions have been sent. Your current email remains active until the change is confirmed.");
    expect(controls).toContain("Enter a different email address.");
    expect(controls).toContain("validatePasswordPair(newPassword, passwordConfirmation)");
    expect(controls).toContain('setNewPassword("")');
    expect(controls).toContain('setPasswordConfirmation("")');
    expect(controls).not.toContain("Change email or password");
  });

  it("preserves sign-out as session-only account access, not GDPR deletion", () => {
    const controls = source("components/account/AccountSecurityControls.tsx");
    const deleteCard = source("components/account/AccountDeleteAccountCard.tsx");

    expect(controls).toContain("supabase.auth.signOut()");
    expect(controls).toContain("browser-local pizza plans, recipes, notes and preferences remain");
    expect(controls).not.toMatch(/clearDoughToolsOwnedLocalData|localStorage\.clear|sessionStorage\.clear|indexedDB|fetch\(\"\/api\/account\/delete\"/);
    expect(deleteCard).toContain("clearDoughToolsOwnedLocalData()");
    expect(deleteCard).toContain('fetch("/api/account/delete", { method: "DELETE" })');
  });

  it("keeps auth callback redirects internal and supports recovery/security returns", () => {
    const callback = source("app/auth/callback/route.ts");

    expect(callback).toContain('requestedNext.startsWith("/") && !requestedNext.startsWith("//")');
    expect(callback).toContain('const fallbackNext = flowType === "recovery" ? "/account/reset-password" : "/account"');
    expect(callback).toContain('const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : fallbackNext');
    expect(callback).toContain('next === "/account/reset-password"');
    expect(callback).toContain('flowType === "recovery"');
    expect(callback).toContain('redirectUrl.searchParams.set("recovery", "1")');
    expect(callback).toContain('redirectUrl.searchParams.set("confirmed", "1")');
    expect(callback).toContain('/account/reset-password?authError=expired');
    expect(callback).not.toMatch(/NextResponse\.json|code.*message|error.*message/);

    const controls = source("components/account/AccountSecurityControls.tsx");
    expect(controls).toContain("/auth/callback?next=/account/settings/security");
  });

  it("documents the account-access flows without adding schema or workflow changes", () => {
    const docPath = "docs/audits/patch-465a-account-access-identity-management.md";
    const doc = source(docPath);
    const migrationFiles = readdirSync(join(process.cwd(), "supabase", "migrations"));

    expect(existsSync(join(process.cwd(), docPath))).toBe(true);
    expect(doc).toContain("Forgot-Password Request Flow");
    expect(doc).toContain("Recovery Callback Flow");
    expect(doc).toContain("Signed-In Password Change Flow");
    expect(doc).toContain("Email-Change Confirmation Flow");
    expect(doc).toContain("Enumeration Protection");
    expect(doc).toContain("Local-Data Preservation");
    expect(doc).toContain("GDPR deletion remains separate");
    expect(migrationFiles.filter((name) => name.includes("465a"))).toHaveLength(0);
  });
});
