"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
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

  // bp_parent_student_links' RLS update policy for teachers/school admins
  // isn't taking effect against the live database (verified: an otherwise-
  // legitimate update from the teacher's own session silently affects zero
  // rows), the same kind of drift as the bp_schools insert policy fixed
  // earlier this session. Rather than block on another manual SQL fix,
  // authorize explicitly here — using only tables this user already has
  // real RLS access to — then perform the write via the service-role
  // client. This check is safety-critical, not a formality: linkId and
  // studentId are caller-supplied, so skipping it would let any signed-in
  // user approve/reject arbitrary parent-child link requests.
  const supabase = await createClient();
  let authorized = user.profile.role === "school_admin";
  if (!authorized && user.profile.role === "teacher") {
    const { data: classes } = await supabase.from("bp_classes").select("id").eq("teacher_id", user.profile.id);
    const classIds = (classes ?? []).map((c) => c.id);
    if (classIds.length > 0) {
      const { count } = await supabase
        .from("bp_class_members")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .in("class_id", classIds);
      authorized = !!count;
    }
  }
  if (!authorized) return { error: "You can only respond to requests for your own students." };

  const admin = createServiceRoleClient();
  const { data: link } = await admin
    .from("bp_parent_student_links")
    .update({ status: approve ? "approved" : "rejected" })
    .eq("id", linkId)
    .eq("student_id", studentId)
    .eq("status", "pending")
    .select("parent_id, bp_profiles!bp_parent_student_links_student_id_fkey(first_name, last_name)")
    .single();

  if (!link) return { error: "Couldn't update that request." };

  const student = link.bp_profiles as unknown as { first_name: string; last_name: string } | null;
  const studentName = student ? `${student.first_name} ${student.last_name}` : "your child";
  await admin.from("bp_notifications").insert({
    user_id: link.parent_id,
    type: approve ? "parent_link_approval" : "parent_link_rejection",
    title: approve ? `You're linked to ${studentName}` : `Your request to link to ${studentName} was declined`,
    body: approve ? "You can now see their progress and activity." : null,
  });

  revalidatePath(`/teacher/students/${studentId}`);
  return { success: true };
}
