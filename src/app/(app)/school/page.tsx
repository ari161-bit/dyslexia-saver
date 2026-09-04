import type { Metadata } from "next";
import { BookOpenCheck, ClipboardList, FolderOpen, GraduationCap, School, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolForAdmin, getSchoolOverviewStats } from "@/lib/data/school";

export const metadata: Metadata = { title: "Overview" };

export default async function SchoolOverviewPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const stats = await getSchoolOverviewStats(school!.schoolId);

  return (
    <div>
      <PageHeader title={school!.schoolName} description="A school-wide view of learning and accessibility." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Students" value={stats.students} icon={Users} />
        <StatCard label="Teachers" value={stats.teachers} icon={GraduationCap} />
        <StatCard label="Classes" value={stats.classes} icon={School} />
        <StatCard label="Active resources" value={stats.resources} icon={FolderOpen} />
        <StatCard label="Assignments" value={stats.assignments} icon={ClipboardList} />
        <StatCard label="Using accessibility settings" value={stats.accessibilityUsage} icon={BookOpenCheck} />
      </div>
    </div>
  );
}
