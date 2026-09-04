"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface ClassActionResult {
  error?: string;
  success?: boolean;
}

export async function createClassAction(_prev: ClassActionResult, formData: FormData): Promise<ClassActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.role !== "teacher") return { error: "Only teachers can create classes." };

  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  if (!name) return { error: "Give your class a name." };

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("bp_school_members")
    .select("school_id")
    .eq("user_id", user.profile.id)
    .eq("status", "approved")
    .maybeSingle();

  if (!membership) return { error: "Your school membership needs to be approved before you can create classes." };

  const { error } = await supabase.from("bp_classes").insert({
    school_id: membership.school_id,
    teacher_id: user.profile.id,
    name,
    grade: grade || null,
    subject: subject || null,
  });

  if (error) return { error: "Couldn't create the class." };

  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
  return { success: true };
}

export async function joinClassByCodeAction(_prev: ClassActionResult, formData: FormData): Promise<ClassActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.role !== "student") return { error: "Only students can join a class this way." };

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter the class code your teacher shared." };

  const supabase = await createClient();
  const { data: classId } = await supabase.rpc("bp_find_class_by_code", { p_code: code });
  if (!classId) return { error: "We couldn't find a class with that code." };

  const { error } = await supabase.from("bp_class_members").insert({ class_id: classId, student_id: user.profile.id });
  if (error) {
    if (error.code === "23505") return { error: "You're already in this class." };
    return { error: "Couldn't join that class." };
  }

  revalidatePath("/student/learning");
  revalidatePath("/student");
  return { success: true };
}
