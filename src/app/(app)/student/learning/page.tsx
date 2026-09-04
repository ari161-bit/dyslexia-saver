import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ResourceCard } from "@/components/shared/resource-card";
import { JoinClassForm } from "@/components/classes/join-class-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getStudentLearningResources } from "@/lib/data/learning";

export const metadata: Metadata = { title: "My Learning" };

export default async function MyLearningPage() {
  const user = await getCurrentUser();
  const profile = user!.profile!;
  const resources = await getStudentLearningResources(profile.id);

  return (
    <div>
      <PageHeader
        title="My Learning"
        description="Everything shared with you or uploaded by you, in one place."
        action={
          <Button asChild>
            <Link href="/student/learning/upload">
              <Plus className="h-4 w-4" /> Upload a page
            </Link>
          </Button>
        }
      />
      <Card className="mb-6">
        <CardContent>
          <JoinClassForm />
        </CardContent>
      </Card>
      {resources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing here yet"
          description="Once your teacher assigns something, or you upload your own material, it'll show up here."
          action={
            <Button asChild size="sm">
              <Link href="/student/learning/upload">Upload your first page</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard
              key={r.id}
              href={`/read/${r.id}`}
              title={r.title}
              subject={r.subject}
              status={r.status}
              tag={r.source === "assigned" ? "Assigned" : "Mine"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
