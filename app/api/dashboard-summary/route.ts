import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AttemptRow = {
  id: string;
  quiz_attempt_id: string | null;
  session_id: string | null;
  anon_session_id: string | null;
  title: string | null;
  mode: string | null;
  status: string | null;
  current_index: number | null;
  total_questions: number | null;
  correct_count: number | null;
  answered_count: number | null;
  percent_correct: number | null;
  created_at: string | null;
};

type AnswerRow = {
  quiz_attempt_id: string | null;
  session_id: string | null;
  question_id: string | null;
  primary_category: string | null;
  is_correct: boolean | null;
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function safePercent(correct: number, total: number) {
  if (!total) return null;
  return round((correct / total) * 100, 1);
}

function percentileFromSortedValues(value: number, sorted: number[]) {
  if (!sorted.length) return null;
  const belowOrEqual = sorted.filter((v) => v <= value).length;
  return Math.round((belowOrEqual / sorted.length) * 100);
}

export async function GET(req: Request) {
  try {
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
        { error: "Missing Supabase server env vars" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const [attemptsRes, answersRes, globalAttemptsRes, globalAnswersRes, questionsRes] =
      await Promise.all([
        supabase
          .from("quiz_attempts")
          .select(
            "id, quiz_attempt_id, session_id, anon_session_id, title, mode, status, current_index, total_questions, correct_count, answered_count, percent_correct, created_at"
          )
          .or(`session_id.eq.${sessionId},anon_session_id.eq.${sessionId}`)
          .order("created_at", { ascending: false }),

        supabase
          .from("quiz_attempt_answers")
          .select("quiz_attempt_id, session_id, question_id, primary_category, is_correct")
          .eq("session_id", sessionId),

        supabase
          .from("quiz_attempts")
          .select("id, answered_count, correct_count, percent_correct")
          .gt("answered_count", 0),

        supabase
          .from("quiz_attempt_answers")
          .select("session_id, primary_category, is_correct")
          .not("primary_category", "is", null),

        supabase
          .from("questions")
          .select("id, primary_category"),
      ]);

    if (attemptsRes.error) {
      return NextResponse.json({ error: attemptsRes.error.message }, { status: 500 });
    }
    if (answersRes.error) {
      return NextResponse.json({ error: answersRes.error.message }, { status: 500 });
    }
    if (globalAttemptsRes.error) {
      return NextResponse.json({ error: globalAttemptsRes.error.message }, { status: 500 });
    }
    if (globalAnswersRes.error) {
      return NextResponse.json({ error: globalAnswersRes.error.message }, { status: 500 });
    }
    if (questionsRes.error) {
      return NextResponse.json({ error: questionsRes.error.message }, { status: 500 });
    }

    const attempts = (attemptsRes.data ?? []) as AttemptRow[];
    const answers = (answersRes.data ?? []) as AnswerRow[];
    const globalAttempts = (globalAttemptsRes.data ?? []) as Array<{
      id: string;
      answered_count: number | null;
      correct_count: number | null;
      percent_correct: number | null;
    }>;
    const globalAnswers = (globalAnswersRes.data ?? []) as Array<{
      session_id: string | null;
      primary_category: string | null;
      is_correct: boolean | null;
    }>;
    const questions = (questionsRes.data ?? []) as Array<{
      id: string | null;
      primary_category: string | null;
    }>;

    const recentSessions = attempts.map((row) => ({
      id: row.id ?? row.quiz_attempt_id ?? "",
      createdAt: row.created_at ?? "",
      title: row.title?.trim() || "Quiz",
      categories: [] as string[],
      questionCount: row.total_questions ?? 0,
      answeredCount: row.answered_count ?? 0,
      percentCorrect:
        typeof row.percent_correct === "number"
          ? round(row.percent_correct, 1)
          : safePercent(row.correct_count ?? 0, row.answered_count ?? 0),
      status:
        row.status === "completed"
          ? "completed"
          : (row.answered_count ?? 0) > 0
            ? "in_progress"
            : "not_started",
    }));

    const categoriesByAttemptId = new Map<string, Set<string>>();
    for (const answer of answers) {
      const attemptId = answer.quiz_attempt_id;
      const category = answer.primary_category;
      if (!attemptId || !category) continue;
      const existing = categoriesByAttemptId.get(attemptId) ?? new Set<string>();
      existing.add(category);
      categoriesByAttemptId.set(attemptId, existing);
    }

    for (const item of recentSessions) {
      item.categories = Array.from(categoriesByAttemptId.get(item.id) ?? []);
    }

    const answered = answers.filter((a) => a.is_correct !== null).length;
    const correct = answers.filter((a) => a.is_correct === true).length;
    const overallPercentCorrect = safePercent(correct, answered);

    const categories = Array.from(
      new Set(
        questions
          .map((q) => q.primary_category)
          .filter((v): v is string => !!v)
      )
    ).sort();

    const uniqueQuestionIdsByCategory = new Map<string, Set<string>>();
    const correctByCategory = new Map<string, number>();
    const answeredByCategory = new Map<string, number>();

    for (const category of categories) {
      uniqueQuestionIdsByCategory.set(category, new Set<string>());
      correctByCategory.set(category, 0);
      answeredByCategory.set(category, 0);
    }

    for (const answer of answers) {
      if (!answer.primary_category) continue;

      if (answer.question_id) {
        uniqueQuestionIdsByCategory.get(answer.primary_category)?.add(answer.question_id);
      }

      if (answer.is_correct !== null) {
        answeredByCategory.set(
          answer.primary_category,
          (answeredByCategory.get(answer.primary_category) ?? 0) + 1
        );
      }

      if (answer.is_correct === true) {
        correctByCategory.set(
          answer.primary_category,
          (correctByCategory.get(answer.primary_category) ?? 0) + 1
        );
      }
    }

    const globalPercents = globalAttempts
      .map((a) =>
        typeof a.percent_correct === "number"
          ? Number(a.percent_correct)
          : safePercent(a.correct_count ?? 0, a.answered_count ?? 0)
      )
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    const percentile =
      overallPercentCorrect === null
        ? null
        : percentileFromSortedValues(overallPercentCorrect, globalPercents);

    const averageUserPercentCorrect =
      globalPercents.length
        ? round(globalPercents.reduce((sum, v) => sum + v, 0) / globalPercents.length, 1)
        : null;

    const globalCategoryBySession = new Map<
      string,
      Map<string, { answered: number; correct: number }>
    >();

    for (const row of globalAnswers) {
      const sid = row.session_id;
      const cat = row.primary_category;
      if (!sid || !cat) continue;

      const sessionMap = globalCategoryBySession.get(sid) ?? new Map();
      const stat = sessionMap.get(cat) ?? { answered: 0, correct: 0 };

      if (row.is_correct !== null) stat.answered += 1;
      if (row.is_correct === true) stat.correct += 1;

      sessionMap.set(cat, stat);
      globalCategoryBySession.set(sid, sessionMap);
    }

    const averageUserPercentByCategory = new Map<string, number | null>();

    for (const category of categories) {
      const values: number[] = [];

      for (const [, catMap] of globalCategoryBySession.entries()) {
        const stat = catMap.get(category);
        if (!stat || !stat.answered) continue;
        values.push((stat.correct / stat.answered) * 100);
      }

      averageUserPercentByCategory.set(
        category,
        values.length
          ? round(values.reduce((sum, v) => sum + v, 0) / values.length, 1)
          : null
      );
    }

    const totalQuestionCountByCategory = new Map<string, number>();
    for (const question of questions) {
      const cat = question.primary_category;
      if (!cat) continue;
      totalQuestionCountByCategory.set(
        cat,
        (totalQuestionCountByCategory.get(cat) ?? 0) + 1
      );
    }

    const categorySummaries = categories.map((name) => {
      const catAnswered = answeredByCategory.get(name) ?? 0;
      const catCorrect = correctByCategory.get(name) ?? 0;
      const uniqueSeen = uniqueQuestionIdsByCategory.get(name)?.size ?? 0;
      const totalInCategory = totalQuestionCountByCategory.get(name) ?? 0;

      return {
        name,
        percentCorrect: safePercent(catCorrect, catAnswered),
        answered: catAnswered,
        correct: catCorrect,
        remaining: Math.max(totalInCategory - uniqueSeen, 0),
        averageUserPercentCorrect: averageUserPercentByCategory.get(name) ?? null,
      };
    });

    return NextResponse.json({
      overall: {
        percentCorrect: overallPercentCorrect,
        answered,
        correct,
        percentile,
        averageUserPercentCorrect,
      },
      recentSessions,
      categories: categorySummaries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown dashboard error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
