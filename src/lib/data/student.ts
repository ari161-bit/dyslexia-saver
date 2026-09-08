import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ContinueLearningItem {
  resourceId: string;
  title: string;
  subject: string | null;
}

export async function getContinueLearning(studentId: string): Promise<ContinueLearningItem | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_progress_events")
    .select("resource_id, bp_resources(id, title, subject)")
    .eq("student_id", studentId)
    .not("resource_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const resource = (data as unknown as { bp_resources: { id: string; title: string; subject: string | null } | null })?.bp_resources;
  if (!resource) return null;
  return { resourceId: resource.id, title: resource.title, subject: resource.subject };
}

export interface UpcomingAssignment {
  id: string;
  title: string;
  subject: string | null;
  dueDate: string | null;
  className: string;
  status: "not_started" | "in_progress" | "submitted" | "reviewed";
}

export async function getUpcomingAssignments(studentId: string): Promise<UpcomingAssignment[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("bp_class_members")
    .select("class_id")
    .eq("student_id", studentId);

  const classIds = (memberships ?? []).map((m) => m.class_id);
  if (classIds.length === 0) return [];

  const { data } = await supabase
    .from("bp_assignments")
    .select("id, title, subject, due_date, bp_classes(name), bp_submissions(status, student_id)")
    .in("class_id", classIds)
    .order("due_date", { ascending: true })
    .limit(6);

  return (data ?? []).map((a) => {
    const cls = a.bp_classes as unknown as { name: string } | null;
    const submissions = (a.bp_submissions as unknown as { status: string; student_id: string }[]) ?? [];
    const mine = submissions.find((s) => s.student_id === studentId);
    return {
      id: a.id,
      title: a.title,
      subject: a.subject,
      dueDate: a.due_date,
      className: cls?.name ?? "Class",
      status: (mine?.status as UpcomingAssignment["status"]) ?? "not_started",
    };
  });
}

export interface WeeklyProgress {
  activitiesCompleted: number;
  readingSessions: number;
  practiceCompleted: number;
}

export async function getWeeklyProgress(studentId: string): Promise<WeeklyProgress> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data } = await supabase
    .from("bp_progress_events")
    .select("event_type")
    .eq("student_id", studentId)
    .gte("created_at", since.toISOString());

  const events = data ?? [];
  return {
    activitiesCompleted: events.length,
    readingSessions: events.filter((e) => e.event_type === "reading_session").length,
    practiceCompleted: events.filter((e) => e.event_type === "practice_completed").length,
  };
}

export interface ProgressDay {
  date: string;
  count: number;
}

export async function getProgressTimeline(studentId: string, days = 14): Promise<ProgressDay[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("bp_progress_events")
    .select("created_at")
    .eq("student_id", studentId)
    .gte("created_at", since.toISOString());

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  (data ?? []).forEach((e) => {
    const key = e.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export interface ProgressBreakdown {
  eventType: string;
  count: number;
}

export async function getProgressBreakdown(studentId: string): Promise<ProgressBreakdown[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("bp_progress_events").select("event_type").eq("student_id", studentId);
  const counts = new Map<string, number>();
  (data ?? []).forEach((e) => counts.set(e.event_type, (counts.get(e.event_type) ?? 0) + 1));
  return Array.from(counts.entries()).map(([eventType, count]) => ({ eventType, count }));
}

export interface StudentStreak {
  currentStreak: number;
  longestStreak: number;
}

// Consecutive-day streak derived from bp_progress_events — there's no
// dedicated streak table, so this recomputes from the distinct active days
// each time. Cheap enough at this scale, and it can never drift out of sync
// with the actual activity log.
export async function getStudentStreak(studentId: string): Promise<StudentStreak> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 365);

  const { data } = await supabase
    .from("bp_progress_events")
    .select("created_at")
    .eq("student_id", studentId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  const activeDays = Array.from(new Set((data ?? []).map((e) => e.created_at.slice(0, 10)))).sort().reverse();
  if (activeDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  const mostRecent = new Date(activeDays[0]);
  const daysSinceLastActivity = Math.round((today.getTime() - mostRecent.getTime()) / dayMs);
  if (daysSinceLastActivity <= 1) {
    currentStreak = 1;
    for (let i = 1; i < activeDays.length; i++) {
      const gap = Math.round((new Date(activeDays[i - 1]).getTime() - new Date(activeDays[i]).getTime()) / dayMs);
      if (gap === 1) currentStreak++;
      else break;
    }
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < activeDays.length; i++) {
    const gap = Math.round((new Date(activeDays[i - 1]).getTime() - new Date(activeDays[i]).getTime()) / dayMs);
    run = gap === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  return { currentStreak, longestStreak };
}

export interface StudentBadge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

// Computed on the fly from existing activity data — no separate badges
// table to keep in sync, so a badge can never be "earned" without the
// underlying activity actually having happened.
export async function getStudentBadges(studentId: string): Promise<StudentBadge[]> {
  const supabase = await createClient();

  const [{ count: totalActivities }, { count: readingSessions }, { data: submissions }, streak] = await Promise.all([
    supabase.from("bp_progress_events").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("bp_progress_events").select("id", { count: "exact", head: true }).eq("student_id", studentId).eq("event_type", "reading_session"),
    supabase.from("bp_submissions").select("id").eq("student_id", studentId),
    getStudentStreak(studentId),
  ]);

  const submissionCount = (submissions ?? []).length;

  return [
    { id: "first_steps", label: "First Steps", description: "Complete your first activity.", earned: (totalActivities ?? 0) >= 1 },
    { id: "getting_started", label: "Getting Started", description: "Complete 10 activities.", earned: (totalActivities ?? 0) >= 10 },
    { id: "bookworm", label: "Bookworm", description: "Finish 25 reading sessions.", earned: (readingSessions ?? 0) >= 25 },
    { id: "streak_3", label: "3-Day Streak", description: "Show up 3 days in a row.", earned: streak.longestStreak >= 3 },
    { id: "streak_7", label: "Week-Long Streak", description: "Show up 7 days in a row.", earned: streak.longestStreak >= 7 },
    { id: "assignment_ace", label: "Assignment Ace", description: "Submit 5 assignments.", earned: submissionCount >= 5 },
  ];
}

export async function recordProgressEvent(
  studentId: string,
  eventType: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = await createClient();
  await supabase.from("bp_progress_events").insert({
    student_id: studentId,
    resource_id: resourceId ?? null,
    event_type: eventType,
    metadata: metadata ?? null,
  });
}
