import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  sessionId: string;
  quizAttemptId: string;
  questionId: string;
  questionUid?: string;
  reason: "incorrect" | "poorly_worded" | "other";
  comment?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { error } = await supabase.from("question_flags").insert({
    session_id: body.sessionId,
    quiz_attempt_id: body.quizAttemptId,
    question_id: body.questionId,
    question_uid: body.questionUid ?? null,
    reason: body.reason,
    comment: body.comment ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
