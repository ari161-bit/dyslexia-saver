import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { FolderOpen, GraduationCap, LifeBuoy, Plus, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ResourceCard } from "@/components/shared/resource-card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getRecentAssignments,
  getRecentResources,
  getStudentsNeedingAttention,
  getTeacherClasses,
} from "@/lib/data/teacher";

export const metadata: Metadata = { title: "Dashboard" };

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  const profile = user!.profile!;

  const [classes, attention, assignments, resources] = await Promise.all([
    getTeacherClasses(profile.id),
    getStudentsNeedingAttention(profile.id),
    getRecentAssignments(profile.id),
    getRecentResources(profile.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${profile.first_name}`}
        description="Here's what's happening across your classes."
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/teacher/resources/upload"><Upload className="h-4 w-4" /> Upload material</Link>
            </Button>
            <Button asChild>
              <Link href="/teacher/assignments/new"><Plus className="h-4 w-4" /> New assignment</Link>
            </Button>
          </div>
        }
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">My Classes</p>
          <Link href="/teacher/classes" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {classes.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No classes yet"
            description="Create your first class to start adding students and assignments."
            action={<Button size="sm" asChild><Link href="/teacher/classes">Create a class</Link></Button>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/teacher/classes/${c.id}`}
                className="rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <p className="font-heading font-semibold">{c.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{c.subject ?? "General"} {c.grade ? `· ${c.grade}` : ""}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {c.studentCount} students
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <LifeBuoy className="h-4 w-4" /> Students Needing Attention
            </p>
            {attention.length === 0 ? (
              <p className="text-sm text-muted-foreground">Everyone's been actively engaged recently — nice work.</p>
            ) : (
              <div className="space-y-2">
                {attention.map((s) => (
                  <Link
                    key={s.studentId}
                    href={`/teacher/students/${s.studentId}`}
                    className="block rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.className} · {s.reason}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">Recent Assignments</p>
              <Link href="/teacher/assignments" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments created yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/teacher/assignments/${a.id}`}
                    className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.className}{a.dueDate ? ` · Due ${format(new Date(a.dueDate), "MMM d")}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-normal">{a.submittedCount}/{a.rosterSize} submitted</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <FolderOpen className="h-4 w-4" /> Recently Uploaded Resources
          </p>
          <Link href="/teacher/resources" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {resources.length === 0 ? (
          <EmptyState icon={FolderOpen} title="Nothing uploaded yet" description="Upload a worksheet or lesson to start adapting it." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <ResourceCard key={r.id} href={`/teacher/resources/${r.id}/adapt`} title={r.title} subject={r.subject} status={r.status} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
