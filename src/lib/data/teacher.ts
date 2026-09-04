import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface TeacherClassCard {
  id: string;
  name: string;
  grade: string | null;
  subject: string | null;
  studentCount: number;
}

export async function getTeacherClasses(teacherId: string): Promise<TeacherClassCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_classes")
    .select("id, name, grade, subject, bp_class_members(count)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    subject: c.subject,
    studentCount: (c.bp_class_members as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export interface StudentNeedingAttention {
  studentId: string;
  name: string;
  className: string;
  reason: string;
}

export async function getStudentsNeedingAttention(teacherId: string): Promise<StudentNeedingAttention[]> {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("bp_classes").select("id, name").eq("teacher_id", teacherId);
  const classIds = (classes ?? []).map((c) => c.id);
  if (classIds.length === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data: roster } = await supabase
    .from("bp_class_members")
    .select("student_id, class_id, bp_profiles(first_name, last_name)")
    .in("class_id", classIds);

  const classById = new Map((classes ?? []).map((c) => [c.id, c.name]));
  const results: StudentNeedingAttention[] = [];

  for (const member of roster ?? []) {
    const { count } = await supabase
      .from("bp_progress_events")
      .select("id", { count: "exact", head: true })
      .eq("student_id", member.student_id)
      .gte("created_at", since.toISOString());

    if ((count ?? 0) === 0) {
      const profile = member.bp_profiles as unknown as { first_name: string; last_name: string } | null;
      results.push({
        studentId: member.student_id,
        name: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
        className: classById.get(member.class_id) ?? "Class",
        reason: "May benefit from additional support — no recent activity",
      });
    }
  }

  return results.slice(0, 6);
}

export interface RecentAssignment {
  id: string;
  title: string;
  className: string;
  dueDate: string | null;
  submittedCount: number;
  rosterSize: number;
}

export async function getRecentAssignments(teacherId: string): Promise<RecentAssignment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_assignments")
    .select("id, title, due_date, bp_classes(name, bp_class_members(count)), bp_submissions(status)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []).map((a) => {
    const cls = a.bp_classes as unknown as { name: string; bp_class_members: { count: number }[] } | null;
    const submissions = (a.bp_submissions as unknown as { status: string }[]) ?? [];
    return {
      id: a.id,
      title: a.title,
      className: cls?.name ?? "Class",
      dueDate: a.due_date,
      submittedCount: submissions.filter((s) => s.status === "submitted" || s.status === "reviewed").length,
      rosterSize: cls?.bp_class_members?.[0]?.count ?? 0,
    };
  });
}

export interface TeacherStudentListItem {
  studentId: string;
  name: string;
  classNames: string[];
}

export async function getAllTeacherStudents(teacherId: string): Promise<TeacherStudentListItem[]> {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("bp_classes").select("id, name").eq("teacher_id", teacherId);
  const classIds = (classes ?? []).map((c) => c.id);
  if (classIds.length === 0) return [];

  const { data: roster } = await supabase
    .from("bp_class_members")
    .select("student_id, class_id, bp_profiles(first_name, last_name)")
    .in("class_id", classIds);

  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));
  const byStudent = new Map<string, TeacherStudentListItem>();

  for (const r of roster ?? []) {
    const profile = r.bp_profiles as unknown as { first_name: string; last_name: string } | null;
    const existing = byStudent.get(r.student_id);
    const className = classNameById.get(r.class_id) ?? "Class";
    if (existing) existing.classNames.push(className);
    else
      byStudent.set(r.student_id, {
        studentId: r.student_id,
        name: profile ? `${profile.first_name} ${profile.last_name}` : "Student",
        classNames: [className],
      });
  }

  return Array.from(byStudent.values());
}

export interface StudentProfileForTeacher {
  studentId: string;
  name: string;
  classNames: string[];
  recentActivity: { eventType: string; createdAt: string }[];
  pendingParentLinks: { id: string; parentName: string }[];
}

export async function getStudentProfileForTeacher(teacherId: string, studentId: string): Promise<StudentProfileForTeacher | null> {
  const supabase = await createClient();
  const students = await getAllTeacherStudents(teacherId);
  const match = students.find((s) => s.studentId === studentId);
  if (!match) return null;

  const { data: activity } = await supabase
    .from("bp_progress_events")
    .select("event_type, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: pendingLinks } = await supabase
    .from("bp_parent_student_links")
    .select("id, bp_profiles!bp_parent_student_links_parent_id_fkey(first_name, last_name)")
    .eq("student_id", studentId)
    .eq("status", "pending");

  return {
    ...match,
    recentActivity: (activity ?? []).map((a) => ({ eventType: a.event_type, createdAt: a.created_at })),
    pendingParentLinks: (pendingLinks ?? []).map((p) => {
      const profile = p.bp_profiles as unknown as { first_name: string; last_name: string } | null;
      return { id: p.id, parentName: profile ? `${profile.first_name} ${profile.last_name}` : "Parent" };
    }),
  };
}

export interface ClassDetail {
  id: string;
  name: string;
  grade: string | null;
  subject: string | null;
  joinCode: string;
  roster: { studentId: string; name: string }[];
  assignments: { id: string; title: string; dueDate: string | null }[];
}

export async function getClassDetail(classId: string): Promise<ClassDetail | null> {
  const supabase = await createClient();
  const { data: cls } = await supabase.from("bp_classes").select("*").eq("id", classId).maybeSingle();
  if (!cls) return null;

  const { data: roster } = await supabase
    .from("bp_class_members")
    .select("student_id, bp_profiles(first_name, last_name)")
    .eq("class_id", classId);

  const { data: assignments } = await supabase
    .from("bp_assignments")
    .select("id, title, due_date")
    .eq("class_id", classId)
    .order("due_date", { ascending: true });

  return {
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    subject: cls.subject,
    joinCode: cls.join_code,
    roster: (roster ?? []).map((r) => {
      const profile = r.bp_profiles as unknown as { first_name: string; last_name: string } | null;
      return { studentId: r.student_id, name: profile ? `${profile.first_name} ${profile.last_name}` : "Student" };
    }),
    assignments: (assignments ?? []).map((a) => ({ id: a.id, title: a.title, dueDate: a.due_date })),
  };
}

export interface ClassProgressSummary {
  classId: string;
  className: string;
  studentCount: number;
  activitiesLast7Days: number;
}

export async function getClassProgressSummaries(teacherId: string): Promise<ClassProgressSummary[]> {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("bp_classes").select("id, name, bp_class_members(student_id)").eq("teacher_id", teacherId);
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const summaries: ClassProgressSummary[] = [];
  for (const c of classes ?? []) {
    const studentIds = (c.bp_class_members as unknown as { student_id: string }[]).map((m) => m.student_id);
    let activities = 0;
    if (studentIds.length > 0) {
      const { count } = await supabase
        .from("bp_progress_events")
        .select("id", { count: "exact", head: true })
        .in("student_id", studentIds)
        .gte("created_at", since.toISOString());
      activities = count ?? 0;
    }
    summaries.push({ classId: c.id, className: c.name, studentCount: studentIds.length, activitiesLast7Days: activities });
  }
  return summaries;
}

export async function getAllTeacherAssignments(teacherId: string): Promise<RecentAssignment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_assignments")
    .select("id, title, due_date, bp_classes(name, bp_class_members(count)), bp_submissions(status)")
    .eq("teacher_id", teacherId)
    .order("due_date", { ascending: true });

  return (data ?? []).map((a) => {
    const cls = a.bp_classes as unknown as { name: string; bp_class_members: { count: number }[] } | null;
    const submissions = (a.bp_submissions as unknown as { status: string }[]) ?? [];
    return {
      id: a.id,
      title: a.title,
      className: cls?.name ?? "Class",
      dueDate: a.due_date,
      submittedCount: submissions.filter((s) => s.status === "submitted" || s.status === "reviewed").length,
      rosterSize: cls?.bp_class_members?.[0]?.count ?? 0,
    };
  });
}

export interface RecentResource {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  createdAt: string;
}

export async function getRecentResources(teacherId: string): Promise<RecentResource[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_resources")
    .select("id, title, subject, status, created_at")
    .eq("owner_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(6);

  return (data ?? []).map((r) => ({ id: r.id, title: r.title, subject: r.subject, status: r.status, createdAt: r.created_at }));
}
