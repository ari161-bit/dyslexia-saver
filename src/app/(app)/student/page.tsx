import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ClipboardList, Ear, FileUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { AssignmentRow } from "@/components/shared/assignment-row";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getContinueLearning, getUpcomingAssignments, getWeeklyProgress } from "@/lib/data/student";

export const metadata: Metadata = { title: "Home" };

const QUICK_ACTIONS = [
  { href: "/student/learning?mode=read", label: "Read something", icon: BookOpen },
  { href: "/student/learning/upload", label: "Upload a page", icon: FileUp },
  { href: "/student/learning?mode=listen", label: "Listen", icon: Ear },
  { href: "/student/practice", label: "Ask for an explanation", icon: Sparkles },
  { href: "/student/practice", label: "Practice", icon: ClipboardList },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function StudentHomePage() {
  const user = await getCurrentUser();
  const profile = user!.profile!;

  const [continueLearning, assignments, progress] = await Promise.all([
    getContinueLearning(profile.id),
    getUpcomingAssignments(profile.id),
    getWeeklyProgress(profile.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={`${greeting()}, ${profile.first_name}`} description="Ready to learn?" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent>
              <p className="text-sm font-semibold text-muted-foreground">Continue Learning</p>
              {continueLearning ? (
                <div className="mt-3 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-heading text-lg font-semibold">{continueLearning.title}</p>
                    {continueLearning.subject ? (
                      <p className="text-sm text-muted-foreground">{continueLearning.subject}</p>
                    ) : null}
                  </div>
                  <Button asChild>
                    <Link href={`/read/${continueLearning.resourceId}`}>Continue</Link>
                  </Button>
                </div>
              ) : (
                <EmptyState
                  className="mt-3 border-none bg-transparent py-6"
                  icon={BookOpen}
                  title="Nothing open yet"
                  description="Once you start a lesson, you can pick up right where you left off."
                  action={
                    <Button asChild size="sm">
                      <Link href="/student/learning">Browse My Learning</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">Today&apos;s Focus</p>
                <Link href="/student/assignments" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {assignments.length === 0 ? (
                  <EmptyState
                    className="border-none bg-transparent py-6"
                    icon={ClipboardList}
                    title="No assignments yet"
                    description="Your teacher hasn't shared anything here yet."
                  />
                ) : (
                  assignments.map((a) => (
                    <AssignmentRow
                      key={a.id}
                      href={`/student/assignments/${a.id}`}
                      title={a.title}
                      subject={a.subject}
                      className={a.className}
                      dueDate={a.dueDate}
                      status={a.status}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <p className="text-sm font-semibold text-muted-foreground">Quick Actions</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm font-semibold text-muted-foreground">This Week</p>
              <p className="mt-2 text-sm text-muted-foreground">
                You&apos;ve completed{" "}
                <span className="font-semibold text-foreground">{progress.activitiesCompleted}</span>{" "}
                {progress.activitiesCompleted === 1 ? "activity" : "activities"} this week. Nice and
                steady — keep going at your own pace.
              </p>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link href="/student/progress">See my progress</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
