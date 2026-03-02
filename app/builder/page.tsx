import Link from "next/link";

export default function BuilderPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Smart quiz builder</h1>
      <p className="mt-2 text-gray-600">
        Stage 2 feature. This page is a placeholder scaffold (no logic yet).
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold">Filters (coming soon)</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
          <li>Incorrect only</li>
          <li>Unseen</li>
          <li>Marked</li>
          <li>Mixed logic (e.g., MSK + Incorrect)</li>
        </ul>

        <button
          className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white opacity-60"
          disabled
        >
          Start quiz (coming soon)
        </button>
      </div>

      <div className="mt-6 flex gap-3">
        <Link className="text-sm font-medium text-blue-700" href="/dashboard">
          ← Back to dashboard
        </Link>
        <Link className="text-sm font-medium text-blue-700" href="/quiz">
          Resume quiz →
        </Link>
      </div>
    </main>
  );
}
