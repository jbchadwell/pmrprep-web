"use client";

import { useEffect } from "react";

export default function TrialPage() {
  useEffect(() => {
    // Start a fresh trial quiz with 20 questions so users see the full summary experience.
    // Engine will strip fresh=1 after creating the quiz, so login mid-quiz can restore progress.
    window.location.href = "/engine?fresh=1&count=20&src=trial";
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center text-sm text-gray-600">
      Starting free trial…
    </main>
  );
}
