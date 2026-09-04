import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export async function getNotifications(userId: string): Promise<Tables<"bp_notifications">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}
