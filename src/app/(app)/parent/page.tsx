import Link from "next/link";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { Baby, LifeBuoy, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAtHomeActivities, getChildOverview, getLinkedChildren } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Home" };

const EVENT_LABEL: Record<string, string> = {
  reading_session: "read",
  practice_completed: "completed a practice question in",
  note_saved: "saved a note on",
};

export default async function ParentHomePage() {
  const user = await getCurrentUser();
  const profile = user!.profile!;
  const children = (await getLinkedChildren(profile.id)).filter((c) => c.status === "approved");

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome back, ${profile.first_name}`} description="Here's how learning is going." />

      {children.length === 0 ? (
        <EmptyState
          icon={Baby}
          title="No children linked yet"
          description="Ask your child for their student code to request a link."
          action={<Button asChild size="sm"><Link href="/parent/children">Link a child</Link></Button>}
        />
      ) : (
        <div className="space-y-6">
          {await Promise.all(
            children.map(async (child) => {
              const overview = await getChildOverview(child.studentId);
              const activities = getAtHomeActivities(overview.recentActivity[0]?.eventType ?? null);
              return (
                <Card key={child.studentId}>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-heading text-lg font-semibold">{child.name} — Learning Overview</p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/parent/children/${child.studentId}`}>Full overview</Link>
                      </Button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Current Focus</p>
                      <p className="mt-1 text-sm">{overview.currentFocus ?? "No recent activity yet."}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Recent Activity</p>
                      {overview.recentActivity.length === 0 ? (
                        <p className="mt-1 text-sm text-muted-foreground">Nothing logged yet.</p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                          {overview.recentActivity.slice(0, 3).map((a, i) => (
                            <li key={i}>
                              {child.name.split(" ")[0]} {EVENT_LABEL[a.eventType] ?? "worked on"} {a.resourceTitle ?? "a lesson"} ·{" "}
                              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-xl bg-accent/40 p-3.5">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
                        <LifeBuoy className="h-4 w-4" /> Try this at home
                      </p>
                      <p className="mt-1 text-sm text-accent-foreground/90">{activities[0]}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            }),
          )}
        </div>
      )}

      <Card>
        <CardContent className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <MessageSquare className="h-4 w-4" /> Teacher updates
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/parent/messages">Open messages</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
