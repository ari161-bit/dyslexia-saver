import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNotifications } from "@/lib/data/notifications";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notifications = await getNotifications(user!.profile!.id);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div>
      <PageHeader
        title="Notifications"
        action={
          hasUnread ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="outline" size="sm">Mark all as read</Button>
            </form>
          ) : undefined
        }
      />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="Nothing new right now." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn("rounded-xl border px-4 py-3.5", n.read ? "border-border/60 bg-card" : "border-primary/30 bg-accent/30")}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{n.title}</p>
                <p className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
              {n.body ? <p className="mt-1 text-sm text-muted-foreground">{n.body}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
