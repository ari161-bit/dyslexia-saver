import type { Metadata } from "next";
import { format } from "date-fns";
import { Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AnnouncementForm } from "@/components/school/announcement-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolAnnouncementHistory, getSchoolForAdmin } from "@/lib/data/school";

export const metadata: Metadata = { title: "Announcements" };

export default async function SchoolAnnouncementsPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const history = await getSchoolAnnouncementHistory(user!.profile!.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Send an update to everyone in your school." />

      <Card>
        <CardContent>
          <AnnouncementForm schoolId={school!.schoolId} />
        </CardContent>
      </Card>

      {history.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements sent yet" />
      ) : (
        <div className="space-y-2.5">
          {history.map((a) => (
            <Card key={a.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(a.createdAt), "MMM d, yyyy")}</p>
                </div>
                {a.body ? <p className="mt-1 text-sm text-muted-foreground">{a.body}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
