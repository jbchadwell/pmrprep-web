"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function getSessionId(): string {
  const key = "pmrprep_session_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  localStorage.setItem(key, created);
  return created;
}

export default function ControlCenterPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  const links = useMemo(
    () => [
      { href: "/questions", title: "Questions", desc: "Open the question engine and start studying." },
      { href: "/engine", title: "Engine", desc: "Alternate engine route (if you’re using it)." },
      { href: "/builder", title: "Build a Quiz", desc: "Create a targeted quiz (categories, counts, filters)." },
      { href: "/analytics", title: "Analytics", desc: "Performance, weak areas, resets, and history." },
      { href: "/account", title: "Account", desc: "Profile, plan, and settings." },
      { href: "/explore-subscriptions", title: "Subscriptions", desc: "View plans and upgrade when ready." },
      { href: "/trial", title: "Trial", desc: "See trial status and upgrade messaging." },
      { href: "/help", title: "Help", desc: "FAQs and support." },
      { href: "/about", title: "About", desc: "What PMRPrep is and how it works." },
      { href: "/login", title: "Login / Signup", desc: "Access your free account trial." },
    ],
    []
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-blue-700">PMRPrep</h1>
          <p className="mt-2 text-gray-700">
            Control Center — jump into questions, build a quiz, review analytics, or manage your account.
          </p>
          {sessionId ? (
            <p className="mt-2 text-xs text-gray-500">Session: {sessionId}</p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Link
            href="/quiz"
            className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Resume
          </Link>
          <Link
            href="/quiz?fresh=1"
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Start
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow transition"
          >
            <div className="text-lg font-semibold text-blue-700">{l.title}</div>
            <div className="mt-2 text-sm text-gray-700">{l.desc}</div>
            <div className="mt-4 text-xs text-gray-400">{l.href}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border bg-white p-5">
        <div className="text-sm font-semibold text-gray-900">Notes</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>“Resume” preserves your existing quiz state.</li>
          <li>“Start” forces a fresh quiz.</li>
          <li>If a route doesn’t exist yet, the link will 404 — that’s okay while you’re building Stage 2.</li>
        </ul>
      </div>
    </main>
  );
}
