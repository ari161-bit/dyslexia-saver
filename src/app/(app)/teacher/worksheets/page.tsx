import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { WorksheetGenerator } from "@/components/worksheets/worksheet-generator";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getTeacherClasses } from "@/lib/data/teacher";

export const metadata: Metadata = { title: "Worksheets" };

export default async function TeacherWorksheetsPage() {
  const user = await getCurrentUser();
  const classes = await getTeacherClasses(user!.profile!.id);

  return (
    <div>
      <PageHeader
        title="Worksheet Generator"
        description="Paste in a passage, notes, or a topic outline — get back a worksheet grounded in exactly that material, ready to assign."
      />
      <WorksheetGenerator classes={classes} />
    </div>
  );
}
