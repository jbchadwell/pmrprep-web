"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import PageHeader from "@/app/_components/ui/page-header";
import PageShell from "@/app/_components/ui/page-shell";
import Select from "@/app/_components/ui/select";

const CUSTOM_KEY = "pmrprep_custom_quiz_config";

const CATEGORY_OPTIONS = [
  "Amputations, Prosthetics, Orthotics and Gait",
  "Electrodiagnostics",
  "Legal, Industrial Rehabilitation, and Ethics",
  "Medical Rehabilitation",
  "Musculoskeletal",
  "Pain Management",
  "Pediatrics",
  "Rheumatology",
  "Spinal Cord Injury",
  "Statistics",
  "Stroke, Speech, Swallowing, and Other Neurologic Disorders",
  "Traumatic Brain Injury",
];

export default function BuilderPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(10);

  function toggleCategory(cat: string) {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]
    );
  }

  function startQuiz() {
    if (selected.length === 0) return;

    const config = {
      count,
      primaryCategories: selected,
    };

    localStorage.setItem(CUSTOM_KEY, JSON.stringify(config));
    router.push("/quiz?mode=custom&fresh=1&src=builder");
  }

  return (
    <PageShell className="max-w-5xl">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Quiz Builder"
          title="Build a custom quiz"
          description="Choose your study categories and question count, then launch directly into a focused PMRPrep session."
          actions={
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/quiz">
                <Button variant="ghost">Resume Quiz</Button>
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Primary categories</CardTitle>
              <CardDescription>
                Select one or more content areas to build your custom study session.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-3">
                {CATEGORY_OPTIONS.map((cat) => {
                  const active = selected.includes(cat);

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={
                        active
                          ? "rounded-full border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm"
                          : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-slate-900"
                      }
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Quiz settings</CardTitle>
              <CardDescription>
                Finalize your session and launch into the quiz engine.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">
                  Question count
                </label>
                <Select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  <option value={10}>10 questions</option>
                  <option value={20}>20 questions</option>
                  <option value={25}>25 questions</option>
                  <option value={50}>50 questions</option>
                </Select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium text-slate-900">
                  {selected.length} categor{selected.length === 1 ? "y" : "ies"} selected
                </div>
                <div className="mt-1 text-slate-600">
                  {selected.length > 0
                    ? selected.join(", ")
                    : "Select at least one category to start a custom quiz."}
                </div>
              </div>

              <Button
                onClick={startQuiz}
                disabled={selected.length === 0}
                className="w-full"
                size="lg"
              >
                Start quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
