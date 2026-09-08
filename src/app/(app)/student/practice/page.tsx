import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PracticeSession } from "@/components/practice/practice-session";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPracticeableResources } from "@/lib/data/learning";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage() {
  const user = await getCurrentUser();
  const resources = await getPracticeableResources(user!.profile!.id);

  return (
    <div>
      <PageHeader
        size="lg"
        title="Practice Time 🎯"
        description="Questions made from your own material — nothing made up, always based on what you've actually read."
      />
      <PracticeSession resources={resources} />
    </div>
  );
}
