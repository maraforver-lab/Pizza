import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  deleteSignedInUserCloudApplicationData,
  extractOwnedPizzaSessionPhotoPaths,
  loadAccountDeletionUserRole,
  type AccountDataDeletionResult,
} from "@/lib/account-data-deletion";
import { PIZZA_SESSION_PHOTO_BUCKET } from "@/lib/pizza-session-photo";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const PIZZA_SESSIONS_PHOTO_SELECT = "id,user_id,session_data";

export const ACCOUNT_ADMIN_SELF_DELETION_ERROR =
  "Admin accounts cannot use self-service account deletion. Contact support so public product configuration can be reviewed first.";

export type FullAccountDeletionResult = {
  success: boolean;
  blockedReason?: "adminRole";
  error?: string;
  storage: {
    bucket: typeof PIZZA_SESSION_PHOTO_BUCKET;
    ownedPhotoCount: number;
    deletedCount: number;
    completed: boolean;
    skipped?: boolean;
    error?: string;
  };
  appData: {
    success: boolean;
    deletedCounts: AccountDataDeletionResult["deletedCounts"];
    completedCategories: AccountDataDeletionResult["completedCategories"];
    failedCategories: AccountDataDeletionResult["failedCategories"];
    preservedCategories: AccountDataDeletionResult["preservedCategories"];
    storageCleanupQueuedCount: number;
  } | null;
  auth: {
    deleted: boolean;
    completed: boolean;
    error?: string;
  };
};

type FullAccountDeletionOptions = {
  user: User;
  serviceSupabase?: SupabaseClient;
};

type OwnedPhotoPathResult = {
  completed: boolean;
  paths: string[];
  error?: string;
};

function baseResult(): FullAccountDeletionResult {
  return {
    success: false,
    storage: {
      bucket: PIZZA_SESSION_PHOTO_BUCKET,
      ownedPhotoCount: 0,
      deletedCount: 0,
      completed: false,
    },
    appData: null,
    auth: {
      deleted: false,
      completed: false,
    },
  };
}

function publicAppDataSummary(result: AccountDataDeletionResult): NonNullable<FullAccountDeletionResult["appData"]> {
  return {
    success: result.success,
    deletedCounts: result.deletedCounts,
    completedCategories: result.completedCategories,
    failedCategories: result.failedCategories,
    preservedCategories: result.preservedCategories,
    storageCleanupQueuedCount: result.storageCleanup.queuedPhotoPaths.length,
  };
}

export async function collectOwnedReviewPhotoPaths({
  serviceSupabase,
  userId,
}: {
  serviceSupabase: SupabaseClient;
  userId: string;
}): Promise<OwnedPhotoPathResult> {
  const { data, error } = await serviceSupabase
    .from("pizza_sessions")
    .select(PIZZA_SESSIONS_PHOTO_SELECT)
    .eq("user_id", userId);

  if (error) {
    return {
      completed: false,
      paths: [],
      error: "Review photo paths could not be prepared for deletion.",
    };
  }

  return {
    completed: true,
    paths: extractOwnedPizzaSessionPhotoPaths(Array.isArray(data) ? data : [], userId),
  };
}

async function deleteOwnedReviewPhotoStorageObjects({
  serviceSupabase,
  paths,
}: {
  serviceSupabase: SupabaseClient;
  paths: string[];
}): Promise<FullAccountDeletionResult["storage"]> {
  if (paths.length === 0) {
    return {
      bucket: PIZZA_SESSION_PHOTO_BUCKET,
      ownedPhotoCount: 0,
      deletedCount: 0,
      completed: true,
      skipped: true,
    };
  }

  const { data, error } = await serviceSupabase.storage
    .from(PIZZA_SESSION_PHOTO_BUCKET)
    .remove(paths);

  if (error) {
    return {
      bucket: PIZZA_SESSION_PHOTO_BUCKET,
      ownedPhotoCount: paths.length,
      deletedCount: 0,
      completed: false,
      error: "Review photos could not be deleted from Storage.",
    };
  }

  return {
    bucket: PIZZA_SESSION_PHOTO_BUCKET,
    ownedPhotoCount: paths.length,
    deletedCount: Array.isArray(data) ? data.length : paths.length,
    completed: true,
  };
}

export async function deleteSignedInUserAccount({
  user,
  serviceSupabase = getSupabaseServiceRoleClient(),
}: FullAccountDeletionOptions): Promise<FullAccountDeletionResult> {
  const result = baseResult();

  const role = await loadAccountDeletionUserRole(serviceSupabase, user.id);
  if (role === "admin") {
    return {
      ...result,
      blockedReason: "adminRole",
      error: ACCOUNT_ADMIN_SELF_DELETION_ERROR,
      storage: {
        ...result.storage,
        completed: true,
        skipped: true,
      },
    };
  }

  const photoPathResult = await collectOwnedReviewPhotoPaths({ serviceSupabase, userId: user.id });
  if (!photoPathResult.completed) {
    return {
      ...result,
      storage: {
        ...result.storage,
        completed: false,
        error: photoPathResult.error,
      },
      error: photoPathResult.error,
    };
  }

  const storageResult = await deleteOwnedReviewPhotoStorageObjects({
    serviceSupabase,
    paths: photoPathResult.paths,
  });
  if (!storageResult.completed) {
    return {
      ...result,
      storage: storageResult,
      error: storageResult.error,
    };
  }

  const appDataResult = await deleteSignedInUserCloudApplicationData({ user, serviceSupabase });
  const appData = publicAppDataSummary(appDataResult);
  if (!appDataResult.success) {
    return {
      ...result,
      storage: storageResult,
      appData,
      error: "DoughTools cloud data could not be fully deleted.",
    };
  }

  const { error: authError } = await serviceSupabase.auth.admin.deleteUser(user.id);
  if (authError) {
    return {
      ...result,
      storage: storageResult,
      appData,
      auth: {
        deleted: false,
        completed: false,
        error: "Supabase Auth account could not be deleted.",
      },
      error: "Supabase Auth account could not be deleted.",
    };
  }

  return {
    success: true,
    storage: storageResult,
    appData,
    auth: {
      deleted: true,
      completed: true,
    },
  };
}
