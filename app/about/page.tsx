import PageShell from "@/app/_components/ui/page-shell";
import PageHeader from "@/app/_components/ui/page-header";
import { Card, CardContent } from "@/app/_components/ui/card";

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        title="About PMRPrep"
        description="A focused question bank for PM&R board preparation."
      />

      <div className="space-y-6">

        <Card>
          <CardContent className="space-y-4 pt-6">
            <p>
              PMRPrep is a focused question bank built specifically for physicians preparing
              for the <strong>American Board of Physical Medicine and Rehabilitation (ABPMR)</strong> examinations.
            </p>

            <p>
              The platform is designed to provide a clean and efficient study environment centered
              around board-style questions and explanations relevant to PM&amp;R training.
              PMRPrep was created by a <strong>PM&amp;R resident</strong> with the goal of expanding the number
              of high-quality board-style questions available within the specialty.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold">What PMRPrep Allows You To Do</h3>

            <ul className="list-disc pl-6 space-y-1">
              <li>study board-style PM&amp;R questions</li>
              <li>generate randomized quizzes</li>
              <li>build custom quizzes by topic</li>
              <li>review explanations and flagged questions</li>
              <li>continue quizzes across study sessions</li>
            </ul>

            <p>
              Each question also includes the ability for users to submit feedback. This feedback
              is used to continuously refine explanations, improve question clarity, and identify
              areas where additional questions should be added.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold">Why PMRPrep Was Created</h3>

            <p>
              PMRPrep was created after noticing a common challenge among PM&amp;R residents
              preparing for board examinations.
            </p>

            <p>
              Many residents work through the available PM&amp;R question banks during their
              second or third year of residency and eventually begin repeating the same
              questions multiple times. While repetition can reinforce learning, it also
              limits exposure to new clinical scenarios and board-style problem solving.
            </p>

            <p>
              PMRPrep was created to expand the number of available PM&amp;R board-style
              questions and provide residents with a larger pool of material to practice
              with as they prepare for certification. The question bank will continue to
              grow over time as new questions are written and existing questions are
              refined based on user feedback.
            </p>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
