import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    _supabase = createClient<Database>(url, key);
  }
  return _supabase;
}

// Keep backward-compatible export for client components that import `supabase` directly
export const supabase = typeof window !== "undefined"
  ? getSupabase()
  : (null as unknown as ReturnType<typeof createClient<Database>>);

export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type ThreatActorRow = Database["public"]["Tables"]["threat_actors"]["Row"];
