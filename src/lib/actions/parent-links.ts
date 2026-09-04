"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface LinkActionResult {
  error?: string;
  success?: boolean;
}

export async function requestChildLinkAction(_prev: LinkActionResult, formData: FormData): Promise<LinkActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.role !== "parent") return { error: "Only parent accounts can link to a child." };

  const code = String(formData.get("code") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "").trim();
  if (!code) return { error: "Enter your child's student code." };

  const supabase = await createClient();
  const { data: studentId } = await supabase.rpc("bp_find_student_by_code", { p_code: code });
  if (!studentId) return { error: "We couldn't find a student with that code." };

  const { error } = await supabase.from("bp_parent_student_links").insert({
    parent_id: user.profile.id,
    student_id: studentId,
    relationship: relationship || null,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already sent a request for this student." };
    return { error: "Couldn't send that request." };
  }

  revalidatePath("/parent/children");
  return { success: true };
}

export async function respondToLinkRequestAction(linkId: string, approve: boolean, studentId: string): Promise<LinkActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bp_parent_student_links")
    .update({ status: approve ? "approved" : "rejected" })
    .eq("id", linkId);

  if (error) return { error: "Couldn't update that request." };

  revalidatePath(`/teacher/students/${studentId}`);
  return { success: true };
}
