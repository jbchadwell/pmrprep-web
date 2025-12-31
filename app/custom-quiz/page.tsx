"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "pmrprep_custom_quiz_config";

const PRIMARY_CATEGORIES = [
  "Musculoskeletal",
  "Amputations, Prosthetics, Orthotics and Gait",
  "Electrodiagnostics",
  "Spinal Cord Injury",
  "Traumatic Brain Injury",
  "Pain Management",
  "Pediatrics",
  "Stroke, Speech, Swallowing, and Other Neurologic Disorders",
  "Rheumatology",
  "General Medicine",
];

export default function CustomQuizPage() {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);

  const canStart = useMemo(() => selected.length > 0 && count > 0, [selected, count]);

  function toggle(cat: string) {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]
    );
  }

  function start() {
    const config = { count, primaryCategories: selected };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.removeItem("pmrprep_phase1_quiz_state_v2");
    localStorage.removeItem("pmrprep_phase1_quiz_state_v2");
    router.push("/quiz?mode=custom&fresh=1");
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="text-2xl font-semibold">Build a Custom Quiz</div>
        <div className="mt-2 text-sm text-gray-600">
          Select categories and question count, then start.
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold mb-2">Number of questions</div>
          <div className="flex gap-2 flex-wrap">
            {[10, 20, 40].map((n) => (
              <button
                key={n}
                type="button"
                className={
                  "rounded-full border px-3 py-1 text-sm " +
                  (count === n ? "bg-gray-100" : "hover:bg-gray-50")
                }
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-gray-600">Custom:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-20 rounded-lg border px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 text-sm font-semibold">Primary categories</div>
          <div className="mt-3 grid gap-2">
            {PRIMARY_CATEGORIES.map((cat) => {
              const on = selected.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle(cat)}
                  className={
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-sm hover:bg-gray-50 " +
                    (on ? "bg-emerald-50 border-emerald-200" : "")
                  }
                >
                  <span className="font-medium">{cat}</span>
                  <span className="text-xs text-gray-600">{on ? "Selected" : ""}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Selected: <span className="font-semibold text-gray-900">{selected.length}</span>
            </div>
            <button
              type="button"
              onClick={start}
              disabled={!canStart}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Start Custom Quiz →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
