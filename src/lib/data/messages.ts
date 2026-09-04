import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export interface Contact {
  id: string;
  name: string;
  subtitle: string;
}

export async function getMessageableContacts(profileId: string, role: UserRole): Promise<Contact[]> {
  const supabase = await createClient();

  if (role === "teacher") {
    const { data: classes } = await supabase.from("bp_classes").select("id").eq("teacher_id", profileId);
    const classIds = (classes ?? []).map((c) => c.id);
    if (classIds.length === 0) return [];

    const { data: roster } = await supabase.from("bp_class_members").select("student_id").in("class_id", classIds);
    const studentIds = Array.from(new Set((roster ?? []).map((r) => r.student_id)));
    if (studentIds.length === 0) return [];

    const { data: links } = await supabase
      .from("bp_parent_student_links")
      .select("parent_id, student_id, bp_profiles!bp_parent_student_links_parent_id_fkey(first_name, last_name), students:bp_profiles!bp_parent_student_links_student_id_fkey(first_name, last_name)")
      .in("student_id", studentIds)
      .eq("status", "approved");

    const seen = new Set<string>();
    const contacts: Contact[] = [];
    for (const link of links ?? []) {
      if (seen.has(link.parent_id)) continue;
      seen.add(link.parent_id);
      const parent = link.bp_profiles as unknown as { first_name: string; last_name: string } | null;
      const student = link.students as unknown as { first_name: string; last_name: string } | null;
      contacts.push({
        id: link.parent_id,
        name: parent ? `${parent.first_name} ${parent.last_name}` : "Parent",
        subtitle: student ? `Parent of ${student.first_name}` : "Parent",
      });
    }
    return contacts;
  }

  if (role === "parent") {
    const { data: links } = await supabase
      .from("bp_parent_student_links")
      .select("student_id")
      .eq("parent_id", profileId)
      .eq("status", "approved");
    const studentIds = (links ?? []).map((l) => l.student_id);
    if (studentIds.length === 0) return [];

    const { data: classes } = await supabase
      .from("bp_class_members")
      .select("class_id, bp_classes(name, teacher_id, bp_profiles(first_name, last_name))")
      .in("student_id", studentIds);

    const seen = new Set<string>();
    const contacts: Contact[] = [];
    for (const row of classes ?? []) {
      const cls = row.bp_classes as unknown as { name: string; teacher_id: string; bp_profiles: { first_name: string; last_name: string } | null } | null;
      if (!cls || seen.has(cls.teacher_id)) continue;
      seen.add(cls.teacher_id);
      contacts.push({
        id: cls.teacher_id,
        name: cls.bp_profiles ? `${cls.bp_profiles.first_name} ${cls.bp_profiles.last_name}` : "Teacher",
        subtitle: cls.name,
      });
    }
    return contacts;
  }

  return [];
}

export interface ConversationPreview {
  contactId: string;
  lastMessage: string;
  lastAt: string;
  unread: boolean;
}

export async function getConversationPreviews(profileId: string): Promise<ConversationPreview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_messages")
    .select("*")
    .or(`sender_id.eq.${profileId},recipient_id.eq.${profileId}`)
    .order("created_at", { ascending: false });

  const byContact = new Map<string, ConversationPreview>();
  for (const m of data ?? []) {
    const contactId = m.sender_id === profileId ? m.recipient_id : m.sender_id;
    if (byContact.has(contactId)) continue;
    byContact.set(contactId, {
      contactId,
      lastMessage: m.content,
      lastAt: m.created_at,
      unread: m.recipient_id === profileId && !m.read_at,
    });
  }
  return Array.from(byContact.values());
}

export async function getThreadMessages(profileId: string, contactId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${profileId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${profileId})`,
    )
    .order("created_at", { ascending: true });

  await supabase
    .from("bp_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", contactId)
    .eq("recipient_id", profileId)
    .is("read_at", null);

  return data ?? [];
}

export async function getProfileName(profileId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from("bp_profiles").select("first_name, last_name").eq("id", profileId).maybeSingle();
  return data ? `${data.first_name} ${data.last_name}` : "Brightpath user";
}
