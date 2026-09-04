import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolClasses, getSchoolForAdmin, getSchoolOverviewStats } from "@/lib/data/school";

export const metadata: Metadata = { title: "Analytics" };

export default async function SchoolAnalyticsPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const [stats, classes] = await Promise.all([
    getSchoolOverviewStats(school!.schoolId),
    getSchoolClasses(school!.schoolId),
  ]);
  const max = Math.max(1, ...classes.map((c) => c.studentCount));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Aggregated, school-wide — never drilled down to a single student's private data." />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className="text-2xl font-semibold">{stats.students}</p><p className="text-xs text-muted-foreground">Students</p></div>
          <div><p className="text-2xl font-semibold">{stats.assignments}</p><p className="text-xs text-muted-foreground">Assignments created</p></div>
          <div><p className="text-2xl font-semibold">{stats.accessibilityUsage}</p><p className="text-xs text-muted-foreground">Using accessibility settings</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <BarChart3 className="h-4 w-4" /> Class-level resource usage
          </p>
          {classes.length === 0 ? (
            <EmptyState className="border-none bg-transparent py-4" icon={BarChart3} title="Nothing to show yet" />
          ) : (
            <div className="space-y-3">
              {classes.map((c) => (
                <div key={c.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.studentCount} students</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(c.studentCount / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
