import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CreateAssignmentForm } from "@/components/assignments/create-assignment-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getTeacherClasses } from "@/lib/data/teacher";
import { getResource } from "@/lib/data/resources";

export const metadata: Metadata = { title: "New assignment" };

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; resourceId?: string }>;
}) {
  const { classId, resourceId } = await searchParams;
  const user = await getCurrentUser();
  const classes = await getTeacherClasses(user!.profile!.id);
  const resource = resourceId ? await getResource(resourceId) : null;

  return (
    <div>
      <PageHeader title="New assignment" description="Share material with a class and set expectations." />
      <CreateAssignmentForm
        classes={classes}
        defaultClassId={classId}
        resourceId={resource?.id}
        resourceTitle={resource?.title}
      />
    </div>
  );
}
