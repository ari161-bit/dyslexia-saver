import type { Metadata } from "next";
import { format } from "date-fns";
import { BarChart3, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportAnalyticsButton } from "@/components/school/export-analytics-button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getSchoolClasses,
  getSchoolForAdmin,
  getSchoolOverviewStats,
  getSchoolEngagementTrend,
  getSchoolAIUsage,
  getSchoolCompletionStats,
} from "@/lib/data/school";

export const metadata: Metadata = { title: "Analytics" };

export default async function SchoolAnalyticsPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const [stats, classes, trend, aiUsage, completion] = await Promise.all([
    getSchoolOverviewStats(school!.schoolId),
    getSchoolClasses(school!.schoolId),
    getSchoolEngagementTrend(school!.schoolId),
    getSchoolAIUsage(school!.schoolId),
    getSchoolCompletionStats(school!.schoolId),
  ]);
  const maxClass = Math.max(1, ...classes.map((c) => c.studentCount));
  const maxTrend = Math.max(1, ...trend.map((w) => w.activeStudents));
  const completionRate = completion.assignmentsCreated > 0 ? Math.round((completion.submissionsReceived / completion.assignmentsCreated) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Aggregated, school-wide — never drilled down to a single student's private data."
        action={
          <ExportAnalyticsButton
            schoolName={school!.schoolName}
            stats={stats}
            classes={classes}
            trend={trend}
            aiUsage={aiUsage}
            completion={completion}
          />
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div><p className="text-2xl font-semibold">{stats.students}</p><p className="text-xs text-muted-foreground">Students</p></div>
          <div><p className="text-2xl font-semibold">{stats.assignments}</p><p className="text-xs text-muted-foreground">Assignments created</p></div>
          <div><p className="text-2xl font-semibold">{stats.accessibilityUsage}</p><p className="text-xs text-muted-foreground">Using accessibility settings</p></div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Sparkles className="h-4 w-4" /> AI adaptation usage
            </p>
            <p className="text-xs text-muted-foreground">How much teachers rely on AI-generated adaptations.</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div><p className="text-2xl font-semibold">{aiUsage.adaptationsGenerated}</p><p className="text-xs text-muted-foreground">Adaptations generated</p></div>
              <div><p className="text-2xl font-semibold">{aiUsage.adaptationsApproved}</p><p className="text-xs text-muted-foreground">Approved for students</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <BarChart3 className="h-4 w-4" /> Assignment completion
            </p>
            <p className="text-xs text-muted-foreground">Submissions received against assignments created.</p>
            <div className="mt-4 flex items-center gap-4">
              <p className="text-3xl font-semibold">{completionRate}%</p>
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, completionRate)}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {completion.submissionsReceived} submitted · {completion.submissionsReviewed} reviewed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Weekly active students
          </p>
          <p className="mb-4 text-xs text-muted-foreground">Distinct students with at least one activity that week.</p>
          {trend.every((w) => w.activeStudents === 0) ? (
            <EmptyState className="border-none bg-transparent py-4" icon={TrendingUp} title="No activity yet" />
          ) : (
            <div className="flex h-32 items-end gap-2">
              {trend.map((w) => (
                <div key={w.weekStart} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-24 w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-primary transition-all"
                      style={{ height: `${Math.max(4, (w.activeStudents / maxTrend) * 100)}%` }}
                      title={`${w.activeStudents} active students`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(w.weekStart), "MMM d")}</span>
                </div>
              ))}
            </div>
          )}
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
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(c.studentCount / maxClass) * 100}%` }} />
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
