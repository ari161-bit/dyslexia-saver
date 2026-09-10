"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface StreamActionResult {
  error?: string;
  success?: boolean;
}

const URL_RE = /^https?:\/\/.+/i;

export async function createPostAction(_prev: StreamActionResult, formData: FormData): Promise<StreamActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };
  if (user.profile.role !== "teacher" && user.profile.role !== "school_admin") {
    return { error: "Only a teacher or school admin can post to the stream." };
  }

  const classId = String(formData.get("classId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!classId) return { error: "Missing class." };
  if (!body) return { error: "Write something before posting." };
  if (linkUrl && !URL_RE.test(linkUrl)) return { error: "That link doesn't look like a valid URL." };
  if (imageUrl && !URL_RE.test(imageUrl)) return { error: "That image URL doesn't look valid." };

  const supabase = await createClient();
  const { error } = await supabase.from("bp_class_posts").insert({
    class_id: classId,
    author_id: user.profile.id,
    body,
    link_url: linkUrl || null,
    image_url: imageUrl || null,
  });

  if (error) return { error: "Couldn't post that — make sure you teach this class." };

  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath(`/student/classroom/${classId}`);
  revalidatePath(`/school/classes/${classId}`);
  return { success: true };
}

export async function createCommentAction(_prev: StreamActionResult, formData: FormData): Promise<StreamActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const postId = String(formData.get("postId") ?? "").trim();
  const classId = String(formData.get("classId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!postId) return { error: "Missing post." };
  if (!body) return { error: "Write a reply first." };

  const supabase = await createClient();
  const { error } = await supabase.from("bp_post_comments").insert({
    post_id: postId,
    author_id: user.profile.id,
    body,
  });

  if (error) return { error: "Couldn't send that reply." };

  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath(`/student/classroom/${classId}`);
  revalidatePath(`/school/classes/${classId}`);
  return { success: true };
}
