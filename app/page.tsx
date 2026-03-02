"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

type Tile = { href: string; title: string; desc: string; badge?: string };

export default function ControlCenterPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  const primary: Tile[] = [
    { href: "/quiz", title: "Resume", desc: "Continue your current quiz state." },
    { href: "/quiz?fresh=1", title: "Start", desc: "Start a fresh random quiz." },
    { href: "/custom-quiz", title: "Custom Quiz", desc: "Build a category-based quiz (Phase 1 builder)." },
    { href: "/builder", title: "Builder", desc: "New quiz builder route (Stage 2 work)." },
  ];

  const study: Tile[] = [
    { href: "/questions", title: "Questions", desc: "Question engine entry point." },
    { href: "/engine", title: "Engine", desc: "Alternate engine route (Stage 2)." },
    { href: "/trial", title: "Trial", desc: "See trial status and upgrade prompts.", badge: "Stage 2" },
  ];

  const account: Tile[] = [
    { href: "/login", title: "Login / Signup", desc: "Access your free account trial." },
    { href: "/account", title: "Account", desc: "Profile and plan settings." },
    { href: "/explore-subscriptions", title: "Subscriptions", desc: "View plans and upgrade." },
    { href: "/subscribe", title: "Subscribe", desc: "Subscription flow route." },
  ];

  const misc: Tile[] = [
    { href: "/analytics", title: "Analytics", desc: "Performance breakdowns and history." },
    { href: "/help", title: "Help", desc: "FAQs and support." },
    { href: "/about", title: "About", desc: "What PMRPrep is and how it works." },
    { href: "/dashboard", title: "Dashboard", desc: "Dashboard route (if you’re using it as CC later)." },
  ];

  function Section({ title, items }: { title: string; items: Tile[] }) {
    return (
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-blue-700">{t.title}</div>
                {t.badge ? (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {t.badge}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 text-sm text-gray-700">{t.desc}</div>
              <div className="mt-4 text-xs text-gray-400">{t.href}</div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-blue-700">PMRPrep</h1>
          <p className="mt-2 text-gray-700">
            Control Center — launch questions, build quizzes, view analytics, and manage your account.
          </p>
          {sessionId ? <p className="mt-2 text-xs text-gray-500">Session: {sessionId}</p> : null}
        </div>
      </div>

      <Section title="Start studying" items={primary} />
      <Section title="Study routes" items={study} />
      <Section title="Account & billing" items={account} />
      <Section title="Analytics & support" items={misc} />
    </main>
  );
}
