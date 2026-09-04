import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { SchoolNameForm } from "@/components/school/school-name-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolForAdmin } from "@/lib/data/school";

export const metadata: Metadata = { title: "School Settings" };

export default async function SchoolSettingsPage() {
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);

  return (
    <div className="space-y-8">
      <PageHeader title="School Settings" description="Manage your school profile and your own account." />
      <SchoolNameForm schoolId={school!.schoolId} currentName={school!.schoolName} />
      <div className="border-t border-border pt-8">
        <AccountSettingsForm profile={user!.profile!} email={user!.email ?? ""} />
      </div>
    </div>
  );
}
