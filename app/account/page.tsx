import Link from "next/link";
import Button from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import PageHeader from "@/app/_components/ui/page-header";
import PageShell from "@/app/_components/ui/page-shell";

export default function AccountPage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <PageHeader
          title="Account"
          description="Manage your login, subscription status, and account-related tools."
        />

        <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Account access</CardTitle>
              <CardDescription>
                Sign in, create an account, or continue managing your PMRPrep access.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-wrap gap-3">
              <Link href="/login">
                <Button>Login / Signup</Button>
              </Link>

              <Link href="/account/subscription">
                <Button variant="outline">Manage Subscription</Button>
              </Link>
            </CardContent>
          </Card>

          <Card muted className="border-slate-200">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Review your current access and subscription-related settings.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl bg-white px-4 py-3">
                View current access status
              </div>
              <div className="rounded-xl bg-white px-4 py-3">
                Manage subscription details
              </div>
              <div className="rounded-xl bg-white px-4 py-3">
                Review billing-related actions
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Account tools</CardTitle>
              <CardDescription>
                Additional account features can live here as PMRPrep grows.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-slate-900"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/trial"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-slate-900"
              >
                Free Trial
              </Link>
              <Link
                href="/explore-subscriptions"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-slate-900"
              >
                Explore Subscriptions
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
