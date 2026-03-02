import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TRIAL_LIMIT = 20;

export async function GET(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  // Verify token -> user
  const supaAuth = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userErr } = await supaAuth.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userId = userData.user.id;

  // Read profile with service role
  const supaSrv = createClient(supabaseUrl, serviceKey);
  const { data: profile, error: profErr } = await supaSrv
    .from("profiles")
    .select("plan, trial_questions_used")
    .eq("id", userId)
    .maybeSingle();

  // If no profile row yet, treat as trial with 0 used (Stage 2 safe)
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  const plan = profile?.plan ?? "trial";
  const used = profile?.trial_questions_used ?? 0;

  return NextResponse.json({
    plan,
    used,
    limit: TRIAL_LIMIT,
    remaining: Math.max(0, TRIAL_LIMIT - used),
  });
}
