import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getChildrenResources } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Resources" };

export default async function ParentResourcesPage() {
  const user = await getCurrentUser();
  const resources = await getChildrenResources(user!.profile!.id);

  return (
    <div>
      <PageHeader title="Resources" description="Material your child's teachers have shared." />
      {resources.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nothing shared yet" description="Resources assigned to your child will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div key={`${r.id}-${r.childName}`} className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="font-medium">{r.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.subject ?? "General"}</p>
              <Badge variant="secondary" className="mt-3 font-normal">{r.childName}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
