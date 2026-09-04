import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolClasses, getSchoolForAdmin } from "@/lib/data/school";

export const metadata: Metadata = { title: "Classes" };

export default async function SchoolClassesPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const classes = await getSchoolClasses(school!.schoolId);

  return (
    <div>
      <PageHeader title="Classes" description="Every class running across the school." />
      {classes.length === 0 ? (
        <EmptyState icon={Building2} title="No classes yet" description="Classes created by teachers will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="font-heading font-semibold">{c.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{c.subject ?? "General"} {c.grade ? `· ${c.grade}` : ""}</p>
              <p className="mt-3 text-xs text-muted-foreground">{c.teacherName} · {c.studentCount} students</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
