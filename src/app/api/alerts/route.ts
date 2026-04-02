import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

// Save or update alert rules
export async function POST(request: NextRequest) {
  const { email, products, actors, severity } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("alert_rules")
    .upsert(
      {
        email: email.toLowerCase().trim(),
        products: products || [],
        actors: actors || [],
        severity: severity || ["critical", "high"],
        active: true,
      },
      { onConflict: "email" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also subscribe them to the newsletter
  await supabase
    .from("subscribers")
    .upsert(
      { email: email.toLowerCase().trim(), active: true, subscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  return NextResponse.json({ success: true, message: "Alert rules saved" });
}

// Get alert rules for an email
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  return NextResponse.json({ rules: data || null });
}
