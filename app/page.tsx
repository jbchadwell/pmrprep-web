import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trial", label: "Trial" },
  { href: "/account", label: "Account" },
  { href: "/explore-subscriptions", label: "Explore Subscriptions" },
  { href: "/help", label: "Help" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    >
      {label}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              PMRPrep
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Board-style questions, built for PM&R training.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {nav.map((x) => (
              <NavLink key={x.href} href={x.href} label={x.label} />
            ))}
          </nav>
        </header>

        {/* Intentionally no other clickable controls on / */}
        <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Use the navigation above to access your dashboard, trial, account, subscriptions,
            or help page.
          </p>
        </section>

        <footer className="mt-10 text-xs text-gray-500">
          © {new Date().getFullYear()} PMRPrep
        </footer>
      </div>
    </main>
  );
}
