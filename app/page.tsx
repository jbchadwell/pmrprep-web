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
    highlight: true,
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

export default function HomePage() {
  function handleComingSoon() {
    alert(
      "Coming soon. Right now, try our free trial and we will let you know when subscriptions are ready."
    );
  }

  return (
    <PageShell>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              PMRPrep
            </h1>

            <Link href="/trial">
              <Button size="lg">Start Free Trial</Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.title}
              className={[
                "h-full border-slate-200 shadow-sm",
                plan.highlight ? "border-blue-500 bg-blue-50" : "",
              ].join(" ")}
            >
              <CardHeader>
                <CardTitle>{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex h-full flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="text-2xl font-semibold text-slate-900">
                    {plan.price}
                  </div>

                  <ul className="space-y-2 text-sm text-slate-700">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet}>• {bullet}</li>
                    ))}
                  </ul>
                </div>

                <Button className="w-full" onClick={handleComingSoon}>
                  Choose Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <footer className="pt-2 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PMRPrep
        </footer>
      </div>
    </PageShell>
  );
}
