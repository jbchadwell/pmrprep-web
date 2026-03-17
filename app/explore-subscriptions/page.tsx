"use client";

import Link from "next/link";
import Button from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import PageShell from "@/app/_components/ui/page-shell";

const plans = [
  {
    title: "1 Year",
    price: "$99",
    description: "Perfect for PGY-4s and attendings",
    bullets: [
      "Unlimited questions",
      "Full explanations",
      "Performance analytics",
      "One-time payment",
    ],
  },
  {
    title: "3 Years",
    price: "$160",
    description: "Best value for residents",
    bullets: [
      "Unlimited questions",
      "Covers PGY-2 through boards",
      "Longitudinal analytics",
      "Priority feature access",
    ],
  },
  {
    title: "4 Years",
    price: "$199",
    description: "Maximum access",
    bullets: [
      "Unlimited questions",
      "Entire residency + beyond",
      "All analytics and dashboards",
      "Best overall value",
    ],
  },
];

export default function ExploreSubscriptionsPage() {
  return (
    <PageShell>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Choose the PMRPrep plan that fits your training timeline
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              All paid plans unlock the full PMRPrep experience. Choose the
              subscription length that works best for your residency timeline and
              board preparation.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.title} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="text-2xl font-semibold text-slate-900">
                  {plan.price}
                </div>

                <ul className="space-y-2 text-sm text-slate-700">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Link href="/subscribe" className="block">
                    <Button className="w-full">Choose {plan.title}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>All paid plans include full PMRPrep access</CardTitle>
              <CardDescription>
                The main difference is simply how long you want access.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Full PM&amp;R question bank access</li>
                <li>• Premium custom quiz builder</li>
                <li>• Full dashboard access</li>
                <li>• Future analytics and adaptive study tools</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Subscriptions coming soon</CardTitle>
              <CardDescription>
                Paid checkout is not live yet.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700">
                You can still create an account and complete the free trial now.
              </p>

              <div className="flex flex-col gap-3">
                <Link href="/trial" className="block">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>

                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">
                    Create Account / Log In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="pt-2 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PMRPrep
        </footer>
      </div>
    </PageShell>
  );
}
