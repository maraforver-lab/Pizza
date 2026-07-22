import "server-only";

import { NextResponse } from "next/server";
import { adminGuardErrorResponse, requireAdminForRequest } from "@/lib/auth/admin";
import { normalizeAdminThemeCampaignRows, revalidatePublicThemeCache } from "@/lib/public-theme-campaigns";
import { isPublicThemeId, type PublicThemeId } from "@/lib/public-themes";

type AdminThemePayload = {
  themeId: PublicThemeId;
  startsAt: string;
  endsAt: string | null;
};

export type AdminThemeUpdatePayload = AdminThemePayload & {
  enabled: boolean;
  expectedVersion: number;
};

const CREATE_FIELDS = new Set(["themeId", "startsAt", "endsAt"]);
const UPDATE_FIELDS = new Set(["themeId", "enabled", "startsAt", "endsAt", "expectedVersion"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unknownFields(record: Record<string, unknown>, allowed: Set<string>) {
  return Object.keys(record).filter((key) => !allowed.has(key));
}

function validIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function parseCreateThemeCampaignPayload(value: unknown): { ok: true; payload: AdminThemePayload } | { ok: false; response: NextResponse } {
  if (!isRecord(value)) {
    return { ok: false, response: NextResponse.json({ error: "Invalid theme campaign payload." }, { status: 400 }) };
  }

  if (unknownFields(value, CREATE_FIELDS).length > 0) {
    return { ok: false, response: NextResponse.json({ error: "Theme campaign payload contains unsupported fields." }, { status: 400 }) };
  }

  if (!isPublicThemeId(value.themeId)) {
    return { ok: false, response: NextResponse.json({ error: "Unknown public theme." }, { status: 400 }) };
  }

  const startsAt = validIsoDate(value.startsAt);
  if (!startsAt) {
    return { ok: false, response: NextResponse.json({ error: "Invalid campaign start time." }, { status: 400 }) };
  }

  const endsAt = value.endsAt === null || value.endsAt === undefined ? null : validIsoDate(value.endsAt);
  if (value.endsAt !== null && value.endsAt !== undefined && !endsAt) {
    return { ok: false, response: NextResponse.json({ error: "Invalid campaign end time." }, { status: 400 }) };
  }

  if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { ok: false, response: NextResponse.json({ error: "Campaign end must be after the start time." }, { status: 400 }) };
  }

  return { ok: true, payload: { themeId: value.themeId, startsAt, endsAt } };
}

export function parseUpdateThemeCampaignPayload(value: unknown): { ok: true; payload: AdminThemeUpdatePayload } | { ok: false; response: NextResponse } {
  if (!isRecord(value)) {
    return { ok: false, response: NextResponse.json({ error: "Invalid theme campaign payload." }, { status: 400 }) };
  }

  if (unknownFields(value, UPDATE_FIELDS).length > 0) {
    return { ok: false, response: NextResponse.json({ error: "Theme campaign payload contains unsupported fields." }, { status: 400 }) };
  }

  const parsed = parseCreateThemeCampaignPayload({
    themeId: value.themeId,
    startsAt: value.startsAt,
    endsAt: value.endsAt,
  });
  if (!parsed.ok) return parsed;

  if (typeof value.enabled !== "boolean") {
    return { ok: false, response: NextResponse.json({ error: "Invalid campaign enabled state." }, { status: 400 }) };
  }

  if (!Number.isInteger(value.expectedVersion) || Number(value.expectedVersion) < 1) {
    return { ok: false, response: NextResponse.json({ error: "Invalid campaign version." }, { status: 400 }) };
  }

  return {
    ok: true,
    payload: {
      ...parsed.payload,
      enabled: value.enabled,
      expectedVersion: Number(value.expectedVersion),
    },
  };
}

export function safeThemeMutationError(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message ?? "";
  if (/theme_campaign_not_found/i.test(message)) {
    return NextResponse.json({ error: "Theme campaign not found." }, { status: 404 });
  }
  if (/theme_campaign_overlap/i.test(message)) {
    return NextResponse.json({ error: "That campaign overlaps another enabled seasonal campaign." }, { status: 409 });
  }
  if (/theme_campaign_stale/i.test(message)) {
    return NextResponse.json({ error: "Theme campaign changed on another device. Reload and try again.", stale: true }, { status: 409 });
  }
  if (/theme_campaign_invalid|invalid input syntax|check constraint/i.test(message)) {
    return NextResponse.json({ error: "Invalid theme campaign." }, { status: 400 });
  }
  if (/admin_activate_theme_now|Could not find the function|schema cache|PGRST202/i.test(message)) {
    return NextResponse.json({ error: "Theme activation is not available yet. Refresh and try again." }, { status: 503 });
  }
  return NextResponse.json({ error: "Theme campaign could not be saved." }, { status: 500 });
}

export async function requireAdminRequest(request: Request) {
  const admin = await requireAdminForRequest(request);
  if (!admin.authorized) return { ok: false as const, response: adminGuardErrorResponse(admin) };
  return { ok: true as const, admin };
}

export function themeCampaignsResponse(rows: unknown) {
  return { campaigns: normalizeAdminThemeCampaignRows(rows) };
}

export function mutationSuccessResponse(rows: unknown, status = 200) {
  revalidatePublicThemeCache();
  return NextResponse.json(themeCampaignsResponse(rows), { status });
}
