import type { Metadata } from "next";
import { BarChart3, CheckCircle2, ClipboardList, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportAnalyticsButton } from "@/components/school/export-analytics-button";
import { StatCard } from "@/components/school/stat-card";
import { WeeklyTrendChart } from "@/components/school/weekly-trend-chart";
import { CompletionRing } from "@/components/school/completion-ring";
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
        <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <StatCard icon={<Users />} value={stats.students} label="Students" color={1} delay={0} />
          <StatCard icon={<ClipboardList />} value={stats.assignments} label="Assignments created" color={2} delay={0.05} />
          <StatCard icon={<CheckCircle2 />} value={stats.accessibilityUsage} label="Using accessibility settings" color={3} delay={0.1} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Sparkles className="h-4 w-4 text-chart-3" /> AI adaptation usage
            </p>
            <p className="text-xs text-muted-foreground">How much teachers rely on AI-generated adaptations.</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <StatCard icon={<Sparkles />} value={aiUsage.adaptationsGenerated} label="Adaptations generated" color={3} />
              <StatCard icon={<CheckCircle2 />} value={aiUsage.adaptationsApproved} label="Approved for students" color={2} delay={0.05} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-chart-1" /> Assignment completion
            </p>
            <p className="text-xs text-muted-foreground">Submissions received against assignments created.</p>
            <div className="mt-4 flex items-center gap-5">
              <CompletionRing percent={completionRate} />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{completion.submissionsReceived}</span> submitted ·{" "}
                <span className="font-semibold text-foreground">{completion.submissionsReviewed}</span> reviewed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-chart-1" /> Weekly active students
          </p>
          <p className="mb-4 text-xs text-muted-foreground">Distinct students with at least one activity that week.</p>
          {trend.every((w) => w.activeStudents === 0) ? (
            <EmptyState className="border-none bg-transparent py-4" icon={BarChart3} title="No activity yet" />
          ) : (
            <WeeklyTrendChart trend={trend} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-chart-1" /> Class-level resource usage
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
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-chart-1/70 to-chart-1 transition-all duration-700"
                      style={{ width: `${(c.studentCount / maxClass) * 100}%` }}
                    />
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
