import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { decodeAnonTrial, ANON_COOKIE, ANON_MAX } from "@/lib/trialCookie";

const TRIAL_LIMIT = 20;

export async function GET(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    const jar = await cookies();
    const parsed = decodeAnonTrial(jar.get(ANON_COOKIE)?.value);
    const answered = parsed.valid && !parsed.expired ? parsed.answered : 0;
    const remaining = Math.max(0, ANON_MAX - answered);

    return NextResponse.json({
      mode: remaining > 0 ? "preview" : "preview_locked",
      plan: "anonymous",
      subscribed: false,
      needsEmail: remaining <= 0,
      answered,
      limit: ANON_MAX,
      remaining,
      locked: remaining <= 0,
      message:
        remaining <= 0
          ? "You’ve finished your 3-question preview. Create a free account to continue to the full 20-question trial."
          : null,
    });
  }

  const supaAuth = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userErr } = await supaAuth.auth.getUser(token);

  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userId = userData.user.id;

  const supaSrv = createClient(supabaseUrl, serviceKey);
  const { data: profile, error: profErr } = await supaSrv
    .from("profiles")
    .select("plan, trial_questions_used")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  const plan = profile?.plan ?? "trial";
  const used = Number(profile?.trial_questions_used ?? 0);

  if (plan !== "trial") {
    return NextResponse.json({
      mode: "subscriber",
      plan,
      subscribed: true,
      needsEmail: false,
      answered: used,
      limit: null,
      remaining: null,
      locked: false,
      message: null,
    });
  }

  const remaining = Math.max(0, TRIAL_LIMIT - used);

  return NextResponse.json({
    mode: remaining > 0 ? "trial" : "trial_locked",
    plan,
    subscribed: false,
    needsEmail: false,
    answered: used,
    limit: TRIAL_LIMIT,
    remaining,
    locked: remaining <= 0,
    message:
      remaining <= 0
        ? "Your 20-question free trial is complete."
        : null,
  });
}
