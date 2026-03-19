import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type FlagReason = "incorrect" | "poorly_worded" | "other";

type Body = {
  sessionId?: string;
  quizAttemptId?: string;
  questionId?: string;
  questionUid?: string;
  reason?: FlagReason;
  comment?: string;
};

const ALLOWED_REASONS: FlagReason[] = ["incorrect", "poorly_worded", "other"];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    if (!body.sessionId || typeof body.sessionId !== "string") {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    if (!body.quizAttemptId || typeof body.quizAttemptId !== "string") {
      return NextResponse.json({ error: "Missing quizAttemptId" }, { status: 400 });
    }

    if (!body.questionId || typeof body.questionId !== "string") {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    if (!body.reason || !ALLOWED_REASONS.includes(body.reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    const normalizedComment =
      typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : null;

    const normalizedQuestionUid =
      typeof body.questionUid === "string" ? body.questionUid.trim().slice(0, 255) : null;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabase.from("question_flags").insert({
      session_id: body.sessionId,
      quiz_attempt_id: body.quizAttemptId,
      question_id: body.questionId,
      question_uid: normalizedQuestionUid,
      reason: body.reason,
      comment: normalizedComment,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You already reported this issue for this question." },
          { status: 409 }
        );
      }

      console.error("question_flags insert failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("flag route failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
