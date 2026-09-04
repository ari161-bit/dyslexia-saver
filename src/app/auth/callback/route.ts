import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/nav-config";
import type { UserRole } from "@/lib/types/database";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();

      if (!existing) {
        const meta = data.user.user_metadata as {
          first_name?: string;
          last_name?: string;
          role?: UserRole;
          school_name?: string;
          school_id?: string;
        };
        const role = meta.role ?? "student";
        const { data: profile } = await supabase
          .from("profiles")
          .insert({
            auth_user_id: data.user.id,
            role,
            first_name: meta.first_name ?? "New",
            last_name: meta.last_name ?? "User",
            student_code: role === "student" ? Math.random().toString(36).slice(2, 8).toUpperCase() : null,
          })
          .select("id")
          .single();

        if (profile && role === "teacher" && meta.school_id) {
          await supabase.from("school_members").insert({
            school_id: meta.school_id,
            user_id: profile.id,
            role: "teacher",
            status: "pending",
          });
        }
        if (profile && role === "school_admin" && meta.school_name) {
          const { data: schoolExists } = await supabase
            .from("schools")
            .select("id")
            .ilike("name", meta.school_name)
            .maybeSingle();
          if (schoolExists) {
            await supabase.from("school_members").insert({
              school_id: schoolExists.id,
              user_id: profile.id,
              role: "school_admin",
              status: "pending",
            });
          } else {
            const { data: newSchool } = await supabase
              .from("schools")
              .insert({ name: meta.school_name })
              .select("id")
              .single();
            if (newSchool) {
              await supabase.from("school_members").insert({
                school_id: newSchool.id,
                user_id: profile.id,
                role: "school_admin",
                status: "approved",
              });
            }
          }
        }

        return NextResponse.redirect(`${origin}${ROLE_HOME[role]}`);
      }

      return NextResponse.redirect(`${origin}${ROLE_HOME[existing.role]}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
