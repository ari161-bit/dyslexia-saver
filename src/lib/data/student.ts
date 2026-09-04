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
    .from("progress_events")
    .select("resource_id, resources(id, title, subject)")
    .eq("student_id", studentId)
    .not("resource_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const resource = (data as unknown as { resources: { id: string; title: string; subject: string | null } | null })?.resources;
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
    .from("class_members")
    .select("class_id")
    .eq("student_id", studentId);

  const classIds = (memberships ?? []).map((m) => m.class_id);
  if (classIds.length === 0) return [];

  const { data } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, classes(name), submissions(status, student_id)")
    .in("class_id", classIds)
    .order("due_date", { ascending: true })
    .limit(6);

  return (data ?? []).map((a) => {
    const cls = a.classes as unknown as { name: string } | null;
    const submissions = (a.submissions as unknown as { status: string; student_id: string }[]) ?? [];
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
    .from("progress_events")
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
    .from("progress_events")
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
  const { data } = await supabase.from("progress_events").select("event_type").eq("student_id", studentId);
  const counts = new Map<string, number>();
  (data ?? []).forEach((e) => counts.set(e.event_type, (counts.get(e.event_type) ?? 0) + 1));
  return Array.from(counts.entries()).map(([eventType, count]) => ({ eventType, count }));
}

export async function recordProgressEvent(
  studentId: string,
  eventType: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = await createClient();
  await supabase.from("progress_events").insert({
    student_id: studentId,
    resource_id: resourceId ?? null,
    event_type: eventType,
    metadata: metadata ?? null,
  });
}
