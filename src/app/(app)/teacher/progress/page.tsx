import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getClassProgressSummaries } from "@/lib/data/teacher";

export const metadata: Metadata = { title: "Progress" };

export default async function TeacherProgressPage() {
  const user = await getCurrentUser();
  const summaries = await getClassProgressSummaries(user!.profile!.id);
  const max = Math.max(1, ...summaries.map((s) => s.activitiesLast7Days));

  return (
    <div>
      <PageHeader title="Progress" description="Engagement across your classes over the last 7 days." />
      {summaries.length === 0 ? (
        <EmptyState icon={BarChart3} title="Nothing to show yet" description="Once your classes have students, activity trends will appear here." />
      ) : (
        <Card>
          <CardContent className="space-y-4">
            {summaries.map((s) => (
              <div key={s.classId}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{s.className}</span>
                  <span className="text-muted-foreground">{s.activitiesLast7Days} activities · {s.studentCount} students</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(s.activitiesLast7Days / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
