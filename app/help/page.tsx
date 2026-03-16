import PageShell from "@/app/_components/ui/page-shell";
import PageHeader from "@/app/_components/ui/page-header";
import { Card, CardContent } from "@/app/_components/ui/card";

export default function HelpPage() {
  return (
    <PageShell>
      <PageHeader
        title="Help & Support"
        description="Learn how to use PMRPrep and get help if you need it."
      />

      <div className="space-y-6">

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold text-slate-900">Getting Started</h3>

            <p>
              PMRPrep is designed to make it easy to begin studying quickly.
            </p>

            <p>
              From the dashboard, users can begin a new question session, resume a
              previous quiz, or create a custom quiz focused on specific PM&amp;R topics.
              The platform is designed to support both quick study sessions and more
              structured board preparation.
            </p>

            <p>
              If you are new to PMRPrep, the free trial is the best way to explore the
              platform and question style before purchasing a subscription.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold text-slate-900">Question Feedback</h3>

            <p>
              Every question includes the option to submit feedback.
            </p>

            <p>
              Feedback can be used to report unclear wording, suggest improvements to
              explanations, or identify possible issues with a question.
            </p>

            <p>
              Submitted feedback helps improve the quality of the question bank over
              time and assists with identifying opportunities for additional questions
              to be added.
            </p>

            <p>
              The PMRPrep question bank is continuously updated and refined as new
              questions are written and existing questions are improved.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold text-slate-900">Accounts and Subscriptions</h3>

            <p>
              PMRPrep provides subscription access to the full PM&amp;R question bank
              and study tools available on the platform.
            </p>

            <p>
              Users can manage their subscription, review account details, and access
              their study history through the account section of the site.
            </p>

            <p>
              The subscription model allows PMRPrep to continue expanding the number
              of available PM&amp;R board-style questions while maintaining and improving
              the platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold text-slate-900">Contact</h3>

            <p>
              PMRPrep is a small company, and we welcome questions, feedback, and
              suggestions from users.
            </p>

            <p>
              You can text our business phone at <strong>+1 (859) 528-2982</strong>.
            </p>

            <p>
              You can also email us at <strong>contact@pmrprep.com</strong>.
            </p>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
