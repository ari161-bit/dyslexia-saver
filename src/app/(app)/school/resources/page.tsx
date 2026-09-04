import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolForAdmin, getSchoolResources } from "@/lib/data/school";

export const metadata: Metadata = { title: "Resources" };

export default async function SchoolResourcesPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const resources = await getSchoolResources(school!.schoolId);

  return (
    <div>
      <PageHeader title="Learning Resources" description="Material uploaded by teachers across the school." />
      {resources.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nothing uploaded yet" description="Resources uploaded by teachers will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="font-medium">{r.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.subject ?? "General"} · {r.ownerName}</p>
              <Badge variant="outline" className="mt-3 font-normal">{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
