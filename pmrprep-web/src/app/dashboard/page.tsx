import Link from "next/link";

type TileProps = {
  title: string;
  description: string;
  href?: string;
  locked?: boolean;
  badge?: string;
};

function Tile({ title, description, href, locked, badge }: TileProps) {
  const base =
    "group rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md";
  const lockedStyles = locked ? "opacity-60" : "";
  const inner = (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-gray-600">{description}</div>
        </div>
        {badge ? (
          <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-gray-700">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-sm font-medium text-blue-700">
          {locked ? "Coming soon" : "Open"}
        </span>
        <span
          aria-hidden
          className="text-gray-400 transition group-hover:translate-x-0.5"
        >
          →
        </span>
      </div>
    </div>
  );

  if (locked || !href) {
    return (
      <div className={`${base} ${lockedStyles}`} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <Link className={base} href={href}>
      {inner}
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">PMRPrep</h1>
        <p className="text-gray-600">
          Your control center. Stage 1 quiz engine is frozen; everything new
          lives here.
        </p>
      </div>

      {/* Primary actions */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tile
          title="Resume quiz"
          description="Continue where you left off."
          href="/quiz"
          badge="Stage 1"
        />
        <Tile
          title="Start a new quiz"
          description="Begin a fresh session."
          href="/quiz?fresh=1"
          badge="Stage 1"
        />
      </section>

      {/* Stage 2+ features (locked for now) */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Stage 2</h2>
            <p className="text-sm text-gray-600">
              Smart quiz creation, landing page control center, subscriptions.
            </p>
          </div>
          <Link
            href="/subscribe"
            className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:shadow"
          >
            View pricing →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Tile
            title="Smart quiz builder"
            description="Build quizzes from incorrect, unseen, marked, and mixed logic."
            href="/builder"
            locked
            badge="Stage 2"
          />
          <Tile
            title="My performance"
            description="Category trends, weaknesses, and progress over time."
            locked
            badge="Stage 3"
          />
        </div>
      </section>

      {/* Footer links */}
      <section className="mt-10 rounded-2xl border bg-gray-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Quick links</div>
            <div className="mt-1 text-sm text-gray-600">
              Keep Stage 1 stable. Add everything new via Stage 2+ routes.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/subscribe"
              className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:shadow"
            >
              Subscribe
            </Link>
            <Link
              href="/quiz?fresh=1"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow"
            >
              Start fresh quiz
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
