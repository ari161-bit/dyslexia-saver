import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getStudentClasses } from "@/lib/data/class-stream";

export const metadata: Metadata = { title: "Classroom" };

export default async function StudentClassroomPage() {
  const user = await getCurrentUser();
  const classes = await getStudentClasses(user!.profile!.id);

  return (
    <div>
      <PageHeader size="lg" title="Classroom 🏫" description="See what your teacher shared and join the conversation." />
      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes yet"
          description="Once you join a class with a code, its stream will show up here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/student/classroom/${c.id}`}
              className="rounded-3xl border-2 border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/30"
            >
              <p className="font-heading text-lg font-bold">{c.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.subject ?? "General"}</p>
              <p className="mt-3 text-xs text-muted-foreground">{c.teacherName}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
