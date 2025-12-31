import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AnswerRow = {
  questionId: string;
  questionUid?: string;
  primaryCategory?: string | null;
  selectedKey?: string;
  correctKey?: string;
  isCorrect?: boolean;
};

type Body = {
  sessionId: string;
  quizAttemptId: string;
  totalQuestions: number;
  correctCount: number;
  percentCorrect: number;
  answers: AnswerRow[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { error: attemptError } = await supabase
    .from("quiz_attempts")
    .upsert(
      {
        session_id: body.sessionId,
        quiz_attempt_id: body.quizAttemptId,
        total_questions: body.totalQuestions,
        correct_count: body.correctCount,
        percent_correct: body.percentCorrect,
      },
      { onConflict: "quiz_attempt_id" }
    );

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  const { error: delError } = await supabase
    .from("quiz_attempt_answers")
    .delete()
    .eq("quiz_attempt_id", body.quizAttemptId);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  const rows = body.answers.map((a) => ({
    quiz_attempt_id: body.quizAttemptId,
    session_id: body.sessionId,
    question_id: a.questionId,
    question_uid: a.questionUid ?? null,
    primary_category: a.primaryCategory ?? null,
    selected_key: a.selectedKey ?? null,
    correct_key: a.correctKey ?? null,
    is_correct: a.isCorrect ?? null,
  }));

  const { error: ansError } = await supabase.from("quiz_attempt_answers").insert(rows);

  if (ansError) {
    return NextResponse.json({ error: ansError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
