import { Clock } from "lucide-react";
import { requireRole } from "@/lib/auth/get-current-user";
import { getSchoolForAdmin } from "@/lib/data/school";
import { EmptyState } from "@/components/shared/empty-state";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("school_admin");
  const school = await getSchoolForAdmin(user.profile.id);

  if (!school || school.status !== "approved") {
    return (
      <EmptyState
        icon={Clock}
        title="Verification pending"
        description={`${school?.schoolName ?? "Your school"} is still being verified. This usually takes a short while — check back soon.`}
      />
    );
  }

  return children;
}
