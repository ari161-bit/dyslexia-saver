import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { PracticeSession } from "@/components/practice/practice-session";
import { WorksheetGenerator } from "@/components/worksheets/worksheet-generator";
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
      <Tabs defaultValue="practice">
        <TabsList>
          <TabsTrigger value="practice">Quick Practice</TabsTrigger>
          <TabsTrigger value="worksheet">Make a Worksheet</TabsTrigger>
        </TabsList>
        <TabsContent value="practice" className="pt-6">
          <PracticeSession resources={resources} />
        </TabsContent>
        <TabsContent value="worksheet" className="pt-6">
          <WorksheetGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
