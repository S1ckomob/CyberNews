import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdminAuth } from "@/lib/api-auth";
import { ALL_THREAT_ACTORS } from "@/lib/threat-actors-list";
import { logAudit } from "@/lib/audit";

/**
 * One-time endpoint to re-scan all articles against the expanded threat actor list.
 * POST /api/admin/retag-actors
 */
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();

  // Fetch all articles with their text content
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, summary, content, threat_actors");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ success: true, message: "No articles to retag", updated: 0 });
  }

  let updated = 0;
  let newActorsFound = 0;

  for (const article of articles) {
    const text = `${article.title} ${article.summary} ${article.content}`.toLowerCase();
    const detectedActors = ALL_THREAT_ACTORS.filter((actor) =>
      text.includes(actor.toLowerCase())
    );

    // Merge with existing actors (preserve any manually added ones)
    const existingActors: string[] = article.threat_actors || [];
    const merged = [...new Set([...existingActors, ...detectedActors])];

    // Only update if we found new actors
    if (merged.length > existingActors.length) {
      const { error: updateError } = await supabase
        .from("articles")
        .update({ threat_actors: merged })
        .eq("id", article.id);

      if (!updateError) {
        updated++;
        newActorsFound += merged.length - existingActors.length;
      }
    }
  }

  logAudit(request, "article.create", {
    action: "retag-actors",
    articlesScanned: articles.length,
    articlesUpdated: updated,
    newActorsFound,
  });

  return NextResponse.json({
    success: true,
    scanned: articles.length,
    updated,
    newActorsFound,
    actorListSize: ALL_THREAT_ACTORS.length,
  });
}
