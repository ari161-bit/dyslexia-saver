import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getResource } from "@/lib/data/resources";
import { recordProgressEvent } from "@/lib/data/student";
import { LessonPathways } from "@/components/reader/lesson-pathways";

const VALID_TABS = new Set(["read", "listen", "simplify", "practice"]);

export default async function LessonPathwaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ resourceId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { resourceId } = await params;
  const { tab } = await searchParams;
  const user = await getCurrentUser();
  if (!user?.profile) notFound();

  const resource = await getResource(resourceId);
  if (!resource) notFound();

  if (user.profile.role === "student") {
    recordProgressEvent(user.profile.id, "reading_session", resourceId).catch(() => {});
  }

  return (
    <LessonPathways
      resource={resource}
      fullText={resource.extracted_text ?? ""}
      initialTab={tab && VALID_TABS.has(tab) ? tab : "read"}
    />
  );
}
