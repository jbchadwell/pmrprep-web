import Link from "next/link";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="mt-2 text-gray-600">
        Login/logout, profile, subscription status, and billing.
      </p>

      <div className="mt-6">
        <Link className="underline text-sm" href="/account/subscription">
          Manage subscription
        </Link>
      </div>
    </main>
  );
}

