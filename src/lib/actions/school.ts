"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface SchoolActionResult {
  error?: string;
  success?: boolean;
}

export async function respondToTeacherRequestAction(membershipId: string, approve: boolean): Promise<SchoolActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("school_members")
    .update({ status: approve ? "approved" : "rejected" })
    .eq("id", membershipId);

  if (error) return { error: "Couldn't update that request." };

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
  const { error } = await supabase.rpc("create_school_announcement", {
    p_school_id: schoolId,
    p_title: title,
    p_body: body || null,
  });
  if (error) return { error: "Couldn't send the announcement." };

  revalidatePath("/school/announcements");
  return { success: true };
}
