"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function sendMessageAction(recipientId: string, content: string, pathname: string) {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };
  if (!content.trim()) return { error: "Write something first." };

  const supabase = await createClient();
  const { error } = await supabase.from("bp_messages").insert({
    sender_id: user.profile.id,
    recipient_id: recipientId,
    content,
  });

  if (error) return { error: "Couldn't send that message." };

  revalidatePath(pathname);
  return { success: true };
}
