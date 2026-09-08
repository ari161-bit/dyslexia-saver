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
  { href: "/student/learning?mode=read", label: "Read something", icon: BookOpen, color: "bg-chart-1/15 text-chart-1" },
  { href: "/student/learning/upload", label: "Upload a page", icon: FileUp, color: "bg-chart-2/15 text-chart-2" },
  { href: "/student/learning?mode=listen", label: "Listen", icon: Ear, color: "bg-chart-3/15 text-chart-3" },
  { href: "/student/practice", label: "Ask for help", icon: Sparkles, color: "bg-chart-4/15 text-chart-4" },
  { href: "/student/practice", label: "Practice time", icon: ClipboardList, color: "bg-success/15 text-success" },
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
      <PageHeader size="lg" title={`${greeting()}, ${profile.first_name}! 👋`} description="What do you want to do today?" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-3xl border-2">
            <CardContent className="p-6">
              <p className="text-base font-bold text-primary">📖 Keep reading</p>
              {continueLearning ? (
                <div className="mt-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-heading text-xl font-bold">{continueLearning.title}</p>
                    {continueLearning.subject ? (
                      <p className="text-base text-muted-foreground">{continueLearning.subject}</p>
                    ) : null}
                  </div>
                  <Button asChild className="h-12 rounded-2xl px-6 text-base font-bold">
                    <Link href={`/read/${continueLearning.resourceId}`}>Keep going →</Link>
                  </Button>
                </div>
              ) : (
                <EmptyState
                  className="mt-4 border-none bg-transparent py-8"
                  icon={BookOpen}
                  title="Nothing open yet"
                  description="Pick something to read and come back here anytime to jump right back in."
                  action={
                    <Button asChild className="h-12 rounded-2xl px-6 text-base font-bold">
                      <Link href="/student/learning">Find something to read</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-primary">✅ Today&apos;s to-dos</p>
                <Link href="/student/assignments" className="text-base font-semibold text-primary hover:underline">
                  See all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {assignments.length === 0 ? (
                  <EmptyState
                    className="border-none bg-transparent py-8"
                    icon={ClipboardList}
                    title="Nothing due right now"
                    description="You're all caught up! Your teacher will add things here when there's something new."
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
          <Card className="rounded-3xl border-2">
            <CardContent className="p-6">
              <p className="text-base font-bold text-primary">✨ Let&apos;s go!</p>
              <div className="mt-4 grid grid-cols-1 gap-2.5">
                {QUICK_ACTIONS.map(({ href, label, icon: Icon, color }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3.5 rounded-2xl border-2 border-border/70 px-4 py-3.5 text-base font-bold transition-all hover:scale-[1.02] hover:border-primary/50 hover:bg-accent/40"
                  >
                    <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${color}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    {label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 bg-gradient-to-br from-success/10 to-transparent">
            <CardContent className="p-6">
              <p className="text-base font-bold text-primary">🌟 This week</p>
              <p className="mt-3 text-base leading-relaxed text-foreground/90">
                You&apos;ve done <span className="font-heading text-2xl font-extrabold text-success">{progress.activitiesCompleted}</span>{" "}
                {progress.activitiesCompleted === 1 ? "activity" : "activities"} this week. That&apos;s awesome — keep it up, at your own pace!
              </p>
              <Button variant="outline" className="mt-5 h-12 w-full rounded-2xl text-base font-bold" asChild>
                <Link href="/student/progress">See my progress</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
