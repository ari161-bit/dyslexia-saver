import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ExtractedContent } from "@/lib/ai/types";
import type { Tables } from "@/lib/types/database";

export async function getResource(resourceId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("bp_resources").select("*").eq("id", resourceId).maybeSingle();
  return data;
}

export function resourceSections(resource: Tables<"bp_resources">): ExtractedContent["sections"] {
  const structure = resource.extracted_structure as ExtractedContent | null;
  if (structure?.sections?.length) return structure.sections;
  if (resource.extracted_text) return [{ heading: null, paragraphs: [resource.extracted_text] }];
  return [{ heading: null, paragraphs: ["This resource is still processing."] }];
}

export async function getNotesForResource(userId: string, resourceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAdaptations(resourceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bp_resource_adaptations")
    .select("*")
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
