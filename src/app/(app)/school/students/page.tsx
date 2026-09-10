import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateStudentDialog } from "@/components/students/create-student-dialog";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolClasses, getSchoolForAdmin, getSchoolStudents } from "@/lib/data/school";

export const metadata: Metadata = { title: "Students" };

export default async function SchoolStudentsPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const [students, classes] = await Promise.all([
    getSchoolStudents(school!.schoolId),
    getSchoolClasses(school!.schoolId),
  ]);

  return (
    <div>
      <PageHeader
        title="Students"
        description="Everyone in the school, across every class."
        action={<CreateStudentDialog classes={classes.map((c) => ({ id: c.id, name: c.name }))} />}
      />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" description="Create an account, or students appear here once they join a class." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <div key={s.studentId} className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="font-medium">{s.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.classNames.length > 0 ? s.classNames.join(", ") : "Not in a class yet"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
