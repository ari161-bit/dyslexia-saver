import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAllTeacherAssignments } from "@/lib/data/teacher";

export const metadata: Metadata = { title: "Assignments" };

export default async function TeacherAssignmentsPage() {
  const user = await getCurrentUser();
  const assignments = await getAllTeacherAssignments(user!.profile!.id);

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Track what's been assigned and how students are progressing."
        action={<Button asChild><Link href="/teacher/assignments/new"><Plus className="h-4 w-4" /> New assignment</Link></Button>}
      />
      {assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Create your first assignment for a class." />
      ) : (
        <div className="space-y-2.5">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/teacher/assignments/${a.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card px-4 py-3.5 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.className}{a.dueDate ? ` · Due ${format(new Date(a.dueDate), "MMM d, yyyy")}` : ""}
                </p>
              </div>
              <Badge variant="secondary" className="font-normal">{a.submittedCount}/{a.rosterSize} submitted</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
