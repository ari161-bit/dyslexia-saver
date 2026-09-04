import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ResourceCard } from "@/components/shared/resource-card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getRecentResources } from "@/lib/data/teacher";

export const metadata: Metadata = { title: "Resources" };

export default async function TeacherResourcesPage() {
  const user = await getCurrentUser();
  const resources = await getRecentResources(user!.profile!.id);

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Everything you've uploaded and adapted."
        action={
          <Button asChild>
            <Link href="/teacher/resources/upload"><Plus className="h-4 w-4" /> Upload material</Link>
          </Button>
        }
      />
      {resources.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nothing uploaded yet" description="Upload a worksheet or lesson to start adapting it." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} href={`/teacher/resources/${r.id}/adapt`} title={r.title} subject={r.subject} status={r.status} />
          ))}
        </div>
      )}
    </div>
  );
}
