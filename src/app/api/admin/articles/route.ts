import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await getSupabaseAdmin()
    .from("articles")
    .insert(body)
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, article: data });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  const { error } = await getSupabaseAdmin()
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
