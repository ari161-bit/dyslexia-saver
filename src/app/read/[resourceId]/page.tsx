import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNotesForResource, getResource, resourceSections } from "@/lib/data/resources";
import { getReadingPreferences } from "@/lib/data/reading-preferences";
import { recordProgressEvent } from "@/lib/data/student";
import { ReaderView } from "@/components/reader/reader-view";

export default async function ReadResourcePage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const user = await getCurrentUser();
  if (!user?.profile) notFound();

  const resource = await getResource(resourceId);
  if (!resource) notFound();

  const [prefs, notes] = await Promise.all([
    getReadingPreferences(user.profile.id),
    getNotesForResource(user.profile.id, resourceId),
  ]);

  if (user.profile.role === "student") {
    recordProgressEvent(user.profile.id, "reading_session", resourceId).catch(() => {});
  }

  return (
    <ReaderView
      resource={resource}
      sections={resourceSections(resource)}
      initialPreferences={prefs}
      notes={notes}
    />
  );
}
