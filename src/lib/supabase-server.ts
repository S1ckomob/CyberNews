import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialized to avoid crashing at build time when env vars aren't available
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}
