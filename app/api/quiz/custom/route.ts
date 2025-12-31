import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type Body = {
  count: number;
  primaryCategories: string[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const count = Math.max(1, Math.min(body.count ?? 10, 100));
  const cats = (body.primaryCategories ?? []).filter(Boolean);

  if (cats.length === 0) {
    return NextResponse.json({ error: "No categories selected" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc(
    "get_random_questions_by_primary_categories",
    { cats, qty: count }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data ?? [] });
}
