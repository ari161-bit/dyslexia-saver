import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { AccessibilitySettingsForm } from "@/components/reader/accessibility-settings-form";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getReadingPreferences } from "@/lib/data/reading-preferences";

export const metadata: Metadata = { title: "Settings" };

export default async function StudentSettingsPage() {
  const user = await getCurrentUser();
  const profile = user!.profile!;
  const prefs = await getReadingPreferences(profile.id);

  return (
    <div>
      <PageHeader title="Settings" description="Make Brightpath feel right for you." />
      <Tabs defaultValue="accessibility">
        <TabsList>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="accessibility" className="pt-6">
          <AccessibilitySettingsForm initial={prefs} />
        </TabsContent>
        <TabsContent value="account" className="pt-6">
          <AccountSettingsForm profile={profile} email={user!.email ?? ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
