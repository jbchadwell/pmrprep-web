"use client";

import { useMemo, useState } from "react";

type Props = {
  mode: "quiz" | "summary";
  currentIndex: number;
  total: number;
  onExitConfirm: () => void;
};

export default function QuizHeader({ mode, currentIndex, total, onExitConfirm }: Props) {
  const [open, setOpen] = useState(false);

  const rightText =
    mode === "summary"
      ? "Summary"
      : total > 0
      ? `Question ${currentIndex + 1} / ${total}`
      : "Loading…";

  const pct = useMemo(() => {
    if (!total) return 0;
    const v = Math.round(((currentIndex + 1) / total) * 100);
    return Math.max(0, Math.min(100, v));
  }, [currentIndex, total]);

  const centerText =
    mode === "summary"
      ? "PMRPrep"
      : total > 0
      ? `PMRPrep`
      : "PMRPrep";

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-blue-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Exit Quiz
          </button>

          <div className="text-base font-semibold text-blue-700">{centerText}</div>

          <div className="text-sm font-medium text-blue-700">{rightText}</div>
        </div>

        {mode !== "summary" && (
          <div className="mx-auto max-w-4xl px-4 pb-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-2 rounded-full bg-blue-700 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="text-lg font-semibold text-blue-700">Exit quiz?</div>
            <div className="mt-2 text-sm text-gray-600">
              Your progress is saved automatically. You can resume later.
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onExitConfirm();
                }}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
