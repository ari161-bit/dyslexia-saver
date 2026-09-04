import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const metadata: Metadata = { title: "Settings" };

export default async function ParentSettingsPage() {
  const user = await getCurrentUser();
  return (
    <div>
      <PageHeader title="Settings" description="Manage your account details." />
      <AccountSettingsForm profile={user!.profile!} email={user!.email ?? ""} />
    </div>
  );
}
