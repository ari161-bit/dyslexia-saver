import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface LearningResourceCard {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  source: "assigned" | "own";
}

export async function getStudentLearningResources(studentId: string): Promise<LearningResourceCard[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase.from("bp_class_members").select("class_id").eq("student_id", studentId);
  const classIds = (memberships ?? []).map((m) => m.class_id);

  const assigned = classIds.length
    ? await supabase
        .from("bp_assignments")
        .select("bp_resources(id, title, subject, status)")
        .in("class_id", classIds)
        .not("resource_id", "is", null)
    : { data: [] };

  const { data: own } = await supabase
    .from("bp_resources")
    .select("id, title, subject, status")
    .eq("owner_id", studentId)
    .order("created_at", { ascending: false });

  const assignedCards: LearningResourceCard[] = (assigned.data ?? [])
    .map((a) => a.bp_resources as unknown as { id: string; title: string; subject: string | null; status: string } | null)
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({ ...r, source: "assigned" as const }));

  const ownCards: LearningResourceCard[] = (own ?? []).map((r) => ({ ...r, source: "own" as const }));

  const seen = new Set<string>();
  return [...assignedCards, ...ownCards].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

export interface PracticeableResource {
  id: string;
  title: string;
  extractedText: string;
}

export async function getPracticeableResources(studentId: string): Promise<PracticeableResource[]> {
  const cards = await getStudentLearningResources(studentId);
  const readyIds = cards.filter((c) => c.status === "ready").map((c) => c.id);
  if (readyIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("bp_resources").select("id, title, extracted_text").in("id", readyIds);
  return (data ?? [])
    .filter((r) => r.extracted_text)
    .map((r) => ({ id: r.id, title: r.title, extractedText: r.extracted_text! }));
}
