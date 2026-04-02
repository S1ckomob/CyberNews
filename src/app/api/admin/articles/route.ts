import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_FIELDS = new Set([
  "title", "slug", "summary", "content", "threat_level", "category",
  "cves", "affected_products", "threat_actors", "industries",
  "attack_vector", "source", "source_url", "published_at", "updated_at",
  "verified", "verified_by", "tags", "region",
]);

const VALID_THREAT_LEVELS = new Set(["critical", "high", "medium", "low"]);

export async function POST(request: NextRequest) {
  const rateLimitError = await rateLimit(request, "sensitive");
  if (rateLimitError) return rateLimitError;

  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.title || typeof body.title !== "string" || body.title.length > 500) {
    return NextResponse.json({ error: "title is required (max 500 chars)" }, { status: 400 });
  }
  if (!body.slug || typeof body.slug !== "string" || body.slug.length > 200) {
    return NextResponse.json({ error: "slug is required (max 200 chars)" }, { status: 400 });
  }
  if (body.threat_level && !VALID_THREAT_LEVELS.has(body.threat_level as string)) {
    return NextResponse.json({ error: "Invalid threat_level" }, { status: 400 });
  }

  // Strip unknown fields
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      sanitized[key] = value;
    }
  }

  const { data, error } = await getSupabaseAdmin()
    .from("articles")
    .insert(sanitized)
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logAudit(request, "article.create", { slug: data?.slug, title: body.title });

  return NextResponse.json({ success: true, article: data });
}

export async function DELETE(request: NextRequest) {
  const rateLimitError = await rateLimit(request, "sensitive");
  if (rateLimitError) return rateLimitError;

  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required and must be a string" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logAudit(request, "article.delete", { id });

  return NextResponse.json({ success: true });
}
