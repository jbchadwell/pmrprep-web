import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const attemptId = searchParams.get("attempt_id");

  if (!attemptId) {
    return NextResponse.json({ error: "Missing attempt_id" }, { status: 400 });
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

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select(`
      id,
      quiz_attempt_id,
      session_id,
      anon_session_id,
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
    .or(`id.eq.${attemptId},quiz_attempt_id.eq.${attemptId}`)
    .maybeSingle();

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const canonicalAttemptId = attempt.id ?? attempt.quiz_attempt_id;

  const { data: answers, error: answersError } = await supabase
    .from("quiz_attempt_answers")
    .select(`
      quiz_attempt_id,
      session_id,
      question_id,
      question_uid,
      primary_category,
      selected_key,
      correct_key,
      is_correct
    `)
    .eq("quiz_attempt_id", canonicalAttemptId);

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 });
  }

  const questionIds = Array.from(
    new Set((answers ?? []).map((a: any) => a.question_id).filter(Boolean))
  );

  if (!questionIds.length) {
    return NextResponse.json({
      attempt,
      answers: [],
      questions: [],
    });
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(`
      id,
      question_uid,
      question_stem,
      question_extra_information,
      answer_extra_information,
      correct_answer,
      distractor_1,
      distractor_2,
      distractor_3,
      correct_answer_explanation,
      distractor_1_explanation,
      distractor_2_explanation,
      distractor_3_explanation,
      primary_category
    `)
    .in("id", questionIds);

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  const questionOrder = new Map(
    questionIds.map((id, index) => [id, index])
  );

  const orderedQuestions = [...(questions ?? [])].sort(
    (a: any, b: any) =>
      (questionOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (questionOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );

  return NextResponse.json({
    attempt,
    answers: answers ?? [],
    questions: orderedQuestions,
  });
}
