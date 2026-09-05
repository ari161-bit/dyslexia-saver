"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { sendInviteEmail } from "@/lib/email";
import { ROLE_HOME } from "@/lib/nav-config";
import type { UserRole } from "@/lib/types/database";

export interface InviteActionResult {
  error?: string;
  success?: boolean;
  acceptUrl?: string; // returned even when email delivery isn't configured, so the inviter can copy/share it
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// A school admin invites a teacher (or another admin) to their own school.
export async function inviteTeacherAction(_prev: InviteActionResult, formData: FormData): Promise<InviteActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.role !== "school_admin") return { error: "Only a school admin can send this invite." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = (String(formData.get("role") ?? "teacher") as UserRole) || "teacher";
  if (!email) return { error: "Enter an email address." };
  if (role !== "teacher" && role !== "school_admin") return { error: "Invalid role for a staff invite." };

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("bp_school_members")
    .select("school_id, bp_schools(name)")
    .eq("user_id", user.profile.id)
    .eq("role", "school_admin")
    .eq("status", "approved")
    .maybeSingle();
  if (!membership) return { error: "Your admin membership needs to be approved first." };

  const { data: invite, error } = await supabase
    .from("bp_invites")
    .insert({ school_id: membership.school_id, inviter_id: user.profile.id, email, role })
    .select("token")
    .single();
  if (error || !invite) return { error: "Couldn't create that invite." };

  const acceptUrl = `${siteUrl()}/invite/${invite.token}`;
  const schoolName = (membership.bp_schools as unknown as { name: string } | null)?.name ?? "your school";
  await sendInviteEmail({
    to: email,
    inviterName: `${user.profile.first_name} ${user.profile.last_name}`,
    schoolName,
    role: role as "teacher" | "school_admin",
    acceptUrl,
  });

  revalidatePath("/school/teachers");
  return { success: true, acceptUrl };
}

// A teacher invites a student to one of their own classes.
export async function inviteStudentAction(_prev: InviteActionResult, formData: FormData): Promise<InviteActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.role !== "teacher") return { error: "Only a teacher can invite students." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const classId = String(formData.get("classId") ?? "").trim();
  if (!email) return { error: "Enter the student's email address." };
  if (!classId) return { error: "Missing class." };

  const supabase = await createClient();
  const { data: klass } = await supabase
    .from("bp_classes")
    .select("id, name, school_id, bp_schools(name)")
    .eq("id", classId)
    .eq("teacher_id", user.profile.id)
    .maybeSingle();
  if (!klass) return { error: "You can only invite students to your own classes." };

  const { data: invite, error } = await supabase
    .from("bp_invites")
    .insert({ school_id: klass.school_id, class_id: klass.id, inviter_id: user.profile.id, email, role: "student" })
    .select("token")
    .single();
  if (error || !invite) return { error: "Couldn't create that invite." };

  const acceptUrl = `${siteUrl()}/invite/${invite.token}`;
  const schoolName = (klass.bp_schools as unknown as { name: string } | null)?.name ?? "Brightpath";
  await sendInviteEmail({
    to: email,
    inviterName: `${user.profile.first_name} ${user.profile.last_name}`,
    schoolName,
    className: klass.name,
    role: "student",
    acceptUrl,
  });

  revalidatePath(`/teacher/classes/${classId}`);
  return { success: true, acceptUrl };
}

export async function revokeInviteAction(inviteId: string) {
  const user = await getCurrentUser();
  if (!user?.profile) return;
  const supabase = await createClient();
  await supabase.from("bp_invites").update({ status: "revoked" }).eq("id", inviteId).eq("inviter_id", user.profile.id);
  revalidatePath("/school/teachers");
}

// Already has a Brightpath account (matching email) — just needs to accept.
export async function acceptInviteAction(_prev: InviteActionResult, formData: FormData): Promise<InviteActionResult> {
  const token = String(formData.get("token") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc("bp_accept_invite", { p_token: token });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("bp_profiles").select("role").eq("auth_user_id", user!.id).maybeSingle();
  redirect(profile ? ROLE_HOME[profile.role] : "/redirect-home");
}

// No account yet — create one (locked to the invite's email/role/school), then accept.
export async function acceptInviteSignUpAction(_prev: InviteActionResult, formData: FormData): Promise<InviteActionResult> {
  const token = String(formData.get("token") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!firstName || !lastName || !password) return { error: "Please fill in every field." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data: invites } = await supabase.rpc("bp_get_invite_by_token", { p_token: token });
  const invite = invites?.[0];
  if (!invite) return { error: "This invite link isn't valid." };
  if (invite.status !== "pending") return { error: "This invite has already been used or has expired." };

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: invite.email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/invite/${token}`,
      data: { first_name: firstName, last_name: lastName, role: invite.role },
    },
  });
  if (signUpError) return { error: signUpError.message };
  if (!signUpData.user) return { error: "Something went wrong creating your account." };

  // No email confirmation required on this project (session came back immediately) —
  // create the profile and accept right away. If confirmation IS required, the
  // confirmation link's redirect (emailRedirectTo above) lands back on this same
  // invite page, which will prompt them to accept once they're signed in.
  if (signUpData.session) {
    const { error: profileError } = await supabase.from("bp_profiles").insert({
      auth_user_id: signUpData.user.id,
      role: invite.role,
      first_name: firstName,
      last_name: lastName,
      student_code: invite.role === "student" ? Math.random().toString(36).slice(2, 8).toUpperCase() : null,
    });
    if (profileError) return { error: "Account created, but we couldn't finish setup. Try logging in." };

    const { error: acceptError } = await supabase.rpc("bp_accept_invite", { p_token: token });
    if (acceptError) return { error: acceptError.message };

    redirect(ROLE_HOME[invite.role]);
  }

  return { success: true };
}
