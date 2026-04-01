import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-server";

const classificationSchema = z.object({
  title: z.string().describe("Concise, factual title for the threat report"),
  summary: z
    .string()
    .describe("2-3 sentence executive summary of the threat"),
  threat_level: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum([
    "vulnerability",
    "malware",
    "ransomware",
    "data-breach",
    "apt",
    "zero-day",
    "supply-chain",
    "phishing",
    "insider-threat",
    "ddos",
  ]),
  cves: z.array(z.string()).describe("CVE IDs mentioned (e.g. CVE-2026-1234)"),
  affected_products: z
    .array(z.string())
    .describe("Affected software/hardware products"),
  threat_actors: z
    .array(z.string())
    .describe("Named threat actor groups if identified"),
  industries: z
    .array(
      z.enum([
        "healthcare",
        "finance",
        "government",
        "energy",
        "retail",
        "technology",
        "education",
        "defense",
        "telecommunications",
        "manufacturing",
      ])
    )
    .describe("Industries affected or targeted"),
  attack_vector: z.string().describe("How the attack is carried out"),
  tags: z.array(z.string()).describe("3-8 relevant keyword tags"),
  region: z.string().describe("Geographic scope (e.g. Global, United States, Europe)"),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.INGEST_API_KEY;
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { raw_text, source, source_url } = body;

  if (!raw_text) {
    return NextResponse.json(
      { error: "raw_text is required" },
      { status: 400 }
    );
  }

  const { output: classification } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema: classificationSchema }),
    prompt: `You are a cybersecurity threat intelligence analyst. Analyze the following raw threat intelligence text and classify it into a structured report.

Be factual and professional. Do not speculate. Use the exact threat actor names as they are commonly known (e.g. "APT29", "LockBit", "Volt Typhoon").

For threat_level:
- critical: Active exploitation of critical infrastructure, CVSS 9.0+, mass exploitation, major data breach
- high: Active exploitation, CVSS 7.0-8.9, targeted campaigns, significant impact
- medium: Known vulnerability without widespread exploitation, emerging threats
- low: Informational, guidance, low-impact issues

Raw intelligence text:
${raw_text}`,
  });

  if (!classification) {
    return NextResponse.json(
      { success: false, error: "AI classification failed to produce output" },
      { status: 500 }
    );
  }

  const slug = slugify(classification.title);

  // Check for duplicate
  const { data: existing } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({
      success: false,
      error: "Article with similar title already exists",
      slug,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert({
      title: classification.title,
      slug,
      summary: classification.summary,
      content: raw_text,
      threat_level: classification.threat_level,
      category: classification.category,
      cves: classification.cves,
      affected_products: classification.affected_products,
      threat_actors: classification.threat_actors,
      industries: classification.industries,
      attack_vector: classification.attack_vector,
      tags: classification.tags,
      region: classification.region,
      source: source || "Manual Submission",
      source_url: source_url || "",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      verified: false,
      verified_by: [],
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    article: data,
    classification: {
      threat_level: classification.threat_level,
      category: classification.category,
      cves: classification.cves,
      threat_actors: classification.threat_actors,
      industries: classification.industries,
    },
  });
}
