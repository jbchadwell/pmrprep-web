import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Missing Supabase server env vars (URL or service role key)" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(`
      id,
      quiz_attempt_id,
      title,
      mode,
      status,
      current_index,
      total_questions,
      correct_count,
      answered_count,
      percent_correct,
      created_at
    `)
    .or(`session_id.eq.${sessionId},anon_session_id.eq.${sessionId}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const attempts = (data ?? []).map((row: any) => ({
    attemptId: row.id ?? row.quiz_attempt_id,
    title: row.title ?? "Quiz",
    mode: row.mode ?? "random",
    status: row.status ?? "in_progress",
    currentIndex: row.current_index ?? 0,
    totalQuestions: row.total_questions ?? 0,
    correctCount: row.correct_count ?? 0,
    answeredCount: row.answered_count ?? 0,
    percentCorrect: row.percent_correct ?? 0,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ attempts });
}
