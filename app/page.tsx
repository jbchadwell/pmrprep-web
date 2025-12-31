"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AttemptRow = {
  quiz_attempt_id: string;
  total_questions: number | null;
  correct_count: number | null;
  percent_correct: number | null;
  created_at: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

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

export default function LandingPage() {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

  // Custom quiz builder state
  const [selectedPrimary, setSelectedPrimary] = useState<string[]>([]);
  const [count, setCount] = useState<number>(20);

  const primaryCategories = useMemo(
    () => [
      { id: "Musculoskeletal", label: "Musculoskeletal" },
      { id: "Amputations, Prosthetics, Orthotics and Gait", label: "Amputations, Prosthetics, Orthotics and Gait" },
      { id: "Electrodiagnostics", label: "Electrodiagnostics" },
      { id: "Spinal Cord Injury", label: "Spinal Cord Injury" },
      { id: "Traumatic Brain Injury", label: "Traumatic Brain Injury" },
      { id: "Pain Management", label: "Pain Management" },
      { id: "Pediatrics", label: "Pediatrics" },
      { id: "Stroke, Speech, Swallowing, and Other Neurologic Disorders", label: "Stroke, Speech, Swallowing, and Other Neurologic Disorders" },
      { id: "Rheumatology", label: "Rheumatology" },
      { id: "Medical Rehabilitation", label: "Medical Rehabilitation" },
      { id: "Legal, Industrial Rehabilitation, and Ethics", label: "Legal, Industrial Rehabilitation, and Ethics" },
    ],
    []
  );

  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
  }, []);

  async function loadAttempts(sid: string) {
    setLoadingAttempts(true);
    setAttemptsError(null);

    try {
      const res = await fetch(
        `/api/attempts?session_id=${encodeURIComponent(sid)}`
      );
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body?.error || "Failed to load attempts");
      }

      setAttempts(body.attempts ?? []);
    } catch (e: any) {
      setAttemptsError(e?.message || "Failed to load attempts");
    } finally {
      setLoadingAttempts(false);
    }
  }

  useEffect(() => {
    if (!sessionId) return;
    loadAttempts(sessionId);
  }, [sessionId]);

  function toggleCategory(id: string) {
    setSelectedPrimary((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function startRandomQuiz() {
    router.push("/quiz?fresh=1");
  }

  function resumeQuiz() {
    router.push("/quiz");
  }


  function startCustomQuiz() {
    if (selectedPrimary.length === 0) return;

    // MUST match app/quiz/page.tsx expectations
    const cfg = {
      primaryCategories: selectedPrimary,
      count,
    };

    localStorage.setItem("pmrprep_custom_quiz_config", JSON.stringify(cfg));
    router.push("/quiz?mode=custom&fresh=1");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-blue-700">
          PMRPrep
        </h1>

        <div className="flex gap-2">
          <button
            onClick={resumeQuiz}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            type="button"
          >
            Resume Quiz
          </button>

          <button
            onClick={startRandomQuiz}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            type="button"
          >
            Start Random Quiz
          </button>
        </div>
      </div>

      {/* Custom Quiz Builder */}
      <section className="mt-8 rounded-2xl border border-blue-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-blue-700">
          Build Custom Quiz
        </h2>

        <div className="mt-4">
          <div className="text-sm font-medium text-blue-700">
            Primary categories
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {primaryCategories.map((c) => {
              const active = selectedPrimary.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCategory(c.id)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm",
                    active
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-blue-700">
              Number of questions
            </div>
            <input
              type="number"
              min={5}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-24 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="text-xs text-gray-500">5–100</div>
          </div>

          <button
            onClick={startCustomQuiz}
            disabled={selectedPrimary.length === 0}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-40"
          >
            Start Custom Quiz
          </button>
        </div>

        {selectedPrimary.length === 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Select at least one category to enable a custom quiz.
          </div>
        )}
      </section>

      {/* Quiz History */}
      <section className="mt-8 rounded-2xl border border-blue-200 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-blue-700">
            Your Quizzes
          </h2>
          <button
            onClick={() => sessionId && loadAttempts(sessionId)}
            className="rounded-xl bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Refresh
          </button>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Most recent to least recent. Time shown reflects quiz start.
        </div>

        {loadingAttempts && (
          <div className="mt-4 text-sm text-gray-600">Loading…</div>
        )}

        {attemptsError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {attemptsError}
          </div>
        )}

        {!loadingAttempts && !attemptsError && attempts.length === 0 && (
          <div className="mt-4 text-sm text-gray-600">
            No quizzes yet. Start one above.
          </div>
        )}

        {!loadingAttempts && !attemptsError && attempts.length > 0 && (
          <div className="mt-4 divide-y">
            {attempts.map((a) => (
              <div
                key={a.quiz_attempt_id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <div className="text-sm font-medium text-blue-700">
                    Quiz — {a.total_questions ?? "—"} questions
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Started {formatDateTime(a.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-700">
                      {typeof a.percent_correct === "number"
                        ? `${Math.round(a.percent_correct)}%`
                        : "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {typeof a.correct_count === "number" &&
                      typeof a.total_questions === "number"
                        ? `${a.correct_count}/${a.total_questions}`
                        : ""}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      router.push(
                        `/quiz?resume=1&quiz_attempt_id=${encodeURIComponent(
                          a.quiz_attempt_id
                        )}`
                      )
                    }
                    className="rounded-xl bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
