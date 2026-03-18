import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  count: number;
  primaryCategories: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const count = Math.max(1, Math.min(body.count ?? 10, 100));
    const cats = (body.primaryCategories ?? []).filter(Boolean);

    if (cats.length === 0) {
      return NextResponse.json({ error: "No categories selected" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const svc = createClient(supabaseUrl, serviceKey);

    const { data, error } = await svc.rpc(
      "get_random_quiz_questions_by_primary_categories_safe",
      { cats, qty: count }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ questions: data ?? [] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error in /api/quiz/custom";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
