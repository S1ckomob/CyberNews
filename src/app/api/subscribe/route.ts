import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Upsert — if they unsubscribed before, reactivate
  const { error } = await supabase
    .from("subscribers")
    .upsert(
      { email: email.toLowerCase().trim(), active: true, subscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Subscribed to daily briefing" });
}
