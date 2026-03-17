import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import { decodeAnonTrial, encodeAnonTrial, ANON_COOKIE, ANON_MAX } from "@/lib/trialCookie";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }


  // Optional auth: Authorization bearer token
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  let authedUserId: string | null = null;
  if (token && anonKey) {
    try {
      const supaAuth = createClient(supabaseUrl, anonKey);
      const { data: userData } = await supaAuth.auth.getUser(token);
      authedUserId = userData?.user?.id ?? null;
    } catch {
      authedUserId = null;
    }
  }

  // 🔒 Server-side trial enforcement (before serving questions)
  if (authedUserId) {
    const svc = createClient(supabaseUrl, serviceKey);
    const { data: prof } = await svc
      .from("profiles")
      .select("plan, trial_questions_used")
      .eq("id", authedUserId)
      .maybeSingle();

    const plan = (prof?.plan ?? "trial") as string;
    const used = Number(prof?.trial_questions_used ?? 0);
    const maxTrial = 20;
    if (plan === "trial" && used >= maxTrial) {
      return NextResponse.json({ code: "TRIAL_EXHAUSTED" }, { status: 403 });
    }
  } else {
    const jar = await cookies();
    const parsed = decodeAnonTrial(jar.get(ANON_COOKIE)?.value);
    const answered = (parsed.valid && !parsed.expired) ? parsed.answered : 0;
    if (answered >= ANON_MAX) {
      return NextResponse.json({ code: "ANON_TRIAL_EXHAUSTED" }, { status: 403 });
    }

  }

const { searchParams } = new URL(req.url);
  const count = Number(searchParams.get("count") ?? "10");

  const { data, error } = await supabase.rpc("get_random_questions", { qty: count });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

    const res = NextResponse.json({ questions: data ?? [] });
  // Anonymous: set signed cookie if missing/invalid/expired
  if (!authedUserId) {
    const jar = await cookies();
    const parsed = decodeAnonTrial(jar.get(ANON_COOKIE)?.value);
    const answered = (parsed.valid && !parsed.expired) ? parsed.answered : 0;
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

