export type RecentQuiz = {
  id: string;              // unique id
  title: string;           // display name
  mode: "random" | "custom";
  createdAt: number;       // Date.now()
  completed?: boolean;     // optional
};

const RECENTS_KEY = "pmrprep_recent_quizzes_v1";

export function loadRecents(): RecentQuiz[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentQuiz[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.id === "string")
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [];
  }
}

export function saveRecents(items: RecentQuiz[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENTS_KEY, JSON.stringify(items.slice(0, 25)));
}

export function addRecent(item: Omit<RecentQuiz, "id" | "createdAt"> & Partial<Pick<RecentQuiz, "id" | "createdAt">>) {
  if (typeof window === "undefined") return;

  const id =
    item.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `rq_${Math.random().toString(16).slice(2)}_${Date.now()}`);

  const createdAt = item.createdAt ?? Date.now();

  const next: RecentQuiz = {
    id,
    title: item.title,
    mode: item.mode,
    createdAt,
    completed: item.completed ?? false,
  };

  const existing = loadRecents().filter((x) => x.id !== id);
  saveRecents([next, ...existing]);
}

export function markRecentCompleted(id: string, completed: boolean) {
  const items = loadRecents().map((x) => (x.id === id ? { ...x, completed } : x));
  saveRecents(items);
}

export function removeRecent(id: string) {
  const items = loadRecents().filter((x) => x.id !== id);
  saveRecents(items);
}
