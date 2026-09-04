import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ClipboardList, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CopyCodeButton } from "@/components/classes/copy-code-button";
import { getClassDetail } from "@/lib/data/teacher";

export default async function TeacherClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getClassDetail(id);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.name}
        description={`${detail.subject ?? "General"}${detail.grade ? ` · ${detail.grade}` : ""}`}
        action={
          <Button asChild>
            <Link href={`/teacher/assignments/new?classId=${detail.id}`}>
              <Plus className="h-4 w-4" /> New assignment
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Class join code</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-widest">{detail.joinCode}</p>
            <p className="mt-1 text-xs text-muted-foreground">Share this with students so they can join the class themselves.</p>
          </div>
          <CopyCodeButton code={detail.joinCode} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Users className="h-4 w-4" /> Students ({detail.roster.length})
            </p>
            {detail.roster.length === 0 ? (
              <EmptyState
                className="border-none bg-transparent py-6"
                icon={Users}
                title="No students yet"
                description="Share the join code above to get your first students in."
              />
            ) : (
              <div className="space-y-1.5">
                {detail.roster.map((s) => (
                  <Link
                    key={s.studentId}
                    href={`/teacher/students/${s.studentId}`}
                    className="block rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <ClipboardList className="h-4 w-4" /> Assignments
            </p>
            {detail.assignments.length === 0 ? (
              <EmptyState className="border-none bg-transparent py-6" icon={ClipboardList} title="No assignments yet" />
            ) : (
              <div className="space-y-1.5">
                {detail.assignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/teacher/assignments/${a.id}`}
                    className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <span>{a.title}</span>
                    {a.dueDate ? <span className="text-xs text-muted-foreground">Due {format(new Date(a.dueDate), "MMM d")}</span> : null}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
