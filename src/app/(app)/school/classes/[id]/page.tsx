import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassStream } from "@/components/classes/class-stream";
import { AddStudentToClassDialog } from "@/components/students/add-student-to-class-dialog";
import { getClassBasicInfo, getClassRoster, getClassStream } from "@/lib/data/class-stream";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolForAdmin, getSchoolStudents } from "@/lib/data/school";

export const metadata: Metadata = { title: "Class" };

export default async function SchoolClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const school = await getSchoolForAdmin(user!.profile!.id);
  const [info, stream, roster, schoolStudents] = await Promise.all([
    getClassBasicInfo(id),
    getClassStream(id),
    getClassRoster(id),
    getSchoolStudents(school!.schoolId),
  ]);
  if (!info) notFound();

  const rosterIds = new Set(roster.map((r) => r.studentId));
  const availableStudents = schoolStudents.filter((s) => !rosterIds.has(s.studentId)).map((s) => ({ studentId: s.studentId, name: s.name }));

  return (
    <div className="space-y-6">
      <PageHeader title={info.name} description={info.subject ?? "General"} />

      <Tabs defaultValue="stream">
        <TabsList>
          <TabsTrigger value="stream"><MessageCircle className="h-3.5 w-3.5" /> Stream</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="pt-5">
          <ClassStream classId={id} posts={stream} canPost />
        </TabsContent>

        <TabsContent value="roster" className="pt-5">
          <Card>
            <CardContent>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <Users className="h-4 w-4" /> Students ({roster.length})
                </p>
                <AddStudentToClassDialog classId={id} students={availableStudents} />
              </div>
              {roster.length === 0 ? (
                <EmptyState
                  className="border-none bg-transparent py-6"
                  icon={Users}
                  title="No students yet"
                  description="Add an existing student, or share the class join code."
                />
              ) : (
                <div className="space-y-1.5">
                  {roster.map((s) => (
                    <div key={s.studentId} className="rounded-xl border border-border/60 px-3 py-2.5 text-sm">
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
