import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export interface StudentAssignmentListItem {
  id: string;
  title: string;
  subject: string | null;
  dueDate: string | null;
  className: string;
  status: string;
}

export async function getStudentAssignments(studentId: string): Promise<StudentAssignmentListItem[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase.from("class_members").select("class_id").eq("student_id", studentId);
  const classIds = (memberships ?? []).map((m) => m.class_id);
  if (classIds.length === 0) return [];

  const { data } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, classes(name), submissions(status, student_id)")
    .in("class_id", classIds)
    .order("due_date", { ascending: true });

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
      status: mine?.status ?? "not_started",
    };
  });
}

export interface AssignmentDetail {
  assignment: Tables<"assignments">;
  className: string;
  resource: Tables<"resources"> | null;
  submission: Tables<"submissions"> | null;
}

export async function getAssignmentDetail(assignmentId: string, studentId: string): Promise<AssignmentDetail | null> {
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, classes(name), resources(*)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment) return null;

  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  const cls = assignment.classes as unknown as { name: string } | null;
  const resource = assignment.resources as unknown as Tables<"resources"> | null;

  return {
    assignment,
    className: cls?.name ?? "Class",
    resource,
    submission: submission ?? null,
  };
}

export interface TeacherAssignmentSubmissions {
  assignment: Tables<"assignments">;
  className: string;
  submissions: (Tables<"submissions"> & { studentName: string })[];
  rosterSize: number;
}

export async function getAssignmentSubmissions(assignmentId: string): Promise<TeacherAssignmentSubmissions | null> {
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, classes(name)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment) return null;

  const { data: roster } = await supabase.from("class_members").select("student_id, profiles(first_name, last_name)").eq("class_id", assignment.class_id);
  const { data: submissions } = await supabase.from("submissions").select("*").eq("assignment_id", assignmentId);

  const submissionByStudent = new Map((submissions ?? []).map((s) => [s.student_id, s]));

  const combined = (roster ?? []).map((r) => {
    const profile = r.profiles as unknown as { first_name: string; last_name: string } | null;
    const existing = submissionByStudent.get(r.student_id);
    return (
      existing ?? {
        id: `pending-${r.student_id}`,
        assignment_id: assignmentId,
        student_id: r.student_id,
        content: null,
        status: "not_started" as const,
        submitted_at: null,
        created_at: assignment.created_at,
      }
    );
  }).map((s, i) => ({
    ...s,
    studentName: (() => {
      const profile = (roster ?? [])[i]?.profiles as unknown as { first_name: string; last_name: string } | null;
      return profile ? `${profile.first_name} ${profile.last_name}` : "Student";
    })(),
  }));

  const cls = assignment.classes as unknown as { name: string } | null;

  return {
    assignment,
    className: cls?.name ?? "Class",
    submissions: combined,
    rosterSize: roster?.length ?? 0,
  };
}
