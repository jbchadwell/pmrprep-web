"use client";

import Link from "next/link";

function PlanCard({
  title,
  price,
  description,
  bullets,
  highlight,
}: {
  title: string;
  price: string;
  description: string;
  bullets: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-6 shadow-sm",
        highlight ? "border-blue-500 bg-blue-50" : "bg-white",
      ].join(" ")}
    >
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-2xl font-bold">{price}</div>
      <div className="mt-2 text-sm text-gray-600">{description}</div>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {bullets.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </ul>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            alert("Payments coming soon. This is the correct upgrade flow.");
          }}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
        >
          Choose Plan →
        </button>
      </div>
    </div>
  );
}

export default function ExploreSubscriptionsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Upgrade Your Access</h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          You’ve reached the end of the free trial. Upgrade to unlock unlimited questions,
          full analytics, and longitudinal tracking.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PlanCard
          title="1 Year"
          price="$99"
          description="Perfect for PGY-4s and attendings"
          bullets={[
            "Unlimited questions",
            "Full explanations",
            "Performance analytics",
            "One-time payment",
          ]}
        />

        <PlanCard
          title="3 Years"
          price="$160"
          description="Best value for residents"
          bullets={[
            "Unlimited questions",
            "Covers PGY-2 through boards",
            "Longitudinal analytics",
            "Priority feature access",
          ]}
          highlight
        />

        <PlanCard
          title="4 Years"
          price="$199"
          description="Maximum access"
          bullets={[
            "Unlimited questions",
            "Entire residency + beyond",
            "All analytics and dashboards",
            "Best overall value",
          ]}
        />
      </div>

      <div className="mt-10 text-sm text-gray-500">
        <Link href="/">← Back to Control Center</Link>
      </div>
    </main>
  );
}
