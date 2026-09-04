import Link from "next/link";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAllTeacherStudents } from "@/lib/data/teacher";

export const metadata: Metadata = { title: "Students" };

export default async function TeacherStudentsPage() {
  const user = await getCurrentUser();
  const students = await getAllTeacherStudents(user!.profile!.id);

  return (
    <div>
      <PageHeader title="Students" description="Everyone enrolled across your classes." />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" description="Students will appear here once they join one of your classes." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link
              key={s.studentId}
              href={`/teacher/students/${s.studentId}`}
              className="rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <p className="font-medium">{s.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.classNames.join(", ")}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
