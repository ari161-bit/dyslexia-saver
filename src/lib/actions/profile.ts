"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface ProfileActionResult {
  error?: string;
  success?: boolean;
}

export async function updateProfileAction(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) return { error: "Name can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bp_profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", user.profile.id);

  if (error) return { error: "Couldn't update your profile." };

  revalidatePath("/", "layout");
  return { success: true };
}
