"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface SchoolNameActionResult {
  error?: string;
  success?: boolean;
}

export async function updateSchoolNameAction(
  _prev: SchoolNameActionResult,
  formData: FormData,
): Promise<SchoolNameActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const schoolId = String(formData.get("schoolId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "School name can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("bp_schools").update({ name }).eq("id", schoolId);
  if (error) return { error: "Couldn't update the school name." };

  revalidatePath("/school", "layout");
  return { success: true };
}
