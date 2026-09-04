import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TeacherRequestActions } from "@/components/school/teacher-request-actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolForAdmin, getSchoolTeachers } from "@/lib/data/school";

export const metadata: Metadata = { title: "Teachers" };

export default async function SchoolTeachersPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const teachers = await getSchoolTeachers(school!.schoolId);

  return (
    <div>
      <PageHeader title="Teachers" description="Approve new teacher accounts and manage staff." />
      {teachers.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No teachers yet" description="Teachers who select your school at signup will appear here." />
      ) : (
        <div className="space-y-2.5">
          {teachers.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3.5">
              <div className="flex items-center gap-3">
                <p className="font-medium">{t.name}</p>
                <Badge variant={t.status === "approved" ? "default" : "secondary"} className="font-normal">
                  {t.status === "approved" ? "Active" : t.status === "pending" ? "Pending" : "Declined"}
                </Badge>
              </div>
              {t.status === "pending" ? <TeacherRequestActions membershipId={t.id} /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
