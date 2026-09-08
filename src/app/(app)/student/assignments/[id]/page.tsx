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
        size="lg"
        title={assignment.title}
        description={`${className}${assignment.subject ? ` · ${assignment.subject}` : ""}${
          assignment.due_date ? ` · Due ${format(new Date(assignment.due_date), "MMM d, yyyy")}` : ""
        }`}
      />

      <div className="space-y-6">
        {assignment.instructions ? (
          <Card className="rounded-3xl border-2">
            <CardContent className="p-6">
              <p className="text-base font-bold text-primary">📋 Instructions</p>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed">{assignment.instructions}</p>
            </CardContent>
          </Card>
        ) : null}

        {resource ? (
          <Card className="rounded-3xl border-2">
            <CardContent className="flex items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <BookOpen className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-base font-bold">{resource.title}</p>
                  <p className="text-sm text-muted-foreground">Opens set up just how you like to read</p>
                </div>
              </div>
              <Button variant="outline" className="h-12 rounded-2xl px-5 text-base font-bold" asChild>
                <Link href={`/read/${resource.id}`}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-3xl border-2">
          <CardContent className="p-6">
            <p className="mb-4 text-base font-bold text-primary">✏️ Your answer</p>
            <SubmissionForm assignmentId={assignment.id} initialContent={content} status={submission?.status ?? "not_started"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
