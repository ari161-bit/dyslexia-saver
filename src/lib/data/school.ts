import "server-only";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();

  const [{ count: teachers }, { data: classes }, { count: resources }] = await Promise.all([
    supabase.from("bp_school_members").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher").eq("status", "approved"),
    supabase.from("bp_classes").select("id").eq("school_id", schoolId),
    supabase.from("bp_resources").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
  ]);

  const classIds = (classes ?? []).map((c) => c.id);

  let assignments = 0;
  let students = 0;
  if (classIds.length > 0) {
    const [{ count: assignmentCount }, { data: roster }] = await Promise.all([
      supabase.from("bp_assignments").select("id", { count: "exact", head: true }).in("class_id", classIds),
      supabase.from("bp_class_members").select("student_id").in("class_id", classIds),
    ]);
    assignments = assignmentCount ?? 0;
    students = new Set((roster ?? []).map((r) => r.student_id)).size;
  }

  const studentIdsForPrefs = classIds.length
    ? (await supabase.from("bp_class_members").select("student_id").in("class_id", classIds)).data ?? []
    : [];
  const uniqueStudentIds = Array.from(new Set(studentIdsForPrefs.map((r) => r.student_id)));
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

export interface SchoolStaffMember {
  id: string;
  profileId: string;
  name: string;
  status: "pending" | "approved" | "rejected";
}

export async function getSchoolTeachers(schoolId: string): Promise<SchoolStaffMember[]> {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data: classes } = await supabase.from("bp_classes").select("id, name").eq("school_id", schoolId);
  const classIds = (classes ?? []).map((c) => c.id);
  if (classIds.length === 0) return [];

  const { data: roster } = await supabase
    .from("bp_class_members")
    .select("student_id, class_id, bp_profiles(first_name, last_name)")
    .in("class_id", classIds);

  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));
  const byStudent = new Map<string, SchoolStudent>();
  for (const r of roster ?? []) {
    const profile = r.bp_profiles as unknown as { first_name: string; last_name: string } | null;
    const existing = byStudent.get(r.student_id);
    const className = classNameById.get(r.class_id) ?? "Class";
    if (existing) existing.classNames.push(className);
    else byStudent.set(r.student_id, { studentId: r.student_id, name: profile ? `${profile.first_name} ${profile.last_name}` : "Student", classNames: [className] });
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
  const supabase = await createClient();
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
