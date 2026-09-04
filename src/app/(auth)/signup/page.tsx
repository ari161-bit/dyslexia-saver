import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage() {
  let schools: { id: string; name: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("bp_schools_directory");
    schools = data ?? [];
  } catch {
    // Supabase not configured yet — the school picker will just be empty.
  }

  return <SignupForm schools={schools} />;
}
