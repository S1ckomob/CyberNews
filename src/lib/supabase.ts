import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      // During build, return a dummy client that returns empty results
      // Pages will be rendered dynamically at runtime with real data
      return createDummyClient();
    }
    _supabase = createClient<Database>(url, key);
  }
  return _supabase;
}

// For client components that import supabase directly
export const supabase =
  typeof window !== "undefined"
    ? getSupabase()
    : (null as unknown as ReturnType<typeof createClient<Database>>);

export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type ThreatActorRow = Database["public"]["Tables"]["threat_actors"]["Row"];

// Dummy client for build time — all queries return empty arrays
function createDummyClient() {
  const emptyResult = { data: [], error: null, count: null, status: 200, statusText: "OK" };
  const emptyRow = { data: null, error: null, count: null, status: 200, statusText: "OK" };

  const chainable: Record<string, unknown> = {};
  const methods = ["select", "eq", "contains", "order", "limit", "single", "filter", "neq", "in"];
  for (const m of methods) {
    chainable[m] = (..._args: unknown[]) => {
      if (m === "single") return Promise.resolve(emptyRow);
      return Object.assign(Promise.resolve(emptyResult), chainable);
    };
  }

  return {
    from: () => chainable,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    removeChannel: () => {},
  } as unknown as ReturnType<typeof createClient<Database>>;
}
