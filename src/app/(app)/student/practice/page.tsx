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
        title="Practice"
        description="Questions generated from your own material — never made up, always grounded in what you've read."
      />
      <PracticeSession resources={resources} />
    </div>
  );
}
