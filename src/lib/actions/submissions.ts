"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function saveSubmissionAction(
  assignmentId: string,
  content: string,
  submit: boolean,
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { error } = await supabase.from("bp_submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: user.profile.id,
      content: { text: content },
      status: submit ? "submitted" : "in_progress",
      submitted_at: submit ? new Date().toISOString() : null,
    },
    { onConflict: "assignment_id,student_id" },
  );

  if (error) return { error: "Couldn't save your work." };

  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/assignments");
  return { success: true };
}
