import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { LinkRequestActions } from "@/components/teacher/link-request-actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getStudentProfileForTeacher } from "@/lib/data/teacher";

const EVENT_LABEL: Record<string, string> = {
  reading_session: "Read a passage",
  practice_completed: "Completed a practice question",
  note_saved: "Saved a note",
};

export default async function TeacherStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const student = await getStudentProfileForTeacher(user!.profile!.id, id);
  if (!student) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={student.name} description={student.classNames.join(", ")} />

      {student.pendingParentLinks.length > 0 ? (
        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Parent link requests</p>
            <div className="space-y-2">
              {student.pendingParentLinks.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5 text-sm">
                  <span>{p.parentName} wants to link as a parent</span>
                  <LinkRequestActions linkId={p.id} studentId={student.studentId} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Recent activity</p>
          {student.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity — may benefit from a check-in or additional support.
            </p>
          ) : (
            <div className="space-y-2">
              {student.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <span>{EVENT_LABEL[a.eventType] ?? a.eventType}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
