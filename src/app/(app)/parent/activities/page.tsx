import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAtHomeActivities, getChildOverview, getLinkedChildren } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Activities" };

export default async function ParentActivitiesPage() {
  const user = await getCurrentUser();
  const children = (await getLinkedChildren(user!.profile!.id)).filter((c) => c.status === "approved");

  if (children.length === 0) {
    return (
      <div>
        <PageHeader title="At-home Activities" description="Practical ways to support learning at home." />
        <EmptyState icon={LifeBuoy} title="Link a child first" description="Once you're linked to a child, suggestions will appear here." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="At-home Activities" description="Short, practical ways to support learning — no prep required." />
      {await Promise.all(
        children.map(async (child) => {
          const overview = await getChildOverview(child.studentId);
          const activities = getAtHomeActivities(overview.recentActivity[0]?.eventType ?? null);
          return (
            <Card key={child.studentId}>
              <CardContent>
                <p className="mb-3 font-heading font-semibold">{child.name}</p>
                <ul className="space-y-2">
                  {activities.map((a, i) => (
                    <li key={i} className="rounded-xl bg-accent/40 p-3 text-sm text-accent-foreground">{a}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        }),
      )}
    </div>
  );
}
