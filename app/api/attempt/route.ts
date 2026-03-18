import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { decodeAnonTrial, encodeAnonTrial, ANON_COOKIE, ANON_MAX } from "@/lib/trialCookie";

type AnswerRow = {
  questionId: string;
  questionUid?: string;
  primaryCategory?: string | null;
  selectedKey?: string;
  selectedText?: string | null;
};

type Body = {
  sessionId: string;
  quizAttemptId: string;
  currentIndex: number;
  totalQuestions: number;
  correctCount: number;
  percentCorrect: number;
  answers: AnswerRow[];
};

const TRIAL_LIMIT = 20;

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  let authedUserId: string | null = null;
  if (token) {
    try {
      const supaAuth = createClient(supabaseUrl, anonKey);
      const { data: userData } = await supaAuth.auth.getUser(token);
      authedUserId = userData?.user?.id ?? null;
    } catch {
      authedUserId = null;
    }
  }

  const answeredCount = Array.isArray(body.answers)
    ? body.answers.filter((a) => a?.selectedKey != null).length
    : 0;

  let prevAnsweredCount = 0;
  try {
    const { count } = await supabase
      .from("quiz_attempt_answers")
      .select("question_id", { count: "exact", head: true })
      .eq("quiz_attempt_id", body.quizAttemptId)
      .not("selected_key", "is", null);

    prevAnsweredCount = Number(count ?? 0);
  } catch {
    prevAnsweredCount = 0;
  }

  const delta = Math.max(0, answeredCount - prevAnsweredCount);

  if (authedUserId && delta > 0) {
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("plan, trial_questions_used")
      .eq("id", authedUserId)
      .maybeSingle();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    const plan = (prof?.plan ?? "trial") as string;
    const currentUsed = Number(prof?.trial_questions_used ?? 0);

    if (plan === "trial" && currentUsed + delta > TRIAL_LIMIT) {
      return NextResponse.json(
        {
          code: "TRIAL_EXHAUSTED",
          message: "Your 20-question free trial is complete.",
        },
        { status: 403 }
      );
    }
  }

  if (!authedUserId && delta > 0) {
    const jar = await cookies();
    const parsed = decodeAnonTrial(jar.get(ANON_COOKIE)?.value);
    const already = parsed.valid && !parsed.expired ? parsed.answered : 0;

    if (already + delta > ANON_MAX) {
      return NextResponse.json(
        {
          code: "ANON_TRIAL_EXHAUSTED",
          message: "You’ve finished your 3-question preview. Create a free account to continue.",
        },
        { status: 403 }
      );
    }
  }

  const { error: attemptError } = await supabase
    .from("quiz_attempts")
    .upsert(
      {
        id: body.quizAttemptId,
        quiz_attempt_id: body.quizAttemptId,
        session_id: body.sessionId,
        anon_session_id: body.sessionId,
        user_id: authedUserId,
        total_questions: body.totalQuestions,
        correct_count: body.correctCount,
        percent_correct: body.percentCorrect,
        answered_count: answeredCount,
        status: answeredCount >= body.totalQuestions ? "completed" : "in_progress",
        mode: "random",
        title: "Quiz",
        current_index: Math.min(
          Math.max(0, Number(body.currentIndex ?? 0) || 0),
          Math.max(0, body.totalQuestions - 1)
        ),
      },
      { onConflict: "id" }
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

  const answeredQuestionIds = body.answers
    .map((a) => a.questionId)
    .filter(Boolean);

  let correctAnswerMap = new Map<string, string>();

  if (answeredQuestionIds.length > 0) {
    const { data: questionRows, error: questionError } = await supabase
      .from("questions")
      .select("id, correct_answer")
      .in("id", answeredQuestionIds);

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    correctAnswerMap = new Map(
      (questionRows ?? []).map((row) => [row.id as string, row.correct_answer as string])
    );
  }

  const rows = body.answers.map((a) => {
    const correctAnswer = correctAnswerMap.get(a.questionId);
    const isCorrect =
      a.selectedText != null && correctAnswer != null
        ? a.selectedText === correctAnswer
        : null;

    return {
      quiz_attempt_id: body.quizAttemptId,
      session_id: body.sessionId,
      user_id: authedUserId,
      question_id: a.questionId,
      question_uid: a.questionUid ?? null,
      primary_category: a.primaryCategory ?? null,
      selected_key: a.selectedKey ?? null,
      correct_key: null,
      is_correct: isCorrect,
    };
  });

  if (rows.length > 0) {
    const { error: ansError } = await supabase
      .from("quiz_attempt_answers")
      .insert(rows);

    if (ansError) {
      return NextResponse.json({ error: ansError.message }, { status: 500 });
    }
  }

  if (authedUserId && delta > 0) {
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("plan, trial_questions_used")
      .eq("id", authedUserId)
      .maybeSingle();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    if (!prof) {
      const { error: insertErr } = await supabase.from("profiles").insert({
        id: authedUserId,
        plan: "trial",
        trial_questions_used: delta,
      });

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    } else if ((prof.plan ?? "trial") === "trial") {
      const currentUsed = Number(prof.trial_questions_used ?? 0);

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ trial_questions_used: currentUsed + delta })
        .eq("id", authedUserId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }
  }

  if (!authedUserId && delta > 0) {
    const jar = await cookies();
    const parsed = decodeAnonTrial(jar.get(ANON_COOKIE)?.value);
    const already = parsed.valid && !parsed.expired ? parsed.answered : 0;

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ANON_COOKIE, encodeAnonTrial(already + delta), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  return NextResponse.json({ ok: true });
}
