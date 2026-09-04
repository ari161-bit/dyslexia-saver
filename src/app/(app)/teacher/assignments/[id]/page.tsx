import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SubmissionReviewRow } from "@/components/assignments/submission-review-row";
import { getAssignmentSubmissions } from "@/lib/data/assignments";

export default async function AssignmentReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAssignmentSubmissions(id);
  if (!detail) notFound();

  const { assignment, className, submissions } = detail;
  const submittedCount = submissions.filter((s) => s.status === "submitted" || s.status === "reviewed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        description={`${className}${assignment.due_date ? ` · Due ${format(new Date(assignment.due_date), "MMM d, yyyy")}` : ""} · ${submittedCount}/${submissions.length} submitted`}
      />

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Submissions</p>
          <div className="space-y-2">
            {submissions.map((s) => (
              <SubmissionReviewRow
                key={s.id}
                studentName={s.studentName}
                status={s.status}
                submissionId={s.id}
                assignmentId={assignment.id}
                content={(s.content as { text?: string } | null)?.text ?? null}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
