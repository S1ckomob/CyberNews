import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * Health check endpoint — returns status of data freshness.
 * Monitor this with UptimeRobot or similar service.
 * Returns 200 if data is fresh, 503 if stale.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Get the most recent article
    const { data, error } = await supabase
      .from("articles")
      .select("published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { status: "error", message: "Cannot reach database" },
        { status: 503 }
      );
    }

    const lastIngested = new Date(data.created_at);
    const now = new Date();
    const minutesSinceLastIngest = Math.floor((now.getTime() - lastIngested.getTime()) / 60000);

    // Alert if no new data in 15 minutes (cron runs every 5)
    const isStale = minutesSinceLastIngest > 15;

    return NextResponse.json(
      {
        status: isStale ? "stale" : "healthy",
        lastIngest: lastIngested.toISOString(),
        minutesAgo: minutesSinceLastIngest,
        message: isStale
          ? `No new data in ${minutesSinceLastIngest} minutes — cron may have stopped`
          : `Data is fresh — last ingest ${minutesSinceLastIngest}m ago`,
      },
      { status: isStale ? 503 : 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: (err as Error).message },
      { status: 503 }
    );
  }
}
