import Link from "next/link";

export default function SubscribePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Subscribe</h1>
      <p className="mt-2 text-gray-600">
        Stripe checkout will be added in Stage 2. For now, this is a placeholder.
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold">PMRPrep Pro</div>
        <div className="mt-1 text-sm text-gray-600">
          Smart quiz creation + advanced analytics (Stage 3).
        </div>

        <button
          className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white opacity-60"
          disabled
        >
          Checkout (coming soon)
        </button>
      </div>

      <div className="mt-6">
        <Link className="text-sm font-medium text-blue-700" href="/dashboard">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}
