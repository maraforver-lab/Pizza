import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeAppRole, type AppRole } from "@/lib/auth/roles";

export const ACCOUNT_DATA_EXPORT_FORMAT_VERSION = 1;
export const ACCOUNT_DATA_EXPORT_FILENAME_PREFIX = "doughtools-data-export";

const ACCOUNT_PREFERENCES_EXPORT_SELECT = "user_id,allow_early_timed_step_completion,bake_timer_sound_theme,created_at,updated_at";
const PIZZA_SESSIONS_EXPORT_SELECT = "id,user_id,status,title,current_step,session_data,created_at,updated_at,completed_at,archived_at";
const PARTY_ORDERS_EXPORT_SELECT = "id,user_id,title,pizza_datetime,orders_close_at,time_zone,guest_note,allowed_pizza_ids,status,created_at,updated_at";
const PARTY_ORDER_SUBMISSIONS_EXPORT_SELECT = "id,party_order_id,guest_name,guest_comment,created_at,updated_at";
const PARTY_ORDER_ITEMS_EXPORT_SELECT = "id,submission_id,pizza_id,pizza_name_snapshot,quantity,created_at";

const SENSITIVE_EXPORT_KEYS = new Set([
  "access_token",
  "accessToken",
  "refresh_token",
  "refreshToken",
  "token",
  "public_token",
  "publicToken",
  "edit_token",
  "editToken",
  "password",
  "password_hash",
  "passwordHash",
  "secret",
  "service_role",
  "serviceRole",
  "signed_url",
  "signedUrl",
  "url",
]);

type ExportRecord = Record<string, unknown>;

export type AccountDataExport = {
  formatVersion: typeof ACCOUNT_DATA_EXPORT_FORMAT_VERSION;
  exportedAt: string;
  account: {
    id: string;
    email: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    lastSignInAt: string | null;
  };
  role: {
    role: AppRole;
  };
  accountPreferences: unknown | null;
  pizzaPlans: unknown[];
  reviewPhotos: unknown[];
  partyOrders: unknown[];
  partyOrderGuestSubmissions: unknown[];
  partyOrderItems: unknown[];
};

function isRecord(value: unknown): value is ExportRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeAccountExportValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeAccountExportValue(item));
  if (!isRecord(value)) return value;

  const sanitized: ExportRecord = {};
  for (const [key, raw] of Object.entries(value)) {
    if (SENSITIVE_EXPORT_KEYS.has(key)) continue;
    sanitized[key] = sanitizeAccountExportValue(raw);
  }
  return sanitized;
}

function photoMetadataFromPizzaPlan(row: unknown) {
  if (!isRecord(row)) return undefined;
  const sessionData = row.session_data;
  if (!isRecord(sessionData)) return undefined;
  const photo = sessionData.photo;
  if (!isRecord(photo)) return undefined;

  return sanitizeAccountExportValue({
    pizzaPlanId: row.id,
    pizzaPlanStatus: row.status,
    pizzaPlanTitle: row.title,
    photo,
  });
}

function accountIdentity(user: User): AccountDataExport["account"] {
  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email : null,
    createdAt: typeof user.created_at === "string" ? user.created_at : null,
    updatedAt: typeof user.updated_at === "string" ? user.updated_at : null,
    lastSignInAt: typeof user.last_sign_in_at === "string" ? user.last_sign_in_at : null,
  };
}

async function loadCurrentUserRole(supabase: SupabaseClient): Promise<AppRole> {
  const { data, error } = await supabase.rpc("current_user_app_role");
  if (error) return "basic";
  return normalizeAppRole(data);
}

export async function assembleAccountDataExport({
  supabase,
  user,
  exportedAt = new Date().toISOString(),
}: {
  supabase: SupabaseClient;
  user: User;
  exportedAt?: string;
}): Promise<AccountDataExport> {
  const [
    role,
    preferencesResult,
    pizzaPlansResult,
    partyOrdersResult,
  ] = await Promise.all([
    loadCurrentUserRole(supabase),
    supabase
      .from("account_preferences")
      .select(ACCOUNT_PREFERENCES_EXPORT_SELECT)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("pizza_sessions")
      .select(PIZZA_SESSIONS_EXPORT_SELECT)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("party_orders")
      .select(PARTY_ORDERS_EXPORT_SELECT)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  if (preferencesResult.error) throw new Error("Account preferences could not be exported.");
  if (pizzaPlansResult.error) throw new Error("Pizza plans could not be exported.");
  if (partyOrdersResult.error) throw new Error("Party Orders could not be exported.");

  const pizzaPlans = Array.isArray(pizzaPlansResult.data) ? pizzaPlansResult.data : [];
  const partyOrders = Array.isArray(partyOrdersResult.data) ? partyOrdersResult.data : [];
  const partyOrderIds = partyOrders
    .map((order) => isRecord(order) && typeof order.id === "string" ? order.id : "")
    .filter(Boolean);

  let submissions: unknown[] = [];
  let items: unknown[] = [];
  if (partyOrderIds.length > 0) {
    const submissionsResult = await supabase
      .from("party_order_submissions")
      .select(PARTY_ORDER_SUBMISSIONS_EXPORT_SELECT)
      .in("party_order_id", partyOrderIds)
      .order("created_at", { ascending: false });

    if (submissionsResult.error) throw new Error("Party Order guest submissions could not be exported.");
    submissions = Array.isArray(submissionsResult.data) ? submissionsResult.data : [];

    const submissionIds = submissions
      .map((submission) => isRecord(submission) && typeof submission.id === "string" ? submission.id : "")
      .filter(Boolean);

    if (submissionIds.length > 0) {
      const itemsResult = await supabase
        .from("party_order_items")
        .select(PARTY_ORDER_ITEMS_EXPORT_SELECT)
        .in("submission_id", submissionIds)
        .order("created_at", { ascending: true });

      if (itemsResult.error) throw new Error("Party Order items could not be exported.");
      items = Array.isArray(itemsResult.data) ? itemsResult.data : [];
    }
  }

  return {
    formatVersion: ACCOUNT_DATA_EXPORT_FORMAT_VERSION,
    exportedAt,
    account: accountIdentity(user),
    role: { role },
    accountPreferences: sanitizeAccountExportValue(preferencesResult.data ?? null),
    pizzaPlans: sanitizeAccountExportValue(pizzaPlans) as unknown[],
    reviewPhotos: pizzaPlans.flatMap((row) => {
      const metadata = photoMetadataFromPizzaPlan(row);
      return metadata ? [metadata] : [];
    }),
    partyOrders: sanitizeAccountExportValue(partyOrders) as unknown[],
    partyOrderGuestSubmissions: sanitizeAccountExportValue(submissions) as unknown[],
    partyOrderItems: sanitizeAccountExportValue(items) as unknown[],
  };
}

export function accountDataExportFilename(now = new Date()) {
  return `${ACCOUNT_DATA_EXPORT_FILENAME_PREFIX}-${now.toISOString().slice(0, 10)}.json`;
}
