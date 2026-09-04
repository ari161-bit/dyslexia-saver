"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user?.profile) return;

  const supabase = await createClient();
  await supabase.from("bp_notifications").update({ read: true }).eq("user_id", user.profile.id).eq("read", false);

  revalidatePath("/notifications");
}
