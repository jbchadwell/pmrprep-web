"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/app/_components/ui/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import Button from "@/app/_components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function safeNextPath(): string {
    const raw = searchParams.get("next") || "/quiz";
    const path = raw.startsWith("/") ? raw : "/";
    try {
      const u = new URL(path, "http://local");
      u.searchParams.delete("fresh");
      return u.pathname + (u.search || "");
    } catch {
      return "/";
    }
  }

  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(safeNextPath());
    });
  }, [router, searchParams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({ email, password });
        if (error) throw error;

        const { data } = await supabaseBrowser.auth.getSession();
        if (data.session) {
          router.replace(safeNextPath());
        } else {
          setMsg("Check your email to confirm your account, then return to log in.");
        }
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace(safeNextPath());
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "signup" ? "Create your free PMRPrep account" : "Log in to continue";
  const description =
    mode === "signup"
      ? "You’ve finished your 3-question preview. Create a free account to continue your 20-question PMRPrep trial."
      : "Welcome back. Log in to continue your PMRPrep free trial.";

  return (
    <PageShell className="max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card muted className="border-slate-200">
          <CardHeader>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              PMRPrep
            </div>
            <CardTitle className="text-3xl leading-tight sm:text-4xl">
              {title}
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-slate-600">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Preview</div>
                <div className="mt-1 text-sm text-slate-600">
                  Answer 3 questions before signup is required.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Free trial</div>
                <div className="mt-1 text-sm text-slate-600">
                  Continue through the full 20-question PMRPrep trial.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">Built for PM&amp;R</div>
                <div className="mt-1 text-sm text-slate-600">
                  Focused board-style prep designed for ABPMR studying.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="text-sm font-semibold text-blue-900">
                What happens next
              </div>
              <div className="mt-2 space-y-2 text-sm text-blue-900/90">
                <p>1. Create your account or log in.</p>
                <p>2. Return to your quiz automatically.</p>
                <p>3. Continue your free trial from where you left off.</p>
              </div>
            </div>

            <div className="text-sm text-slate-600">
              Looking around first?{" "}
              <Link href="/" className="font-medium text-blue-700 hover:text-blue-800">
                Return to the homepage
              </Link>
              .
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  mode === "signup"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setMode("signup")}
                type="button"
              >
                Sign up
              </button>
              <button
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setMode("login")}
                type="button"
              >
                Log in
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">
                  Email
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">
                  Password
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={loading}
                type="submit"
              >
                {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
              </Button>

              {msg ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    msg.toLowerCase().includes("check your email")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-red-200 bg-red-50 text-red-900"
                  }`}
                >
                  {msg}
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                After authentication, you’ll return to{" "}
                <span className="font-mono text-slate-800">{safeNextPath()}</span>.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
