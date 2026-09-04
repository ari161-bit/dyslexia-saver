import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AssignmentRow } from "@/components/shared/assignment-row";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getStudentAssignments } from "@/lib/data/assignments";

export const metadata: Metadata = { title: "Assignments" };

export default async function StudentAssignmentsPage() {
  const user = await getCurrentUser();
  const assignments = await getStudentAssignments(user!.profile!.id);

  return (
    <div>
      <PageHeader title="Assignments" description="Everything your teachers have shared with you." />
      {assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" description="Your teacher hasn't shared anything here yet." />
      ) : (
        <div className="space-y-2.5">
          {assignments.map((a) => (
            <AssignmentRow
              key={a.id}
              href={`/student/assignments/${a.id}`}
              title={a.title}
              subject={a.subject}
              className={a.className}
              dueDate={a.dueDate}
              status={a.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
