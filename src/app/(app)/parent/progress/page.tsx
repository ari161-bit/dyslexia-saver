import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ActivityChart } from "@/components/progress/activity-chart";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getLinkedChildren } from "@/lib/data/parent";
import { getProgressTimeline, getWeeklyProgress } from "@/lib/data/student";

export const metadata: Metadata = { title: "Progress" };

export default async function ParentProgressPage() {
  const user = await getCurrentUser();
  const children = (await getLinkedChildren(user!.profile!.id)).filter((c) => c.status === "approved");

  if (children.length === 0) {
    return (
      <div>
        <PageHeader title="Progress" description="A picture of your child's practice — never a score." />
        <EmptyState icon={BarChart3} title="Link a child first" description="Once linked, progress trends will show up here." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="A picture of practice and engagement — never a score." />
      {await Promise.all(
        children.map(async (child) => {
          const [weekly, timeline] = await Promise.all([
            getWeeklyProgress(child.studentId),
            getProgressTimeline(child.studentId),
          ]);
          return (
            <Card key={child.studentId}>
              <CardContent>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-heading font-semibold">{child.name}</p>
                  <p className="text-sm text-muted-foreground">{weekly.activitiesCompleted} activities this week</p>
                </div>
                <ActivityChart data={timeline} />
              </CardContent>
            </Card>
          );
        }),
      )}
    </div>
  );
}
