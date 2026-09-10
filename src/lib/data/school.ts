import "server-only";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export interface SchoolContext {
  schoolId: string;
  schoolName: string;
  status: "pending" | "approved" | "rejected";
}

export async function getSchoolForAdmin(profileId: string): Promise<SchoolContext | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_school_members")
    .select("school_id, status, bp_schools(name)")
    .eq("user_id", profileId)
    .eq("role", "school_admin")
    .maybeSingle();

  if (!data) return null;
  const school = data.bp_schools as unknown as { name: string } | null;
  return { schoolId: data.school_id, schoolName: school?.name ?? "Your school", status: data.status };
}

export interface SchoolOverviewStats {
  students: number;
  teachers: number;
  classes: number;
  resources: number;
  assignments: number;
  accessibilityUsage: number;
}

export async function getSchoolOverviewStats(schoolId: string): Promise<SchoolOverviewStats> {
  // The caller already resolved schoolId through getSchoolForAdmin's RLS-scoped
  // lookup, so every read below is pre-authorized — service role is needed
  // because bp_class_members and student bp_profiles have no school_admin
  // SELECT policy (only teacher/student/parent do), which would otherwise make
  // rosters and everything derived from them silently look empty.
  const supabase = createServiceRoleClient();

  const [{ count: teachers }, { data: classes }, { count: resources }] = await Promise.all([
    supabase.from("bp_school_members").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher").eq("status", "approved"),
    supabase.from("bp_classes").select("id").eq("school_id", schoolId),
    supabase.from("bp_resources").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
  ]);

  const classIds = (classes ?? []).map((c) => c.id);

  let assignments = 0;
  let uniqueStudentIds: string[] = [];
  if (classIds.length > 0) {
    const [{ count: assignmentCount }, { data: roster }] = await Promise.all([
      supabase.from("bp_assignments").select("id", { count: "exact", head: true }).in("class_id", classIds),
      supabase.from("bp_class_members").select("student_id").in("class_id", classIds),
    ]);
    assignments = assignmentCount ?? 0;
    uniqueStudentIds = Array.from(new Set((roster ?? []).map((r) => r.student_id)));
  }
  const students = uniqueStudentIds.length;

  const { count: accessibilityUsage } = uniqueStudentIds.length
    ? await supabase.from("bp_reading_preferences").select("user_id", { count: "exact", head: true }).in("user_id", uniqueStudentIds)
    : { count: 0 };

  return {
    students,
    teachers: teachers ?? 0,
    classes: classIds.length,
    resources: resources ?? 0,
    assignments,
    accessibilityUsage: accessibilityUsage ?? 0,
  };
}

export interface EngagementWeek {
  weekStart: string;
  activeStudents: number;
}

function startOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as the start of the week
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// Distinct active students per week, for the school's whole student body —
// the trend line that actually shows whether adoption is growing.
export async function getSchoolEngagementTrend(schoolId: string, weeks = 8): Promise<EngagementWeek[]> {
  const supabase = createServiceRoleClient(); // see getSchoolOverviewStats — schoolId is already pre-authorized
  const { data: classes } = await supabase.from("bp_classes").select("id").eq("school_id", schoolId);
  const classIds = (classes ?? []).map((c) => c.id);

  const buckets = new Map<string, Set<string>>();
  for (let i = 0; i < weeks; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (weeks - 1 - i) * 7);
    buckets.set(startOfWeek(d), new Set());
  }
  if (classIds.length === 0) return Array.from(buckets.entries()).map(([weekStart, set]) => ({ weekStart, activeStudents: set.size }));

  const { data: roster } = await supabase.from("bp_class_members").select("student_id").in("class_id", classIds);
  const studentIds = Array.from(new Set((roster ?? []).map((r) => r.student_id)));
  if (studentIds.length === 0) return Array.from(buckets.entries()).map(([weekStart, set]) => ({ weekStart, activeStudents: set.size }));

  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);
  const { data: events } = await supabase
    .from("bp_progress_events")
    .select("student_id, created_at")
    .in("student_id", studentIds)
    .gte("created_at", since.toISOString());

  (events ?? []).forEach((e) => {
    const key = startOfWeek(new Date(e.created_at));
    if (buckets.has(key)) buckets.get(key)!.add(e.student_id);
  });

  return Array.from(buckets.entries()).map(([weekStart, set]) => ({ weekStart, activeStudents: set.size }));
}

export interface SchoolAIUsage {
  adaptationsGenerated: number;
  adaptationsApproved: number;
}

// How much the AI-adaptation feature is actually being used — the number
// investors want to see for an "AI-powered" product, not just that it exists.
export async function getSchoolAIUsage(schoolId: string): Promise<SchoolAIUsage> {
  const supabase = createServiceRoleClient(); // see getSchoolOverviewStats — schoolId is already pre-authorized
  const { data: resources } = await supabase.from("bp_resources").select("id").eq("school_id", schoolId);
  const resourceIds = (resources ?? []).map((r) => r.id);
  if (resourceIds.length === 0) return { adaptationsGenerated: 0, adaptationsApproved: 0 };

  const [{ count: total }, { count: approved }] = await Promise.all([
    supabase.from("bp_resource_adaptations").select("id", { count: "exact", head: true }).in("resource_id", resourceIds),
    supabase.from("bp_resource_adaptations").select("id", { count: "exact", head: true }).in("resource_id", resourceIds).eq("approved", true),
  ]);

  return { adaptationsGenerated: total ?? 0, adaptationsApproved: approved ?? 0 };
}

export interface SchoolCompletionStats {
  assignmentsCreated: number;
  submissionsReceived: number;
  submissionsReviewed: number;
}

export async function getSchoolCompletionStats(schoolId: string): Promise<SchoolCompletionStats> {
  const supabase = createServiceRoleClient(); // see getSchoolOverviewStats — schoolId is already pre-authorized
  const { data: classes } = await supabase.from("bp_classes").select("id").eq("school_id", schoolId);
  const classIds = (classes ?? []).map((c) => c.id);
  if (classIds.length === 0) return { assignmentsCreated: 0, submissionsReceived: 0, submissionsReviewed: 0 };

  const { data: assignments } = await supabase.from("bp_assignments").select("id").in("class_id", classIds);
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  if (assignmentIds.length === 0) return { assignmentsCreated: 0, submissionsReceived: 0, submissionsReviewed: 0 };

  const [{ count: submissions }, { count: reviewed }] = await Promise.all([
    supabase.from("bp_submissions").select("id", { count: "exact", head: true }).in("assignment_id", assignmentIds),
    supabase.from("bp_submissions").select("id", { count: "exact", head: true }).in("assignment_id", assignmentIds).eq("status", "reviewed"),
  ]);

  return { assignmentsCreated: assignmentIds.length, submissionsReceived: submissions ?? 0, submissionsReviewed: reviewed ?? 0 };
}

export interface SchoolStaffMember {
  id: string;
  profileId: string;
  name: string;
  status: "pending" | "approved" | "rejected";
}

export async function getSchoolTeachers(schoolId: string): Promise<SchoolStaffMember[]> {
  const supabase = createServiceRoleClient(); // see getSchoolOverviewStats — schoolId is already pre-authorized
  const { data } = await supabase
    .from("bp_school_members")
    .select("id, status, bp_profiles(id, first_name, last_name)")
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .order("status", { ascending: true });

  return (data ?? []).map((m) => {
    const profile = m.bp_profiles as unknown as { id: string; first_name: string; last_name: string } | null;
    return { id: m.id, profileId: profile?.id ?? "", name: profile ? `${profile.first_name} ${profile.last_name}` : "Teacher", status: m.status };
  });
}

export interface SchoolStudent {
  studentId: string;
  name: string;
  classNames: string[];
}

export async function getSchoolStudents(schoolId: string): Promise<SchoolStudent[]> {
  const supabase = createServiceRoleClient(); // see getSchoolOverviewStats — schoolId is already pre-authorized
  const { data: classes } = await supabase.from("bp_classes").select("id, name").eq("school_id", schoolId);
  const classIds = (classes ?? []).map((c) => c.id);

  const byStudent = new Map<string, SchoolStudent>();

  if (classIds.length > 0) {
    const { data: roster } = await supabase
      .from("bp_class_members")
      .select("student_id, class_id, bp_profiles(first_name, last_name)")
      .in("class_id", classIds);

    const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));
    for (const r of roster ?? []) {
      const profile = r.bp_profiles as unknown as { first_name: string; last_name: string } | null;
      const existing = byStudent.get(r.student_id);
      const className = classNameById.get(r.class_id) ?? "Class";
      if (existing) existing.classNames.push(className);
      else byStudent.set(r.student_id, { studentId: r.student_id, name: profile ? `${profile.first_name} ${profile.last_name}` : "Student", classNames: [className] });
    }
  }

  // Students the admin created directly but hasn't placed in a class yet
  // have no bp_class_members row, so they'd otherwise never show up here.
  const { data: unassigned } = await supabase.from("bp_profiles").select("id, first_name, last_name").eq("role", "student").eq("school_id", schoolId);
  for (const p of unassigned ?? []) {
    if (byStudent.has(p.id)) continue;
    byStudent.set(p.id, { studentId: p.id, name: `${p.first_name} ${p.last_name}`, classNames: [] });
  }

  return Array.from(byStudent.values());
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: string | null;
  subject: string | null;
  teacherName: string;
  studentCount: number;
}

export async function getSchoolClasses(schoolId: string): Promise<SchoolClass[]> {
  const supabase = createServiceRoleClient(); // see getSchoolOverviewStats — schoolId is already pre-authorized
  const { data } = await supabase
    .from("bp_classes")
    .select("id, name, grade, subject, bp_profiles(first_name, last_name), bp_class_members(count)")
    .eq("school_id", schoolId);

  return (data ?? []).map((c) => {
    const teacher = c.bp_profiles as unknown as { first_name: string; last_name: string } | null;
    return {
      id: c.id,
      name: c.name,
      grade: c.grade,
      subject: c.subject,
      teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unassigned",
      studentCount: (c.bp_class_members as unknown as { count: number }[])?.[0]?.count ?? 0,
    };
  });
}

export interface AnnouncementHistoryItem {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
}

export async function getSchoolAnnouncementHistory(adminProfileId: string): Promise<AnnouncementHistoryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_notifications")
    .select("id, title, body, created_at")
    .eq("user_id", adminProfileId)
    .eq("type", "announcement")
    .order("created_at", { ascending: false });

  return (data ?? []).map((n) => ({ id: n.id, title: n.title, body: n.body, createdAt: n.created_at }));
}

export interface SchoolResource {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  ownerName: string;
}

export async function getSchoolResources(schoolId: string): Promise<SchoolResource[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_resources")
    .select("id, title, subject, status, bp_profiles(first_name, last_name)")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => {
    const owner = r.bp_profiles as unknown as { first_name: string; last_name: string } | null;
    return { id: r.id, title: r.title, subject: r.subject, status: r.status, ownerName: owner ? `${owner.first_name} ${owner.last_name}` : "Unknown" };
  });
}
