"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import PageHeader from "@/app/_components/ui/page-header";
import PageShell from "@/app/_components/ui/page-shell";

const SESSION_KEY = "pmrprep_session_id";

type DashboardSummary = {
  overall: {
    percentCorrect: number | null;
    answered: number;
    correct: number;
    percentile: number | null;
    averageUserPercentCorrect: number | null;
  };
  recentSessions: Array<{
    id: string;
    createdAt: string;
    title: string;
    categories: string[];
    questionCount: number;
    answeredCount: number;
    percentCorrect: number | null;
    status: "not_started" | "in_progress" | "completed";
  }>;
  categories: Array<{
    name: string;
    percentCorrect: number | null;
    answered: number;
    correct: number;
    remaining: number;
    averageUserPercentCorrect: number | null;
  }>;
};

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value}%`;
}

function formatDate(value: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatPercentile(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  const j = value % 10;
  const k = value % 100;
  if (j === 1 && k !== 11) return `${value}st`;
  if (j === 2 && k !== 12) return `${value}nd`;
  if (j === 3 && k !== 13) return `${value}rd`;
  return `${value}th`;
}

function statusLabel(status: "not_started" | "in_progress" | "completed") {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem(SESSION_KEY) || "";
    setSessionId(existing);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/dashboard-summary?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load dashboard");
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown dashboard error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const latest = data?.recentSessions?.[0] ?? null;

  return (
    <PageShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Dashboard"
          title="Study Control Center"
          description="Build focused question sets, review recent work, and track your PM&R board progress."
          actions={
            <Link href="/builder">
              <Button size="lg">Build Custom Quiz</Button>
            </Link>
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Overall Correct</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? "—" : formatPercent(data?.overall.percentCorrect ?? null)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {loading
                  ? "Loading..."
                  : `${data?.overall.correct ?? 0} correct out of ${data?.overall.answered ?? 0} answered`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Percentile</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? "—" : formatPercentile(data?.overall.percentile ?? null)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Compared with other PMRPrep users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Average User Score</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? "—" : formatPercent(data?.overall.averageUserPercentCorrect ?? null)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">The current PMRPrep average</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Question Sets</h2>
              <p className="text-sm text-slate-600">
                Your most recent quiz sessions, newest first.
              </p>
            </div>

            {latest ? (
              <Link href={`/quiz?attempt_id=${latest.id}`}>
                <Button variant="secondary">Resume Quiz</Button>
              </Link>
            ) : null}
          </div>

          {loading ? (
            <Card muted>
              <CardContent className="py-8">
                <p className="text-sm text-slate-600">Loading recent question sets...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card muted>
              <CardContent className="py-8">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          ) : !data?.recentSessions?.length ? (
            <Card muted>
              <CardContent className="py-8">
                <p className="text-sm text-slate-600">
                  You haven’t created a quiz yet. Build your first custom set to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {data.recentSessions.map((session) => (
                <Card
                  key={session.id}
                  className="min-w-[320px] max-w-[320px] flex-shrink-0"
                  hoverable
                >
                  <CardHeader>
                    <CardTitle className="text-base">{session.title}</CardTitle>
                    <CardDescription>
                      {formatDate(session.createdAt)} · {statusLabel(session.status)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-900">Questions:</span>{" "}
                        {session.questionCount}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Answered:</span>{" "}
                        {session.answeredCount}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Score:</span>{" "}
                        {formatPercent(session.percentCorrect)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {session.categories.length ? (
                        session.categories.map((category) => (
                          <span
                            key={category}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                          >
                            {category}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Categories will appear here</span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Link href={`/quiz?attempt_id=${session.id}`}>
                        <Button size="sm">
                          {session.status === "completed" ? "Review" : "Resume"}
                        </Button>
                      </Link>
                      <Link href={`/quiz?attempt_id=${session.id}&review=1`}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Category Analytics</h2>
            <p className="text-sm text-slate-600">
              Track your accuracy and remaining questions by category.
            </p>
          </div>

          {loading ? (
            <Card muted>
              <CardContent className="py-8">
                <p className="text-sm text-slate-600">Loading category analytics...</p>
              </CardContent>
            </Card>
          ) : !data?.categories?.length ? (
            <Card muted>
              <CardContent className="py-8">
                <p className="text-sm text-slate-600">
                  Complete questions to unlock category analytics.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Category</th>
                      <th className="px-4 py-3 text-left font-medium">Your %</th>
                      <th className="px-4 py-3 text-left font-medium">Answered</th>
                      <th className="px-4 py-3 text-left font-medium">Left</th>
                      <th className="px-4 py-3 text-left font-medium">Avg User %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories.map((category) => (
                      <tr key={category.name} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-slate-900">{category.name}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatPercent(category.percentCorrect)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{category.answered}</td>
                        <td className="px-4 py-3 text-slate-700">{category.remaining}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatPercent(category.averageUserPercentCorrect)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>How you compare</CardTitle>
            <CardDescription>
              Your current dashboard benchmark against the broader PMRPrep pool.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-900">Your overall accuracy:</span>{" "}
                {formatPercent(data?.overall.percentCorrect ?? null)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Average user accuracy:</span>{" "}
                {formatPercent(data?.overall.averageUserPercentCorrect ?? null)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Your percentile:</span>{" "}
                {formatPercentile(data?.overall.percentile ?? null)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
