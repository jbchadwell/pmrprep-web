"use client";

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-blue-700"
        >
          PMRPrep
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link href="/dashboard" className="transition hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/account" className="transition hover:text-blue-600">
            Account
          </Link>
          <Link href="/help" className="transition hover:text-blue-600">
            Help
          </Link>
          <Link href="/about" className="transition hover:text-blue-600">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
