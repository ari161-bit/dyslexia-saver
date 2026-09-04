"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { revalidatePath } from "next/cache";
import type { ReadingPreferences } from "@/lib/data/reading-preferences";

export async function updateReadingPreferencesAction(patch: Partial<ReadingPreferences>) {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bp_reading_preferences")
    .upsert({ user_id: user.profile.id, ...patch, updated_at: new Date().toISOString() });

  if (error) return { error: "Couldn't save your preferences." };

  revalidatePath("/student", "layout");
  return { success: true };
}
