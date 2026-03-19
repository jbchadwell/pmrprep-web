import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  questionId: string;
  selectedText: string | null;
  displayedChoices?: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body.questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: row, error } = await supabase
      .from("questions")
      .select(`
        id,
        correct_answer,
        distractor_1,
        distractor_2,
        distractor_3,
        correct_answer_explanation,
        distractor_1_explanation,
        distractor_2_explanation,
        distractor_3_explanation,
        answer_extra_information
      `)
      .eq("id", body.questionId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const explanationLookup = new Map(
      [
        {
          text: row.correct_answer,
          explanation: row.correct_answer_explanation,
          isCorrect: true,
        },
        {
          text: row.distractor_1,
          explanation: row.distractor_1_explanation,
          isCorrect: false,
        },
        {
          text: row.distractor_2,
          explanation: row.distractor_2_explanation,
          isCorrect: false,
        },
        {
          text: row.distractor_3,
          explanation: row.distractor_3_explanation,
          isCorrect: false,
        },
      ].map((item) => [item.text, item] as const)
    );

    const explanations =
      Array.isArray(body.displayedChoices) && body.displayedChoices.length > 0
        ? body.displayedChoices
            .map((text) => explanationLookup.get(text))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
        : Array.from(explanationLookup.values());

    const isCorrect =
      body.selectedText != null ? body.selectedText === row.correct_answer : false;

    return NextResponse.json({
      isCorrect,
      correctAnswerText: row.correct_answer,
      answerExtraInfo: row.answer_extra_information ?? null,
      explanations,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error in /api/quiz/grade";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
