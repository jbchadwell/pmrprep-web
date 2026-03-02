"use client";

import ResumeAndRecent from "../_components/ResumeAndRecent";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Analytics lives here. Stage 2 will add progress summaries and reset/clear actions.
        Stage 3 will add deeper performance analytics and trends.
      </p>

      <ResumeAndRecent title="Quick actions" />
    </main>
  );
}
