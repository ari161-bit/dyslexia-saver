import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateClassDialog } from "@/components/classes/create-class-dialog";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getTeacherClasses } from "@/lib/data/teacher";

export const metadata: Metadata = { title: "Classes" };

export default async function TeacherClassesPage() {
  const user = await getCurrentUser();
  const classes = await getTeacherClasses(user!.profile!.id);

  return (
    <div>
      <PageHeader title="Classes" description="Manage your classes and rosters." action={<CreateClassDialog />} />
      {classes.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No classes yet" description="Create your first class to start adding students." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/classes/${c.id}`}
              className="rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <p className="font-heading text-lg font-semibold">{c.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{c.subject ?? "General"} {c.grade ? `· ${c.grade}` : ""}</p>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {c.studentCount} students
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
