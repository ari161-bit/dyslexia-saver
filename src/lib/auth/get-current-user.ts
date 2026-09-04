import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type CurrentProfile = Tables<"profiles">;

export async function getCurrentUser(): Promise<{
  authUserId: string;
  email: string | undefined;
  profile: CurrentProfile | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return { authUserId: user.id, email: user.email, profile: profile ?? null };
}

export async function getSchoolMembership(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("school_members")
    .select("*, schools(name)")
    .eq("user_id", profileId)
    .maybeSingle();
  return data;
}
