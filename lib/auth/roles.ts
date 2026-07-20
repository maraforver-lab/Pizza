export const APP_ROLES = ["basic", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const DEFAULT_APP_ROLE: AppRole = "basic";
export const ADMIN_APP_ROLE: AppRole = "admin";
export const APP_ROLE_CLAIM = "user_role";

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

export function normalizeAppRole(value: unknown): AppRole {
  return isAppRole(value) ? value : DEFAULT_APP_ROLE;
}

export function isAdminRole(value: unknown): value is typeof ADMIN_APP_ROLE {
  return normalizeAppRole(value) === ADMIN_APP_ROLE;
}

export function appRoleFromJwtClaims(claims: unknown): AppRole {
  if (!claims || typeof claims !== "object") return DEFAULT_APP_ROLE;
  return normalizeAppRole((claims as Record<string, unknown>)[APP_ROLE_CLAIM]);
}

function decodeBase64UrlJson(value: string): unknown {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");

  if (typeof atob === "function") {
    return JSON.parse(atob(padded));
  }

  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

export function appRoleFromAccessToken(accessToken: unknown): AppRole {
  if (typeof accessToken !== "string") return DEFAULT_APP_ROLE;
  const [, payload] = accessToken.split(".");
  if (!payload) return DEFAULT_APP_ROLE;

  try {
    return appRoleFromJwtClaims(decodeBase64UrlJson(payload));
  } catch {
    return DEFAULT_APP_ROLE;
  }
}
