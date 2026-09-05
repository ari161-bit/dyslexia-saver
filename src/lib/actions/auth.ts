"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/nav-config";
import type { UserRole } from "@/lib/types/database";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function signUpAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  const schoolName = String(formData.get("schoolName") ?? "").trim();
  const schoolId = String(formData.get("schoolId") ?? "").trim();

  if (!firstName || !lastName || !email || !password || !role) {
    return { error: "Please fill in every field." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if ((role === "teacher" && !schoolId) || (role === "school_admin" && !schoolName)) {
    return { error: role === "teacher" ? "Please select your school." : "Please name your school." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: { first_name: firstName, last_name: lastName, role, school_name: schoolName, school_id: schoolId },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Something went wrong creating your account." };

  if (data.session) {
    try {
      await provisionProfile(data.user.id, { firstName, lastName, role, schoolName, schoolId });
    } catch (err) {
      console.error("provisionProfile failed during signup", err);
      return {
        error: "Your account was created, but we couldn't finish setting it up. Please try logging in — if that doesn't work, contact support.",
      };
    }
    redirect(ROLE_HOME[role]);
  }

  redirect("/verify-email");
}

export async function signInAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password." };

  // Only ever redirect to a same-site path (starts with a single "/", never
  // "//" which browsers treat as protocol-relative to another host) — next
  // comes from a query param an attacker could craft, so an open redirect
  // here would be a real phishing vector.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/redirect-home");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/reset-password`,
  });

  return { success: true };
}

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/login?reset=success");
}

async function provisionProfile(
  authUserId: string,
  opts: { firstName: string; lastName: string; role: UserRole; schoolName: string; schoolId: string },
) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("bp_profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  let profileId = existing?.id as string | undefined;

  if (!profileId) {
    const { data: profile, error } = await supabase
      .from("bp_profiles")
      .insert({
        auth_user_id: authUserId,
        role: opts.role,
        first_name: opts.firstName,
        last_name: opts.lastName,
        student_code: opts.role === "student" ? generateCode() : null,
      })
      .select("id")
      .single();
    if (error) throw error;
    profileId = profile.id;
  }

  if (opts.role === "school_admin" && opts.schoolName) {
    const { data: schoolExists } = await supabase
      .from("bp_schools")
      .select("id")
      .ilike("name", opts.schoolName)
      .maybeSingle();

    if (schoolExists) {
      await supabase.from("bp_school_members").insert({
        school_id: schoolExists.id,
        user_id: profileId,
        role: "school_admin",
        status: "pending",
      });
    } else {
      const { data: newSchool, error: schoolError } = await supabase
        .from("bp_schools")
        .insert({ name: opts.schoolName })
        .select("id")
        .single();
      if (schoolError) throw schoolError;
      const { error: memberError } = await supabase.from("bp_school_members").insert({
        school_id: newSchool.id,
        user_id: profileId,
        role: "school_admin",
        status: "approved",
      });
      if (memberError) throw memberError;
    }
  }

  if (opts.role === "teacher" && opts.schoolId) {
    await supabase.from("bp_school_members").insert({
      school_id: opts.schoolId,
      user_id: profileId,
      role: "teacher",
      status: "pending",
    });
  }

  revalidatePath("/", "layout");
}
