import { NextResponse } from "next/server";
import {
  CLOUD_PIZZA_SESSION_SELECT,
  normalizeCloudPizzaSessionHistoryRow,
} from "@/lib/cloud-pizza-sessions";
import { createPizzaSession, migratePizzaSession, type PizzaSessionPhoto } from "@/lib/pizza-session";
import {
  isAcceptedPizzaSessionPhotoType,
  PIZZA_SESSION_PHOTO_BUCKET,
  PIZZA_SESSION_PHOTO_MAX_BYTES,
  PIZZA_SESSION_PHOTO_SIZE_ERROR,
  PIZZA_SESSION_PHOTO_TYPE_ERROR,
  PIZZA_SESSION_PHOTO_UPLOAD_ERROR,
  pizzaSessionPhotoExtension,
} from "@/lib/pizza-session-photo";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function rowWithSignedPizzaPhotoUrl(
  row: unknown,
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const record = row as Record<string, unknown>;
  const session = migratePizzaSession(record.session_data ?? record.sessionData);
  if (!session?.photo?.path) return row;

  const { data } = await supabase.storage
    .from(PIZZA_SESSION_PHOTO_BUCKET)
    .createSignedUrl(session.photo.path, 60 * 60);
  if (!data?.signedUrl) return row;

  return {
    ...record,
    session_data: {
      ...session,
      photo: {
        ...session.photo,
        url: data.signedUrl,
      },
    },
  };
}

function randomPhotoPath(userId: string, sessionId: string, contentType: string) {
  const extension = pizzaSessionPhotoExtension(contentType) ?? "jpg";
  const uniqueId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;
  return `${userId}/${sessionId}/${uniqueId}.${extension}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to upload a pizza photo." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: PIZZA_SESSION_PHOTO_UPLOAD_ERROR }, { status: 400 });
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: PIZZA_SESSION_PHOTO_UPLOAD_ERROR }, { status: 400 });
  }
  if (!isAcceptedPizzaSessionPhotoType(file.type)) {
    return NextResponse.json({ error: PIZZA_SESSION_PHOTO_TYPE_ERROR }, { status: 400 });
  }
  if (file.size > PIZZA_SESSION_PHOTO_MAX_BYTES) {
    return NextResponse.json({ error: PIZZA_SESSION_PHOTO_SIZE_ERROR }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("pizza_sessions")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  const existingSession = migratePizzaSession(existing?.session_data);
  if (!existingSession) return NextResponse.json({ error: "Completed pizza session not found." }, { status: 404 });

  const oldPhotoPath = existingSession.photo?.path;
  const path = randomPhotoPath(user.id, id, file.type);
  const { error: uploadError } = await supabase.storage
    .from(PIZZA_SESSION_PHOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return NextResponse.json({ error: PIZZA_SESSION_PHOTO_UPLOAD_ERROR }, { status: 500 });

  const uploadedAt = new Date().toISOString();
  const photo: PizzaSessionPhoto = {
    path,
    uploadedAt,
    contentType: file.type,
    size: file.size,
  };
  const sessionWithPhoto = createPizzaSession({
    ...existingSession,
    photo,
    updatedAt: uploadedAt,
  }, new Date(uploadedAt));

  const { data: updated, error: updateError } = await supabase
    .from("pizza_sessions")
    .update({
      session_data: sessionWithPhoto,
      updated_at: uploadedAt,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (oldPhotoPath && oldPhotoPath !== path) {
    await supabase.storage.from(PIZZA_SESSION_PHOTO_BUCKET).remove([oldPhotoPath]);
  }

  const session = normalizeCloudPizzaSessionHistoryRow(await rowWithSignedPizzaPhotoUrl(updated, supabase));
  if (!session) {
    return NextResponse.json({ error: "Uploaded pizza photo could not be verified." }, { status: 500 });
  }

  return NextResponse.json({ session, photo: migratePizzaSession(session.session_data)?.photo ?? null });
}
