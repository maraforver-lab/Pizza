import { createClient } from "@supabase/supabase-js";

function serviceRoleEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Supabase service-role environment variables are missing.");
  return { url, key };
}

export function getSupabaseServiceRoleClient() {
  const { url, key } = serviceRoleEnvironment();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
