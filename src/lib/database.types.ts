export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string;
          content: string;
          threat_level: "critical" | "high" | "medium" | "low";
          category: string;
          cves: string[];
          affected_products: string[];
          threat_actors: string[];
          industries: string[];
          attack_vector: string;
          source: string;
          source_url: string;
          published_at: string;
          updated_at: string;
          discovered_at: string | null;
          exploited_at: string | null;
          patched_at: string | null;
          verified: boolean;
          verified_by: string[];
          tags: string[];
          region: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          summary: string;
          content: string;
          threat_level: "critical" | "high" | "medium" | "low";
          category: string;
          cves?: string[];
          affected_products?: string[];
          threat_actors?: string[];
          industries?: string[];
          attack_vector: string;
          source: string;
          source_url: string;
          published_at: string;
          updated_at?: string;
          discovered_at?: string | null;
          exploited_at?: string | null;
          patched_at?: string | null;
          verified?: boolean;
          verified_by?: string[];
          tags?: string[];
          region: string;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
      };
      threat_actors: {
        Row: {
          id: string;
          name: string;
          aliases: string[];
          origin: string;
          description: string;
          target_industries: string[];
          first_seen: string;
          last_active: string;
          ttps: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          aliases?: string[];
          origin: string;
          description: string;
          target_industries?: string[];
          first_seen: string;
          last_active: string;
          ttps?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["threat_actors"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      threat_level: "critical" | "high" | "medium" | "low";
    };
  };
}
