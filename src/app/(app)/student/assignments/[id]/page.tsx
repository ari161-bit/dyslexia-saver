import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SubmissionForm } from "@/components/assignments/submission-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAssignmentDetail } from "@/lib/data/assignments";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const detail = await getAssignmentDetail(id, user!.profile!.id);
  if (!detail) notFound();

  const { assignment, className, resource, submission } = detail;
  const content = (submission?.content as { text?: string } | null)?.text ?? "";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={assignment.title}
        description={`${className}${assignment.subject ? ` · ${assignment.subject}` : ""}${
          assignment.due_date ? ` · Due ${format(new Date(assignment.due_date), "MMM d, yyyy")}` : ""
        }`}
      />

      <div className="space-y-6">
        {assignment.instructions ? (
          <Card>
            <CardContent>
              <p className="text-sm font-semibold text-muted-foreground">Instructions</p>
              <p className="mt-2 whitespace-pre-line text-sm">{assignment.instructions}</p>
            </CardContent>
          </Card>
        ) : null}

        {resource ? (
          <Card>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">{resource.title}</p>
                  <p className="text-xs text-muted-foreground">Open with your reading preferences</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/read/${resource.id}`}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Your response</p>
            <SubmissionForm assignmentId={assignment.id} initialContent={content} status={submission?.status ?? "not_started"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
