"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSchoolForAdmin } from "@/lib/data/school";
import { generateStudentCode } from "@/lib/student-code";

export interface CreateStudentResult {
  error?: string;
  success?: boolean;
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomPassword(): string {
  return randomBytes(6).toString("base64url");
}

// A school admin sets up a student's login directly (email + password
// chosen by the admin) instead of the student self-signing-up through an
// invite link — for schools that issue managed accounts to every student.
export async function createStudentAccountAction(_prev: CreateStudentResult, formData: FormData): Promise<CreateStudentResult> {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.role !== "school_admin") return { error: "Only a school admin can create student accounts." };

  const school = await getSchoolForAdmin(user.profile.id);
  if (!school || school.status !== "approved") return { error: "Your admin membership needs to be approved first." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const classId = String(formData.get("classId") ?? "").trim();
  let password = String(formData.get("password") ?? "").trim();

  if (!firstName || !lastName) return { error: "Enter the student's first and last name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password && password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!password) password = randomPassword();

  const admin = createServiceRoleClient();

  if (classId) {
    const { data: klass } = await admin.from("bp_classes").select("id, school_id").eq("id", classId).maybeSingle();
    if (!klass || klass.school_id !== school.schoolId) return { error: "That class isn't in your school." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, role: "student" },
  });
  if (createError || !created.user) {
    return { error: createError?.message.includes("already been registered") ? "An account with that email already exists." : "Couldn't create that account." };
  }

  const { data: profile, error: profileError } = await admin
    .from("bp_profiles")
    .insert({
      auth_user_id: created.user.id,
      role: "student",
      first_name: firstName,
      last_name: lastName,
      student_code: generateStudentCode(),
      school_id: school.schoolId,
    })
    .select("id")
    .single();
  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Account created but setup failed — nothing was saved. Try again." };
  }

  if (classId) {
    await admin.from("bp_class_members").insert({ class_id: classId, student_id: profile.id });
  }

  revalidatePath("/school/students");
  revalidatePath("/school/classes");
  if (classId) revalidatePath(`/school/classes/${classId}`);
  return { success: true, email, password };
}

export interface ClassActionResult {
  error?: string;
  success?: boolean;
}

// The school admin enrolls a student who already has an account into one
// of the school's classes by picking them from the roster, the same way a
// teacher manages who's in their own class — instead of the student having
// to join themselves with a code or an emailed invite.
export async function addStudentToClassAction(_prev: ClassActionResult, formData: FormData): Promise<ClassActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.role !== "school_admin") return { error: "Only a school admin can do this." };

  const classId = String(formData.get("classId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  if (!classId || !studentId) return { error: "Pick a student to add." };

  const school = await getSchoolForAdmin(user.profile.id);
  if (!school || school.status !== "approved") return { error: "Your admin membership needs to be approved first." };

  const supabase = await createClient();
  const { data: klass } = await supabase.from("bp_classes").select("id, school_id").eq("id", classId).maybeSingle();
  if (!klass || klass.school_id !== school.schoolId) return { error: "That class isn't in your school." };

  // Regular RLS has no school_admin SELECT policy on bp_profiles for a
  // student (only for staff, via bp_school_members) — service role needed
  // here too, same reasoning as the class/roster reads in data/school.ts.
  const admin = createServiceRoleClient();
  const { data: student } = await admin.from("bp_profiles").select("id, role").eq("id", studentId).maybeSingle();
  if (!student || student.role !== "student") return { error: "That student account wasn't found." };

  const { error } = await admin.from("bp_class_members").insert({ class_id: classId, student_id: studentId });
  if (error) return { error: error.code === "23505" ? "That student is already in this class." : "Couldn't add that student." };

  revalidatePath(`/school/classes/${classId}`);
  revalidatePath("/school/students");
  return { success: true };
}
