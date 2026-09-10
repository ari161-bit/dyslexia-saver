"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface SchoolActionResult {
  error?: string;
  success?: boolean;
}

export async function respondToTeacherRequestAction(membershipId: string, approve: boolean): Promise<SchoolActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { data: membership, error } = await supabase
    .from("bp_school_members")
    .update({ status: approve ? "approved" : "rejected" })
    .eq("id", membershipId)
    .select("user_id, bp_schools(name)")
    .single();

  if (error) return { error: "Couldn't update that request." };

  // A regular user can't insert a notification for someone else — same RLS
  // gap as the bp_schools insert earlier, same fix: this one narrow,
  // trusted cross-user write goes through the service-role client instead
  // of silently leaving the teacher with no signal their account is live.
  const schoolName = (membership.bp_schools as unknown as { name: string } | null)?.name ?? "your school";
  const admin = createServiceRoleClient();
  await admin.from("bp_notifications").insert({
    user_id: membership.user_id,
    type: approve ? "school_approval" : "school_rejection",
    title: approve ? `You're approved at ${schoolName}` : `Your request to join ${schoolName} was declined`,
    body: approve ? "You can now create classes and start adapting materials." : null,
  });

  revalidatePath("/school/teachers");
  return { success: true };
}

export async function createAnnouncementAction(_prev: SchoolActionResult, formData: FormData): Promise<SchoolActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const schoolId = String(formData.get("schoolId") ?? "");
  if (!title || !schoolId) return { error: "Give your announcement a title." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("bp_create_school_announcement", {
    p_school_id: schoolId,
    p_title: title,
    p_body: body || null,
  });
  if (error) return { error: "Couldn't send the announcement." };

  revalidatePath("/school/announcements");
  return { success: true };
}
