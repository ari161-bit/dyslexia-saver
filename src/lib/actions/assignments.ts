"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface AssignmentActionResult {
  error?: string;
}

export async function createAssignmentAction(_prev: AssignmentActionResult, formData: FormData): Promise<AssignmentActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.role !== "teacher") return { error: "Only teachers can create assignments." };

  const title = String(formData.get("title") ?? "").trim();
  const classId = String(formData.get("classId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  const resourceId = String(formData.get("resourceId") ?? "");

  if (!title || !classId) return { error: "Give the assignment a title and choose a class." };

  const supabase = await createClient();
  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      teacher_id: user.profile.id,
      class_id: classId,
      resource_id: resourceId || null,
      title,
      description: description || null,
      instructions: instructions || null,
      subject: subject || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !assignment) return { error: "Couldn't create the assignment." };

  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/classes/${classId}`);
  redirect(`/teacher/assignments/${assignment.id}`);
}

export async function markSubmissionReviewedAction(submissionId: string, assignmentId: string) {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { error } = await supabase.from("submissions").update({ status: "reviewed" }).eq("id", submissionId);
  if (error) return { error: "Couldn't update this submission." };

  revalidatePath(`/teacher/assignments/${assignmentId}`);
  return { success: true };
}
