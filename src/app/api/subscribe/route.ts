import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isValidEmail } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

const VALID_CATEGORIES = [
  "vulnerability", "malware", "ransomware", "data-breach", "apt",
  "zero-day", "supply-chain", "phishing", "insider-threat", "ddos", "ai",
];

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

  const { email, categories, severity, products } = body as {
    email?: string;
    categories?: string[];
    severity?: string[];
    products?: string[];
  };

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Validate categories if provided
  if (categories && (!Array.isArray(categories) || categories.some((c) => !VALID_CATEGORIES.includes(c)))) {
    return NextResponse.json({ error: "Invalid categories" }, { status: 400 });
  }

  const validSeverities = ["critical", "high", "medium", "low"];
  if (severity && (!Array.isArray(severity) || severity.some((s) => !validSeverities.includes(s)))) {
    return NextResponse.json({ error: "Invalid severity levels" }, { status: 400 });
  }
  if (products && (!Array.isArray(products) || products.length > 50)) {
    return NextResponse.json({ error: "products must be an array (max 50)" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = getSupabaseAdmin();

  // Upsert subscriber — if they unsubscribed before, reactivate
  const { error } = await supabase
    .from("subscribers")
    .upsert(
      { email: normalizedEmail, active: true, subscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-create alert rules if any preferences provided
  if ((categories && categories.length > 0) || (severity && severity.length > 0) || (products && products.length > 0)) {
    await supabase
      .from("alert_rules")
      .upsert(
        {
          email: normalizedEmail,
          products: products || [],
          actors: [],
          severity: severity || ["critical", "high"],
          categories: categories || [],
          active: true,
        },
        { onConflict: "email" }
      );
  }

  logAudit(request, "subscriber.add", { email: normalizedEmail, categories, severity, products });

  return NextResponse.json({ success: true, message: "Subscribed to daily briefing" });
}
