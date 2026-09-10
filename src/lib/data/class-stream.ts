import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface StreamComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface StreamPost {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  linkUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  comments: StreamComment[];
}

function profileName(p: unknown): string {
  const profile = p as { first_name: string; last_name: string } | null;
  return profile ? `${profile.first_name} ${profile.last_name}` : "Someone";
}

export async function getClassStream(classId: string): Promise<StreamPost[]> {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("bp_class_posts")
    .select("id, author_id, body, link_url, image_url, created_at, bp_profiles(first_name, last_name)")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: comments } = postIds.length
    ? await supabase
        .from("bp_post_comments")
        .select("id, post_id, author_id, body, created_at, bp_profiles(first_name, last_name)")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const commentsByPost = new Map<string, StreamComment[]>();
  for (const c of comments ?? []) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({ id: c.id, authorId: c.author_id, authorName: profileName(c.bp_profiles), body: c.body, createdAt: c.created_at });
    commentsByPost.set(c.post_id, list);
  }

  return (posts ?? []).map((p) => ({
    id: p.id,
    authorId: p.author_id,
    authorName: profileName(p.bp_profiles),
    body: p.body,
    linkUrl: p.link_url,
    imageUrl: p.image_url,
    createdAt: p.created_at,
    comments: commentsByPost.get(p.id) ?? [],
  }));
}

export interface ClassBasicInfo {
  id: string;
  name: string;
  subject: string | null;
}

export async function getClassBasicInfo(classId: string): Promise<ClassBasicInfo | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("bp_classes").select("id, name, subject").eq("id", classId).maybeSingle();
  return data;
}

export interface StudentClassSummary {
  id: string;
  name: string;
  subject: string | null;
  teacherName: string;
}

export async function getStudentClasses(studentId: string): Promise<StudentClassSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_class_members")
    .select("bp_classes(id, name, subject, bp_profiles(first_name, last_name))")
    .eq("student_id", studentId);

  return (data ?? [])
    .map((r) => r.bp_classes as unknown as { id: string; name: string; subject: string | null; bp_profiles: { first_name: string; last_name: string } | null } | null)
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((c) => ({ id: c.id, name: c.name, subject: c.subject, teacherName: c.bp_profiles ? `${c.bp_profiles.first_name} ${c.bp_profiles.last_name}` : "Teacher" }));
}
