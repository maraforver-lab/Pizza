import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function supabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return { url, key };
}

export async function getSupabaseServerClient() {
  const { url, key } = supabaseEnvironment();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: cookiesToSet => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
}

function bearerTokenFromRequest(request: Request) {
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  const [scheme, token] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" && token ? token : undefined;
}

function getSupabaseBearerClient(request: Request) {
  const token = bearerTokenFromRequest(request);
  if (!token) return undefined;

  const { url, key } = supabaseEnvironment();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

type SupabaseRouteClientResolution = {
  supabase: SupabaseClient;
  user: User | null;
};

export async function getSupabaseRouteClient(request: Request): Promise<SupabaseRouteClientResolution> {
  const cookieClient = await getSupabaseServerClient();
  const cookieAuth = await cookieClient.auth.getUser();
  if (!cookieAuth.error && cookieAuth.data.user) {
    return { supabase: cookieClient, user: cookieAuth.data.user };
  }

  const bearerClient = getSupabaseBearerClient(request);
  if (!bearerClient) return { supabase: cookieClient, user: null };

  const bearerAuth = await bearerClient.auth.getUser();
  if (!bearerAuth.error && bearerAuth.data.user) {
    return { supabase: bearerClient, user: bearerAuth.data.user };
  }

  return { supabase: cookieClient, user: null };
}
