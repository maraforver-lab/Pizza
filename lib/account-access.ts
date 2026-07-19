export const ACCOUNT_AUTH_CALLBACK_PATH = "/auth/callback";
export const ACCOUNT_RECOVERY_NEXT_PATH = "/auth/update-password";
export const ACCOUNT_PASSWORD_MIN_LENGTH = 8;

export type EmailValidationResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export type PasswordValidationResult =
  | { ok: true }
  | { ok: false; error: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAccountEmail(value: string) {
  return value.trim();
}

export function validateAccountEmail(value: string): EmailValidationResult {
  const email = normalizeAccountEmail(value);
  if (!email) return { ok: false, error: "Enter your email address." };
  if (!emailPattern.test(email)) return { ok: false, error: "Enter a valid email address." };
  return { ok: true, email };
}

export function validateNewAccountEmail(value: string, currentEmail?: string | null): EmailValidationResult {
  const result = validateAccountEmail(value);
  if (!result.ok) return result;
  if (currentEmail && result.email.localeCompare(currentEmail, undefined, { sensitivity: "accent" }) === 0) {
    return { ok: false, error: "Enter a different email address." };
  }
  return result;
}

export function validateAccountPasswordUpdate(password: string, confirmation: string): PasswordValidationResult {
  if (password.length < ACCOUNT_PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Use at least ${ACCOUNT_PASSWORD_MIN_LENGTH} characters.` };
  }
  if (password !== confirmation) {
    return { ok: false, error: "The passwords do not match." };
  }
  return { ok: true };
}

export function safeInternalAuthPath(value: string | null | undefined, fallback = "/account") {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return fallback;
  return candidate;
}

export function authCallbackRedirectTo(origin: string, nextPath: string) {
  const url = new URL(ACCOUNT_AUTH_CALLBACK_PATH, origin);
  url.searchParams.set("next", safeInternalAuthPath(nextPath));
  return url.toString();
}

export function appendAuthResult(path: string, key: "authError" | "confirmed", value: string) {
  const url = new URL(safeInternalAuthPath(path), "https://doughtools.invalid");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}
