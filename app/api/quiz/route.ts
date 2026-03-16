import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import { decodeAnonTrial, encodeAnonTrial, ANON_COOKIE, ANON_MAX } from "@/lib/trialCookie";
import { createClient } from "@supabase/supabase-js";

const TRIAL_LIMIT = 20;

export async function GET(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

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

  const { searchParams } = new URL(req.url);
  const requestedCount = Number(searchParams.get("count") ?? "10");
  const safeRequestedCount =
    Number.isFinite(requestedCount) && requestedCount > 0
      ? Math.floor(requestedCount)
      : 10;

  let allowedCount = safeRequestedCount;

  if (authedUserId) {
    const svc = createClient(supabaseUrl, serviceKey);
    const { data: prof, error: profErr } = await svc
      .from("profiles")
      .select("plan, trial_questions_used")
      .eq("id", authedUserId)
      .maybeSingle();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    const plan = (prof?.plan ?? "trial") as string;
    const used = Number(prof?.trial_questions_used ?? 0);

    if (plan === "trial") {
      const remaining = Math.max(0, TRIAL_LIMIT - used);
      if (remaining <= 0) {
        return NextResponse.json(
          {
            code: "TRIAL_EXHAUSTED",
            message: "Your 20-question free trial is complete.",
          },
          { status: 403 }
        );
      }
      allowedCount = Math.min(safeRequestedCount, remaining);
    }
  } else {
    const jar = await cookies();
    const parsed = decodeAnonTrial(jar.get(ANON_COOKIE)?.value);
    const answered = parsed.valid && !parsed.expired ? parsed.answered : 0;
    const remaining = Math.max(0, ANON_MAX - answered);

    if (remaining <= 0) {
      return NextResponse.json(
        {
          code: "ANON_TRIAL_EXHAUSTED",
          message: "You’ve finished your 3-question preview. Create a free account to continue.",
        },
        { status: 403 }
      );
    }

    allowedCount = Math.min(safeRequestedCount, remaining);
  }

  const { data, error } = await supabase.rpc("get_random_questions", {
    qty: allowedCount,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({
    questions: data ?? [],
    allowedCount,
  });

  if (!authedUserId) {
    const jar = await cookies();
    const parsed = decodeAnonTrial(jar.get(ANON_COOKIE)?.value);
    const answered = parsed.valid && !parsed.expired ? parsed.answered : 0;

    if (!jar.get(ANON_COOKIE) || !parsed.valid || parsed.expired) {
      res.cookies.set(ANON_COOKIE, encodeAnonTrial(answered), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }

  return res;
}
