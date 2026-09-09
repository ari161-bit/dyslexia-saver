import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/nav-config";
import type { Tables, UserRole } from "@/lib/types/database";

export type CurrentProfile = Tables<"bp_profiles">;

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
    .from("bp_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return { authUserId: user.id, email: user.email, profile: profile ?? null };
}

// Each role section (student/teacher/parent/school) trusts that whatever
// lands in its layout actually belongs to that role — without this, a
// logged-in user of any role can browse another role's routes directly by
// URL and see that role's (empty, since none of their data matches) page
// shell instead of being sent home.
export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  if (!user?.profile) redirect("/login");
  if (user.profile.role !== role) redirect(ROLE_HOME[user.profile.role]);
  return user as { authUserId: string; email: string | undefined; profile: CurrentProfile };
}

export async function getSchoolMembership(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_school_members")
    .select("*, bp_schools(name)")
    .eq("user_id", profileId)
    .maybeSingle();
  return data;
}
