import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface LinkedChild {
  studentId: string;
  name: string;
  status: "pending" | "approved" | "rejected";
}

export async function getLinkedChildren(parentId: string): Promise<LinkedChild[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_parent_student_links")
    .select("student_id, status, bp_profiles(first_name, last_name)")
    .eq("parent_id", parentId);

  return (data ?? []).map((l) => {
    const profile = l.bp_profiles as unknown as { first_name: string; last_name: string } | null;
    return {
      studentId: l.student_id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
      status: l.status,
    };
  });
}

export async function assertParentLinked(parentId: string, studentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_parent_student_links")
    .select("id")
    .eq("parent_id", parentId)
    .eq("student_id", studentId)
    .eq("status", "approved")
    .maybeSingle();
  return !!data;
}

export interface ChildOverview {
  name: string;
  recentActivity: { eventType: string; createdAt: string; resourceTitle: string | null }[];
  currentFocus: string | null;
  upcomingAssignments: { id: string; title: string; dueDate: string | null; className: string }[];
}

const FOCUS_LABEL: Record<string, string> = {
  reading_session: "Reading comprehension",
  practice_completed: "Practice questions",
  vocabulary_reviewed: "Vocabulary building",
};

export async function getChildOverview(studentId: string): Promise<ChildOverview> {
  const supabase = await createClient();

  const { data: profile } = await supabase.from("bp_profiles").select("first_name, last_name").eq("id", studentId).maybeSingle();

  const { data: activity } = await supabase
    .from("bp_progress_events")
    .select("event_type, created_at, bp_resources(title)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: memberships } = await supabase.from("bp_class_members").select("class_id").eq("student_id", studentId);
  const classIds = (memberships ?? []).map((m) => m.class_id);

  const { data: assignments } = classIds.length
    ? await supabase
        .from("bp_assignments")
        .select("id, title, due_date, bp_classes(name)")
        .in("class_id", classIds)
        .order("due_date", { ascending: true })
        .limit(4)
    : { data: [] };

  const recentActivity = (activity ?? []).map((a) => ({
    eventType: a.event_type,
    createdAt: a.created_at,
    resourceTitle: (a.bp_resources as unknown as { title: string } | null)?.title ?? null,
  }));

  return {
    name: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
    recentActivity,
    currentFocus: recentActivity[0] ? FOCUS_LABEL[recentActivity[0].eventType] ?? null : null,
    upcomingAssignments: (assignments ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.due_date,
      className: (a.bp_classes as unknown as { name: string } | null)?.name ?? "Class",
    })),
  };
}

export interface ParentResourceItem {
  id: string;
  title: string;
  subject: string | null;
  childName: string;
}

export async function getChildrenResources(parentId: string): Promise<ParentResourceItem[]> {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("bp_parent_student_links")
    .select("student_id, bp_profiles(first_name, last_name)")
    .eq("parent_id", parentId)
    .eq("status", "approved");

  const results: ParentResourceItem[] = [];
  for (const link of links ?? []) {
    const profile = link.bp_profiles as unknown as { first_name: string; last_name: string } | null;
    const childName = profile ? profile.first_name : "Child";

    const { data: memberships } = await supabase.from("bp_class_members").select("class_id").eq("student_id", link.student_id);
    const classIds = (memberships ?? []).map((m) => m.class_id);
    if (classIds.length === 0) continue;

    const { data: assignments } = await supabase
      .from("bp_assignments")
      .select("bp_resources(id, title, subject)")
      .in("class_id", classIds)
      .not("resource_id", "is", null);

    for (const a of assignments ?? []) {
      const resource = a.bp_resources as unknown as { id: string; title: string; subject: string | null } | null;
      if (resource) results.push({ ...resource, childName });
    }
  }
  return results;
}

const ACTIVITY_SUGGESTIONS: Record<string, string[]> = {
  reading_session: [
    "Try reading one short paragraph together and asking your child to explain the main idea in their own words.",
    "Take turns reading a paragraph aloud — alternating reduces pressure and keeps it collaborative.",
  ],
  practice_completed: [
    "Ask your child to teach you one thing they practiced today — explaining it back is a great memory check.",
  ],
  default: [
    "Ask your child to show you one thing they worked on today, even for just five minutes.",
    "Celebrate effort, not just results — noticing the attempt matters more than getting it perfect.",
  ],
};

export function getAtHomeActivities(currentFocusEvent: string | null): string[] {
  return ACTIVITY_SUGGESTIONS[currentFocusEvent ?? "default"] ?? ACTIVITY_SUGGESTIONS.default;
}
