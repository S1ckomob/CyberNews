import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isValidEmail } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// Save or update alert rules
export async function POST(request: NextRequest) {
  const rateLimitError = await rateLimit(request, "public");
  if (rateLimitError) return rateLimitError;

  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, products, actors, severity, categories } = body as {
    email?: string;
    products?: string[];
    actors?: string[];
    severity?: string[];
    categories?: string[];
  };

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Validate array fields
  if (products && (!Array.isArray(products) || products.length > 50)) {
    return NextResponse.json({ error: "products must be an array (max 50)" }, { status: 400 });
  }
  if (actors && (!Array.isArray(actors) || actors.length > 50)) {
    return NextResponse.json({ error: "actors must be an array (max 50)" }, { status: 400 });
  }
  const validSeverities = ["critical", "high", "medium", "low"];
  if (severity && (!Array.isArray(severity) || severity.some((s) => !validSeverities.includes(s)))) {
    return NextResponse.json({ error: "severity must be an array of: critical, high, medium, low" }, { status: 400 });
  }
  const validCategories = ["vulnerability", "malware", "ransomware", "data-breach", "apt", "zero-day", "supply-chain", "phishing", "insider-threat", "ddos", "ai"];
  if (categories && (!Array.isArray(categories) || categories.some((c) => !validCategories.includes(c)))) {
    return NextResponse.json({ error: "Invalid categories" }, { status: 400 });
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
        categories: categories || [],
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

  logAudit(request, "alert_rules.update", { email: email.toLowerCase().trim() });

  return NextResponse.json({ success: true, message: "Alert rules saved" });
}

// Get alert rules for an email
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("alert_rules")
    .select("products, actors, severity, categories, active")
    .eq("email", email.toLowerCase().trim())
    .single();

  // Only return non-sensitive fields
  return NextResponse.json({ rules: data || null });
}
