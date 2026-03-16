"use client";

import { useEffect } from "react";

export default function TrialPage() {
  useEffect(() => {
    window.location.href = "/quiz?fresh=1&count=3&src=trial";
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center text-sm text-gray-600">
      Starting free preview…
    </main>
  );
}
