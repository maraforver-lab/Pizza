import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeAppRole, type AppRole } from "@/lib/auth/roles";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const PIZZA_SESSIONS_DELETION_SELECT = "id,user_id,session_data";
const PARTY_ORDERS_DELETION_SELECT = "id,user_id";
const PARTY_ORDER_SUBMISSIONS_DELETION_SELECT = "id,party_order_id";

export type AccountDataDeletionCategory =
  | "partyOrderItems"
  | "partyOrderGuestSubmissions"
  | "partyOrders"
  | "pizzaPlans"
  | "accountPreferences"
  | "userRole";

export type AccountDataDeletionCategoryResult = {
  category: AccountDataDeletionCategory;
  deletedCount: number;
  completed: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

export type AccountDataDeletionResult = {
  success: boolean;
  deletedCounts: Record<AccountDataDeletionCategory, number>;
  completedCategories: AccountDataDeletionCategory[];
  failedCategories: Array<{
    category: AccountDataDeletionCategory;
    error: string;
  }>;
  preservedCategories: Array<{
    category: string;
    reason: string;
  }>;
  storageCleanup: {
    pizzaSessionPhotoBucket: "pizza-session-photos";
    queuedPhotoPaths: string[];
  };
};

type AccountDataDeletionOptions = {
  user: User;
  serviceSupabase?: SupabaseClient;
};

type ExportRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ExportRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function emptyDeletedCounts(): Record<AccountDataDeletionCategory, number> {
  return {
    partyOrderItems: 0,
    partyOrderGuestSubmissions: 0,
    partyOrders: 0,
    pizzaPlans: 0,
    accountPreferences: 0,
    userRole: 0,
  };
}

function deletionResult({
  categories,
  preservedCategories,
  queuedPhotoPaths,
}: {
  categories: AccountDataDeletionCategoryResult[];
  preservedCategories: AccountDataDeletionResult["preservedCategories"];
  queuedPhotoPaths: string[];
}): AccountDataDeletionResult {
  const deletedCounts = emptyDeletedCounts();
  const completedCategories: AccountDataDeletionCategory[] = [];
  const failedCategories: AccountDataDeletionResult["failedCategories"] = [];

  for (const category of categories) {
    deletedCounts[category.category] += category.deletedCount;
    if (category.completed) completedCategories.push(category.category);
    if (category.error) failedCategories.push({ category: category.category, error: category.error });
  }

  return {
    success: failedCategories.length === 0,
    deletedCounts,
    completedCategories,
    failedCategories,
    preservedCategories,
    storageCleanup: {
      pizzaSessionPhotoBucket: "pizza-session-photos",
      queuedPhotoPaths,
    },
  };
}

export function extractOwnedPizzaSessionPhotoPaths(rows: unknown[], userId: string) {
  const prefix = `${userId}/`;
  const paths = new Set<string>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const sessionData = row.session_data;
    if (!isRecord(sessionData)) continue;
    const photo = sessionData.photo;
    if (!isRecord(photo)) continue;
    const path = typeof photo.path === "string" ? photo.path.trim() : "";
    if (path && path.startsWith(prefix)) paths.add(path);
  }

  return [...paths].sort();
}

export async function loadAccountDeletionUserRole(supabase: SupabaseClient, userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !isRecord(data)) return "basic";
  return normalizeAppRole(data.role);
}

function deletedCount(data: unknown) {
  return Array.isArray(data) ? data.length : 0;
}

function completed(category: AccountDataDeletionCategory, count = 0): AccountDataDeletionCategoryResult {
  return { category, deletedCount: count, completed: true };
}

function skipped(category: AccountDataDeletionCategory, reason: string): AccountDataDeletionCategoryResult {
  return { category, deletedCount: 0, completed: true, skipped: true, reason };
}

function failed(category: AccountDataDeletionCategory, error: string): AccountDataDeletionCategoryResult {
  return { category, deletedCount: 0, completed: false, error };
}

export async function deleteSignedInUserCloudApplicationData({
  user,
  serviceSupabase = getSupabaseServiceRoleClient(),
}: AccountDataDeletionOptions): Promise<AccountDataDeletionResult> {
  const categories: AccountDataDeletionCategoryResult[] = [];
  const preservedCategories: AccountDataDeletionResult["preservedCategories"] = [
    {
      category: "supabaseAuthUser",
      reason: "Auth account deletion is reserved for the later full account deletion patch.",
    },
    {
      category: "pizzaSessionPhotoStorageObjects",
      reason: "Storage objects are queued for Patch 371D cleanup and are not removed by this operation.",
    },
    {
      category: "adminPublicConfiguration",
      reason: "Public theme campaigns and sound settings are product configuration and are not deleted solely because they reference this user.",
    },
  ];

  const { data: pizzaRows, error: pizzaLoadError } = await serviceSupabase
    .from("pizza_sessions")
    .select(PIZZA_SESSIONS_DELETION_SELECT)
    .eq("user_id", user.id);
  const pizzaPlans = Array.isArray(pizzaRows) ? pizzaRows : [];
  const queuedPhotoPaths = pizzaLoadError ? [] : extractOwnedPizzaSessionPhotoPaths(pizzaPlans, user.id);

  const { data: partyRows, error: partyLoadError } = await serviceSupabase
    .from("party_orders")
    .select(PARTY_ORDERS_DELETION_SELECT)
    .eq("user_id", user.id);
  const partyOrderIds = Array.isArray(partyRows)
    ? partyRows.flatMap((row) => isRecord(row) && typeof row.id === "string" ? [row.id] : [])
    : [];

  let submissionIds: string[] = [];
  if (!partyLoadError && partyOrderIds.length > 0) {
    const { data: submissionRows, error: submissionLoadError } = await serviceSupabase
      .from("party_order_submissions")
      .select(PARTY_ORDER_SUBMISSIONS_DELETION_SELECT)
      .in("party_order_id", partyOrderIds);

    if (submissionLoadError) {
      categories.push(failed("partyOrderGuestSubmissions", "Party Order guest submissions could not be prepared for deletion."));
    } else {
      submissionIds = Array.isArray(submissionRows)
        ? submissionRows.flatMap((row) => isRecord(row) && typeof row.id === "string" ? [row.id] : [])
        : [];
    }
  }

  if (partyLoadError) {
    categories.push(failed("partyOrders", "Party Orders could not be prepared for deletion."));
  } else if (submissionIds.length > 0) {
    const { data, error } = await serviceSupabase
      .from("party_order_items")
      .delete()
      .in("submission_id", submissionIds)
      .select("id");

    categories.push(error
      ? failed("partyOrderItems", "Party Order items could not be deleted.")
      : completed("partyOrderItems", deletedCount(data)));
  } else {
    categories.push(skipped("partyOrderItems", "No owned Party Order items were present."));
  }

  const partyItemsFailed = categories.some((category) => category.category === "partyOrderItems" && category.error);
  const submissionsPrepared = !categories.some((category) => category.category === "partyOrderGuestSubmissions" && category.error);
  if (!partyLoadError && submissionsPrepared && !partyItemsFailed && submissionIds.length > 0) {
    const { data, error } = await serviceSupabase
      .from("party_order_submissions")
      .delete()
      .in("id", submissionIds)
      .select("id");

    categories.push(error
      ? failed("partyOrderGuestSubmissions", "Party Order guest submissions could not be deleted.")
      : completed("partyOrderGuestSubmissions", deletedCount(data)));
  } else if (!partyLoadError && submissionsPrepared && submissionIds.length === 0) {
    categories.push(skipped("partyOrderGuestSubmissions", "No owned Party Order guest submissions were present."));
  }

  const submissionsFailed = categories.some((category) => category.category === "partyOrderGuestSubmissions" && category.error);
  if (!partyLoadError && !partyItemsFailed && !submissionsFailed && partyOrderIds.length > 0) {
    const { data, error } = await serviceSupabase
      .from("party_orders")
      .delete()
      .eq("user_id", user.id)
      .select("id");

    categories.push(error
      ? failed("partyOrders", "Party Orders could not be deleted.")
      : completed("partyOrders", deletedCount(data)));
  } else if (!partyLoadError && partyOrderIds.length === 0) {
    categories.push(skipped("partyOrders", "No owned Party Orders were present."));
  }

  if (pizzaLoadError) {
    categories.push(failed("pizzaPlans", "Pizza plans could not be prepared for deletion."));
  } else {
    const { data, error } = await serviceSupabase
      .from("pizza_sessions")
      .delete()
      .eq("user_id", user.id)
      .select("id");

    categories.push(error
      ? failed("pizzaPlans", "Pizza plans could not be deleted.")
      : completed("pizzaPlans", deletedCount(data)));
  }

  const { data: preferenceRows, error: preferenceError } = await serviceSupabase
    .from("account_preferences")
    .delete()
    .eq("user_id", user.id)
    .select("user_id");
  categories.push(preferenceError
    ? failed("accountPreferences", "Account preferences could not be deleted.")
    : completed("accountPreferences", deletedCount(preferenceRows)));

  const role = await loadAccountDeletionUserRole(serviceSupabase, user.id);
  if (role === "admin") {
    categories.push(skipped("userRole", "Admin role rows are preserved until full account deletion can handle admin-authored public configuration."));
  } else {
    const { data, error } = await serviceSupabase
      .from("user_roles")
      .delete()
      .eq("user_id", user.id)
      .eq("role", "basic")
      .select("user_id");

    categories.push(error
      ? failed("userRole", "Basic user role row could not be deleted.")
      : completed("userRole", deletedCount(data)));
  }

  return deletionResult({
    categories,
    preservedCategories,
    queuedPhotoPaths,
  });
}
