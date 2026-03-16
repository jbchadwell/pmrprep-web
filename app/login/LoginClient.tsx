"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function safeNextPath(): string {
    const raw = searchParams.get("next") || "/";
    // Only allow internal paths
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
    // If already logged in, bounce to next
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(safeNextPath());
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({ email, password });
        if (error) throw error;

        // If email confirmations are OFF, user will be signed in immediately.
        // If confirmations are ON, they must confirm first.
        const { data } = await supabaseBrowser.auth.getSession();
        if (data.session) router.replace(safeNextPath());
        else setMsg("Check your email to confirm your account, then return to log in.");
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(safeNextPath());
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">PMRPrep</h1>
      <p className="mt-2 text-sm text-gray-600">
        {mode === "signup"
          ? "Create a free account to unlock your 20-question trial. No credit card required."
          : "Log in to continue your trial."}
      </p>

      <div className="mt-6 flex gap-2">
        <button
          className={`px-3 py-2 rounded border ${mode === "signup" ? "bg-gray-900 text-white" : "bg-white"}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Sign up
        </button>
        <button
          className={`px-3 py-2 rounded border ${mode === "login" ? "bg-gray-900 text-white" : "bg-white"}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Log in
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />

        <button
          className="w-full rounded bg-blue-600 text-white px-3 py-2 disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
        </button>

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

        <p className="text-xs text-gray-500">
          After logging in, you’ll return to: <span className="font-mono">{safeNextPath()}</span>
        </p>
      </form>
    </main>
  );
}
