"use client";
import { Flag } from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChoiceKey, DbQuestionRow, QuizQuestion } from "@/lib/quizTypes";
import { mapDbRowToQuizQuestion } from "@/lib/mapQuestion";
import QuizHeader from "./QuizHeader";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type FlagReason = "incorrect" | "poorly_worded" | "other";

type AnswerExplanation = {
  text: string;
  explanation: string;
  isCorrect: boolean;
};

type AnswerState = {
  selectedKey?: ChoiceKey;
  submitted?: boolean;
  isCorrect?: boolean;
  correctAnswerText?: string | null;
  answerExtraInfo?: string | null;
  explanations?: AnswerExplanation[];
  marked?: boolean;
  flag?: { reason: FlagReason; comment?: string; saved?: boolean };
};

type QuizState = {
  questions: QuizQuestion[];
  answersById: Record<string, AnswerState>;
  currentIndex: number;
mode: "quiz" | "summary";
  sessionId: string;
  quizAttemptId: string;
};

type TrialStatus = {
  mode: "preview" | "preview_locked" | "trial" | "trial_locked" | "subscriber";
  plan: string;
  subscribed: boolean;
  needsEmail: boolean;
  answered: number;
  limit: number | null;
  remaining: number | null;
  locked: boolean;
  message: string | null;
};

const STORAGE_KEY = "pmrprep_phase1_quiz_state_v2";
const SESSION_KEY = "pmrprep_session_id";
const CUSTOM_KEY = "pmrprep_custom_quiz_config";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, created);
  return created;
}

function newAttemptId(): string {
  return crypto.randomUUID();
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function getTrialStatus(token: string): Promise<TrialStatus> {
  const res = await fetch("/api/trial-status", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const json = (await res.json()) as TrialStatus | { error?: string };

  if (!res.ok) {
    throw new Error(
      "error" in json && json.error ? json.error : "Failed to load access status"
    );
  }

  return json as TrialStatus;
}

export default function QuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [state, setState] = useState<QuizState>({
    questions: [],
    answersById: {},
    currentIndex: 0,
mode: "quiz",
    sessionId: "",
    quizAttemptId: "",
  });

  const [flagOpen, setFlagOpen] = useState(false);
  const [bottomBarOpen, setBottomBarOpen] = useState(false);
  const [flagReason, setFlagReason] = useState<FlagReason>("incorrect");
  const [flagComment, setFlagComment] = useState("");
  const savingFlagRef = useRef(false);

  function clearQuizStateAndRedirect(target: string, clearState = true) {
    if (clearState) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CUSTOM_KEY);
    }
    setLoading(false);
    router.push(target);
  }

  function handleGateResponse(code?: string) {
    if (code === "ANON_TRIAL_EXHAUSTED") {
      clearQuizStateAndRedirect("/login", false);
      return true;
    }

    if (code === "TRIAL_EXHAUSTED") {
      clearQuizStateAndRedirect("/subscribe");
      return true;
    }

    return false;
  }

  async function hydrateAttempt(attemptId: string, reviewMode: boolean) {
    setLoading(true);

    const res = await fetch(`/api/attempt-detail?attempt_id=${encodeURIComponent(attemptId)}`);
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error || "Failed to load saved attempt");
    }

    const mapped = (json.questions ?? []).map(mapDbRowToQuizQuestion);

    const answerMap: Record<string, AnswerState> = {};
    for (const row of json.answers ?? []) {
      if (!row?.question_id) continue;
      answerMap[row.question_id] = {
        selectedKey: row.selected_key ?? undefined,
        submitted: row.selected_key != null,
        isCorrect: row.is_correct ?? undefined,
      };
    }

    const next: QuizState = {
      questions: mapped,
      answersById: answerMap,
      currentIndex: Math.min(
        Math.max(0, Number(json.attempt?.current_index ?? 0) || 0),
        Math.max(0, mapped.length - 1)
      ),
      mode: reviewMode || json.attempt?.status === "completed" ? "summary" : "quiz",
      sessionId:
        json.attempt?.session_id ||
        json.attempt?.anon_session_id ||
        getOrCreateSessionId(),
      quizAttemptId:
        json.attempt?.id ||
        json.attempt?.quiz_attempt_id ||
        attemptId,
    };

    setState(next);
    setLoading(false);
  }

  async function fetchNewQuiz() {
    const sessionId = getOrCreateSessionId();
    const quizAttemptId = newAttemptId();

    setLoading(true);

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const src = params.get("src");
    const countParam = Number(params.get("count") || "10");
    const count = Number.isFinite(countParam) && countParam > 0 ? countParam : 10;
    const token = await getAccessToken();
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    if (mode === "custom" && !token) {
      clearQuizStateAndRedirect("/login?next=/builder");
      return;
    }

    if (mode === "custom" && token) {
      const trialStatus = await getTrialStatus(token);

      if (!trialStatus.subscribed) {
        clearQuizStateAndRedirect("/explore-subscriptions");
        return;
      }
    }

    let res: Response;

    if (mode === "custom") {
      const raw = localStorage.getItem(CUSTOM_KEY);
      const config = raw ? JSON.parse(raw) : null;

      if (!config?.primaryCategories?.length) {
        window.location.href = "/builder";
        return;
      }

      res = await fetch("/api/quiz/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        } as HeadersInit,
        body: JSON.stringify({
          count: config.count ?? 10,
          primaryCategories: config.primaryCategories,
        }),
      });
    } else {
      const quizApiParams = new URLSearchParams();
      quizApiParams.set("count", String(count));
      if (src) quizApiParams.set("src", src);

      res = await fetch(`/api/quiz?${quizApiParams.toString()}`, {
        headers: authHeaders as HeadersInit,
      });
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (handleGateResponse(json?.code)) return;
      throw new Error(json?.error || json?.message || "Failed to load quiz questions");
    }

    const mapped = ((json.questions ?? []) as DbQuestionRow[]).map(mapDbRowToQuizQuestion);

    if (!mapped.length) {
      throw new Error("Quiz API returned zero questions");
    }

    const next: QuizState = {
      questions: mapped,
      answersById: {},
      currentIndex: 0,
mode: "quiz",
      sessionId,
      quizAttemptId,
    };

    setState(next);
    setLoading(false);
  }

  useEffect(() => {
    const sessionId = getOrCreateSessionId();

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const fresh = params.get("fresh");
    const attemptId = params.get("attempt_id");
    const review = params.get("review") === "1";
    const shouldBypassRestore = mode === "custom" || fresh === "1" || Boolean(attemptId);

    if (attemptId) {
      hydrateAttempt(attemptId, review).catch((err) => {
        console.error("hydrateAttempt failed", err);
        setLoading(false);
      });
      return;
    }

    const saved = shouldBypassRestore ? null : localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as QuizState;
        if (parsed?.questions?.length) {
          setState({ ...parsed, sessionId: parsed.sessionId || sessionId, currentIndex: Math.min(Math.max(0, Number(parsed.currentIndex ?? 0) || 0), Math.max(0, (parsed.questions?.length ?? 1) - 1)) });
          setLoading(false);
          return;
        }
      } catch {}
    }

    fetchNewQuiz().catch((err) => {
      console.error("fetchNewQuiz failed", err);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loading]);


  const currentQuestion = state.questions[state.currentIndex];
  const ans = currentQuestion ? state.answersById[currentQuestion.id] : undefined;
  const hasSelected = Boolean(ans?.selectedKey);
const hasSubmitted = Boolean(ans?.submitted);
const hasAnswered = hasSubmitted;

  const banner = useMemo(() => {
    if (!currentQuestion) return null;
    const a = state.answersById[currentQuestion.id];
    if (!a?.submitted) return null;
    return a.isCorrect
      ? { text: "Correct", tone: "good" as const }
      : { text: "Incorrect", tone: "bad" as const };
  }, [state.answersById, currentQuestion]);

  const total = state.questions.length;

  const correctCount = useMemo(() => {
    return state.questions.reduce(
      (acc, q) => acc + (state.answersById[q.id]?.isCorrect ? 1 : 0),
      0
    );
  }, [state.questions, state.answersById]);

  const percentCorrect = total ? Math.round((correctCount / total) * 100) : 0;

  const missedByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of state.questions) {
      const a = state.answersById[q.id];
      if (a?.selectedKey && a.isCorrect === false) {
        const cat = q.primaryCategory || "Uncategorized";
        counts.set(cat, (counts.get(cat) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [state.questions, state.answersById]);

  async function saveAttemptProgress(useBeacon = false) {
    if (!state.sessionId || !state.quizAttemptId || !state.questions.length) return;

    const answersPayload = state.questions.map((q) => {
      const a = state.answersById[q.id];
      const selectedChoice = q.choices.find((c) => c.key === a?.selectedKey);
      return {
        questionId: q.id,
        questionUid: q.uid,
        primaryCategory: q.primaryCategory ?? null,
        selectedKey: a?.selectedKey,
        selectedText: selectedChoice?.text ?? null,
      };
    });

    const payload = {
      sessionId: state.sessionId,
      quizAttemptId: state.quizAttemptId,
      currentIndex: state.currentIndex,
      totalQuestions: state.questions.length,
      correctCount,
      percentCorrect,
      answers: answersPayload,
    };

    const token = await getAccessToken();
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    if (
      useBeacon &&
      !token &&
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/attempt", blob);
      return;
    }

    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      } as HeadersInit,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      if (handleGateResponse(json?.code)) return;
      throw new Error(json?.error || json?.message || "Failed to save attempt");
    }
  }

  useEffect(() => {
    if (loading) return;
    if (state.mode !== "quiz") return;
    if (!state.sessionId || !state.quizAttemptId || !state.questions.length) return;

    const timer = window.setTimeout(() => {
      saveAttemptProgress().catch(() => {});
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    state.answersById,
    state.currentIndex,
    state.mode,
    state.questions,
    state.quizAttemptId,
    state.sessionId,
    loading,
    correctCount,
    percentCorrect,
  ]);


  function selectAnswer(key: ChoiceKey) {
    if (!currentQuestion) return;
    if (hasSubmitted) return; // lock changes only after submit

    setState((s) => ({
      ...s,
      answersById: {
        ...s.answersById,
        [currentQuestion.id]: {
          ...(s.answersById[currentQuestion.id] ?? {}),
          selectedKey: key, // selection only (no correctness yet)
        },
      },
    }));
  }

  async function submitAnswer() {
    if (!currentQuestion) return;
    if (!hasSelected) return;
    if (hasSubmitted) return;

    const selectedKey = state.answersById[currentQuestion.id]?.selectedKey;
    const selectedChoice = currentQuestion.choices.find((c) => c.key === selectedKey);

    const res = await fetch("/api/quiz/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId: currentQuestion.id,
        selectedText: selectedChoice?.text ?? null,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json?.error || "Failed to grade answer");
    }

    setState((s) => ({
      ...s,
      answersById: {
        ...s.answersById,
        [currentQuestion.id]: {
          ...(s.answersById[currentQuestion.id] ?? {}),
          submitted: true,
          isCorrect: Boolean(json?.isCorrect),
          correctAnswerText: json?.correctAnswerText ?? null,
          answerExtraInfo: json?.answerExtraInfo ?? null,
          explanations: Array.isArray(json?.explanations) ? json.explanations : [],
        },
      },
    }));
  }

  async function goNext() {
    const lastIndex = state.questions.length - 1;

    const params = new URLSearchParams(window.location.search);
    const src = params.get("src");
    const token = await getAccessToken();

    if (src === "trial" && !token && hasSubmitted && state.currentIndex >= 2) {
      try {
        await saveAttemptProgress();
      } catch {}
      clearQuizStateAndRedirect("/login", false);
      return;
    }

    if (state.currentIndex >= lastIndex) {
      if (hasSubmitted) {
        try {
          await saveAttemptProgress();
        } catch {}

        setState((s) => ({ ...s, mode: "summary" }));
      }
      return;
    }

    setState((s) => ({ ...s, currentIndex: s.currentIndex + 1 }));
  }

  function goBack() {
    setState((s) => ({ ...s, currentIndex: Math.max(0, s.currentIndex - 1) }));
  }

  function toggleMark() {
    if (!currentQuestion) return;
    setState((s) => ({
      ...s,
      answersById: {
        ...s.answersById,
        [currentQuestion.id]: {
          ...(s.answersById[currentQuestion.id] ?? {}),
          marked: !(s.answersById[currentQuestion.id]?.marked ?? false),
        },
      },
    }));
  }

  function openReviewIndex(index: number) {
    setState((s) => ({ ...s, currentIndex: index, mode: "quiz" }));
  }

  async function submitFlag() {
    if (!currentQuestion) return;
    if (savingFlagRef.current) return;

    setState((s) => ({
      ...s,
      answersById: {
        ...s.answersById,
        [currentQuestion.id]: {
          ...(s.answersById[currentQuestion.id] ?? {}),
          flag: {
            reason: flagReason,
            comment: flagComment.trim() || undefined,
            saved: false,
          },
        },
      },
    }));

    setFlagOpen(false);

    savingFlagRef.current = true;
    try {
      const res = await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          quizAttemptId: state.quizAttemptId,
          questionId: currentQuestion.id,
          questionUid: currentQuestion.uid,
          reason: flagReason,
          comment: flagComment.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save flag");

      setState((s) => ({
        ...s,
        answersById: {
          ...s.answersById,
          [currentQuestion.id]: {
            ...(s.answersById[currentQuestion.id] ?? {}),
            flag: {
              reason: flagReason,
              comment: flagComment.trim() || undefined,
              saved: true,
            },
          },
        },
      }));
    } finally {
      savingFlagRef.current = false;
      setFlagComment("");
      setFlagReason("incorrect");
    }
  }


  useEffect(() => {
    function flushProgress() {
      saveAttemptProgress(true);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushProgress();
      }
    }

    window.addEventListener("beforeunload", flushProgress);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushProgress);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    state.answersById,
    state.currentIndex,
    state.mode,
    state.questions,
    state.quizAttemptId,
    state.sessionId,
    correctCount,
    percentCorrect,
  ]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (state.mode !== "quiz") return;

      const key = e.key.toLowerCase();

      if (!hasAnswered && ["a", "b", "c", "d"].includes(key)) {
        selectAnswer(key.toUpperCase() as ChoiceKey);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (hasAnswered) goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnswered, state.mode, state.currentIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading quiz…
      </div>
    );
  }

  if (state.mode === "summary") {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-3xl p-4 sm:p-6 pt-6 sm:pt-8">
        <QuizHeader mode={state.mode} currentIndex={state.currentIndex} total={state.questions.length} onExitConfirm={() => { localStorage.removeItem("pmrprep_phase1_quiz_state_v2"); router.push("/"); }} />
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-sm text-gray-600">
              Summary · Attempt {state.quizAttemptId.slice(0, 8)}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-2xl font-semibold">{percentCorrect}% correct</div>
            <div className="mt-2 text-sm text-gray-600">
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">Categories missed</div>
              {missedByCategory.length === 0 ? (
                <div className="mt-2 text-sm text-gray-600">None 🎉</div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {missedByCategory.map(([cat, n]) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between rounded-xl border p-3 text-sm"
                    >
                      <div className="font-medium">{cat}</div>
                      <div className="text-gray-600">{n}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">Review questions</div>
              <div className="mt-3 grid grid-cols-5 sm:grid-cols-10 gap-2">
                {state.questions.map((q, idx) => {
                  const a = state.answersById[q.id];
                  const status = !a?.submitted ? "unseen" : a.isCorrect ? "correct" : "incorrect";
                  return (
                    <button
                      key={q.id}
                      onClick={() => openReviewIndex(idx)}
                      className={cx(
                        "relative rounded-lg border px-2 py-2 text-xs",
                        status === "correct" && "bg-emerald-50 border-emerald-200",
                        status === "incorrect" && "bg-red-50 border-red-200",
                        status === "unseen" && "bg-blue-100",
                        a?.marked && "ring-2 ring-offset-1 ring-amber-300"
                      )}
                      type="button"
                    >
                      {a?.marked && (
                        <Flag
                          size={12}
                          className="absolute top-0 right-0 translate-x-1 -translate-y-1 text-amber-500 pointer-events-none"
                          fill="currentColor"
                        />
                      )}
                    {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setState((s) => ({ ...s, mode: "quiz", currentIndex: 0 }))}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                type="button"
              >
                Back to quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="min-h-screen flex items-center justify-center">No questions loaded.</div>;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl p-4 sm:p-6 pt-6 sm:pt-8">
        <QuizHeader mode={state.mode} currentIndex={state.currentIndex} total={state.questions.length} onExitConfirm={() => { localStorage.removeItem("pmrprep_phase1_quiz_state_v2"); router.push("/"); }} />
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-gray-600">
            Quiz · {state.currentIndex + 1} / {total}{" "}
            
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
            </div>
            <div>{percentCorrect}% correct</div>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-2 rounded-full bg-blue-700 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4">
          <div />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMark}
              className={cx(
                "rounded-lg border px-3 py-2 text-sm hover:bg-gray-50",
                ans?.marked && "bg-blue-100"
              )}
              type="button"
            >
              {ans?.marked ? "Flagged" : "Flag"}
            </button>
          </div>
        </div>

        {banner && (
          <div
            className={cx(
              "mb-4 rounded-xl border px-4 py-3 text-sm font-semibold",
              banner.tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-900",
              banner.tone === "bad" && "border-red-200 bg-red-50 text-red-900"
            )}
          >
            {banner.text}
          </div>
        )}

        <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
          <div className="text-lg font-semibold leading-snug">{currentQuestion.stem}</div>


          <div className="mt-3 text-sm text-gray-600">
            {currentQuestion.questionExtraInfo && (
              <>
                <span className="font-medium text-gray-900">Question extra info:</span>{" "}
                {currentQuestion.questionExtraInfo}
              </>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            {currentQuestion.choices.map((c) => {
              const selected = ans?.selectedKey === c.key;
              const answered = Boolean(ans?.submitted);
              const chosenWrong = answered && selected && ans?.isCorrect === false;
              const chosenCorrect = answered && selected && ans?.isCorrect === true;

              return (
                <button
                  key={c.key}
                  disabled={answered}
                  onClick={() => selectAnswer(c.key)}
                  className={cx(
                    "w-full text-left rounded-xl border px-4 py-3 sm:py-4 text-base transition",
                    !answered && "hover:bg-gray-50",
                    !answered && selected && "bg-blue-50 border-blue-200 ring-1 ring-blue-100",
                    chosenCorrect && "bg-emerald-50 border-emerald-200",
                    chosenWrong && "border-red-300 ring-1 ring-red-200"
                  )}
                  type="button"
                >
                  <div className="flex gap-3">
                    <div className="font-mono font-semibold w-6">{c.key}.</div>
                    <div className="flex-1">{c.text}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {!hasSubmitted && (
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={submitAnswer}
                disabled={!hasSelected}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                type="button"
              >
                Submit Answer
              </button>
            </div>
          )}

          {hasSubmitted && (
            <div className="mt-6 space-y-3">
              <div className="text-sm font-semibold">Explanations</div>

              {(ans?.explanations ?? []).map((item, idx) => (
                <div
                  key={`${item.text}-${idx}`}
                  className={cx(
                    "rounded-xl border p-4",
                    item.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-gray-200"
                  )}
                >
                  <div className={cx("font-semibold", item.isCorrect ? "text-base" : "text-sm")}>
                    {item.text}
                  </div>
                  <div className={cx(item.isCorrect ? "text-base mt-2" : "text-sm mt-2 text-gray-600")}>
                    {item.explanation}
                  </div>
                </div>
              ))}

              <div className="mt-3 text-sm text-gray-600">
                {ans?.answerExtraInfo && (
                  <>
                    <span className="font-medium text-gray-900">Answer extra info:</span>{" "}
                    {ans.answerExtraInfo}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={state.currentIndex === 0}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
              type="button"
            >
              Back
            </button>

            <button
              onClick={goNext}
              disabled={!hasSubmitted}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
              type="button"
            >
              {state.currentIndex === total - 1 ? "Finish → Summary" : "Next"}
            </button>
          </div>
        </div>



        {/* Bottom question bar (rows of 10) */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur z-40">
          <div className="mx-auto max-w-5xl px-4 py-2">
            <div className="flex items-center justify-between sm:hidden">
              <div className="text-xs text-gray-600">Questions</div>
              <button
                onClick={() => setBottomBarOpen((v) => !v)}
                className="text-xs text-gray-700 border rounded-md px-2 py-1"
                type="button"
              >
                {bottomBarOpen ? "Hide ▾" : "Show ▴"}
              </button>
            </div>

            <div className={cx(!bottomBarOpen && "hidden", "sm:block")}>
              <div className="grid grid-cols-10 gap-2 mt-2 sm:mt-0">
                {state.questions.map((q, idx) => {
                  const a = state.answersById[q.id];
                  const status = !a?.submitted ? "unseen" : a.isCorrect ? "correct" : "incorrect";
                  const isCurrent = idx === state.currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setState((s) => ({ ...s, currentIndex: idx }))}
                      className={cx(
                        "relative rounded-md border px-2 py-2 text-xs",
                        status === "correct" && "bg-emerald-50 border-emerald-200",
                        status === "incorrect" && "bg-red-50 border-red-200",
                        status === "unseen" && "bg-white border-gray-200",
                        isCurrent && "ring-2 ring-offset-1 ring-blue-300"
                      )}
                      type="button"
                      aria-label={`Question ${idx + 1}`}
                    >
                      {a?.marked && (
                        <Flag
                          size={12}
                          className="absolute top-0 right-0 translate-x-1 -translate-y-1 text-amber-500 pointer-events-none"
                          fill="currentColor"
                        />
                      )}
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

            <div className="mt-2 pt-2 border-t flex justify-center">
              <button
                onClick={() => setFlagOpen(true)}
                className="text-xs text-gray-600 underline underline-offset-4 hover:text-gray-900"
                type="button"
              >
                Report Question
              </button>
            </div>

            </div>
          </div>
        </div>

        {/* Spacer so content isn't hidden behind fixed bottom bar */}
        <div className="h-36" />

        {flagOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white border p-5 shadow-xl">
              <div className="text-base font-semibold">Flag question</div>

              <div className="mt-4 space-y-2 text-sm">
                <label className="flex gap-2 items-center">
                  <input
                    type="radio"
                    checked={flagReason === "incorrect"}
                    onChange={() => setFlagReason("incorrect")}
                  />
                  Incorrect
                </label>
                <label className="flex gap-2 items-center">
                  <input
                    type="radio"
                    checked={flagReason === "poorly_worded"}
                    onChange={() => setFlagReason("poorly_worded")}
                  />
                  Poorly worded
                </label>
                <label className="flex gap-2 items-center">
                  <input
                    type="radio"
                    checked={flagReason === "other"}
                    onChange={() => setFlagReason("other")}
                  />
                  Other
                </label>
              </div>

              <textarea
                className="mt-4 w-full rounded-xl border p-3 text-sm"
                rows={4}
                placeholder="Optional comment…"
                value={flagComment}
                onChange={(e) => setFlagComment(e.target.value)}
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg border px-4 py-2 text-sm"
                  onClick={() => setFlagOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg border px-4 py-2 text-sm bg-blue-100"
                  onClick={submitFlag}
                  type="button"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
