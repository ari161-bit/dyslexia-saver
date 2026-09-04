import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardList, LifeBuoy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertParentLinked, getAtHomeActivities, getChildOverview } from "@/lib/data/parent";

const EVENT_LABEL: Record<string, string> = {
  reading_session: "Read a passage",
  practice_completed: "Completed a practice question",
  note_saved: "Saved a note",
};

export default async function ChildOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const linked = await assertParentLinked(user!.profile!.id, id);
  if (!linked) notFound();

  const overview = await getChildOverview(id);
  const activities = getAtHomeActivities(overview.recentActivity[0]?.eventType ?? null);

  return (
    <div className="space-y-6">
      <PageHeader title={`${overview.name} — Learning Overview`} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <ClipboardList className="h-4 w-4" /> Recent Activity
            </p>
            {overview.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
            ) : (
              <div className="space-y-2">
                {overview.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <span>{EVENT_LABEL[a.eventType] ?? a.eventType}{a.resourceTitle ? ` — ${a.resourceTitle}` : ""}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Upcoming Assignments</p>
            {overview.upcomingAssignments.length === 0 ? (
              <EmptyState className="border-none bg-transparent py-4" icon={ClipboardList} title="Nothing due" />
            ) : (
              <div className="space-y-2">
                {overview.upcomingAssignments.map((a) => (
                  <div key={a.id} className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.className}{a.dueDate ? ` · Due ${format(new Date(a.dueDate), "MMM d")}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <LifeBuoy className="h-4 w-4" /> Ways to help at home
          </p>
          <ul className="space-y-2 text-sm">
            {activities.map((a, i) => (
              <li key={i} className="rounded-xl bg-accent/40 p-3 text-accent-foreground">{a}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Want to ask the teacher something? <Link href="/parent/messages" className="font-medium text-primary hover:underline">Send a message</Link>
      </p>
    </div>
  );
}
