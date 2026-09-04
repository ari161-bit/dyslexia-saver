import type { Metadata } from "next";
import { BookOpen, ClipboardCheck, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityChart } from "@/components/progress/activity-chart";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getProgressBreakdown, getProgressTimeline, getWeeklyProgress } from "@/lib/data/student";

export const metadata: Metadata = { title: "Progress" };

const LABELS: Record<string, string> = {
  reading_session: "Reading practice",
  practice_completed: "Practice questions",
  vocabulary_reviewed: "Vocabulary reviewed",
  note_saved: "Notes saved",
};

export default async function StudentProgressPage() {
  const user = await getCurrentUser();
  const profile = user!.profile!;

  const [weekly, timeline, breakdown] = await Promise.all([
    getWeeklyProgress(profile.id),
    getProgressTimeline(profile.id),
    getProgressBreakdown(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Progress"
        description="A record of the work you've been putting in — not a score, just a picture of your practice."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Activities this week" value={weekly.activitiesCompleted} icon={Sparkles} />
        <StatCard label="Reading sessions" value={weekly.readingSessions} icon={BookOpen} />
        <StatCard label="Practice completed" value={weekly.practiceCompleted} icon={ClipboardCheck} />
      </div>

      <Card>
        <CardContent>
          <p className="text-sm font-semibold text-muted-foreground">Activity, last 14 days</p>
          <ActivityChart data={timeline} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Areas you've been practicing</p>
          {breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Once you start reading and practicing, you&apos;ll see a breakdown here.
            </p>
          ) : (
            <div className="space-y-2">
              {breakdown.map((b) => (
                <div key={b.eventType} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <span>{LABELS[b.eventType] ?? b.eventType}</span>
                  <span className="font-medium">{b.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
