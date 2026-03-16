"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "pmrprep_phase1_quiz_state_v2";
const CUSTOM_KEY = "pmrprep_custom_quiz_config";
const RECENT_KEY = "pmrprep_recent_custom_quiz_configs_v1";

type RecentItem = {
  id: string;
  createdAt: string; // ISO
  label: string;
  config: any;
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function hasSavedSession(): boolean {
  const state = safeJsonParse<any>(localStorage.getItem(STORAGE_KEY));
  return !!state && Array.isArray(state.questions) && typeof state.currentIndex === "number";
}

function loadRecent(): RecentItem[] {
  const arr = safeJsonParse<RecentItem[]>(localStorage.getItem(RECENT_KEY));
  return Array.isArray(arr) ? arr : [];
}

function saveRecent(items: RecentItem[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 10)));
}

function formatLabel(item: RecentItem) {
  // keep label short and consistent
  const d = new Date(item.createdAt);
  const stamp = isNaN(d.getTime()) ? item.createdAt : d.toLocaleString();
  return `${item.label} • ${stamp}`;
}

export function recordCurrentBuilderConfig(label: string) {
  // Call this from Builder right before routing to /quiz?mode=custom&fresh=1
  const cfg = safeJsonParse<any>(localStorage.getItem(CUSTOM_KEY));
  if (!cfg) return;

  const now = new Date().toISOString();
  const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();

  const next: RecentItem = { id, createdAt: now, label, config: cfg };

  const existing = loadRecent();

  // Dedupe by config JSON (good enough for localStorage use)
  const cfgStr = JSON.stringify(cfg);
  const filtered = existing.filter((it) => JSON.stringify(it.config) !== cfgStr);

  saveRecent([next, ...filtered]);
}

export default function ResumeAndRecent({
  title = "Resume or start",
  showRecent = true,
}: {
  title?: string;
  showRecent?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    setSaved(hasSavedSession());
    setRecent(loadRecent());
  }, []);

  const canResume = saved;

  const recentCount = useMemo(() => recent.length, [recent]);

  function clearSavedSession() {
    localStorage.removeItem(STORAGE_KEY);
    setSaved(false);
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  }

  function runRecent(item: RecentItem) {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(item.config));
    router.push("/quiz?mode=custom&fresh=1");
  }

  return (
    <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">
        Resume your most recent session, start fresh, or rerun a recent custom set.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => router.push("/quiz")}
          disabled={!canResume}
          className={[
            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm",
            canResume ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500 cursor-not-allowed",
          ].join(" ")}
        >
          Resume last session
        </button>

        <button
          onClick={() => router.push("/quiz?fresh=1")}
          className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:shadow"
        >
          Start fresh
        </button>

        <button
          onClick={clearSavedSession}
          className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:shadow"
        >
          Clear saved session
        </button>
      </div>

      {showRecent ? (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-gray-700">
              Recent custom quizzes {recentCount ? `(${recentCount})` : ""}
            </div>
            <button
              onClick={clearRecent}
              className="text-xs text-gray-600 underline underline-offset-2"
              disabled={!recentCount}
            >
              Clear recent list
            </button>
          </div>

          {recentCount ? (
            <div className="mt-3 space-y-2">
              {recent.slice(0, 10).map((it) => (
                <button
                  key={it.id}
                  onClick={() => runRecent(it)}
                  className="w-full text-left rounded-xl border bg-white px-4 py-3 text-sm hover:shadow"
                >
                  {formatLabel(it)}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-600">
              No recent custom quizzes yet. Build one above and start it—then it will appear here.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
