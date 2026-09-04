"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAIService } from "@/lib/ai/service";
import type { AdaptationType } from "@/lib/types/database";

export interface AdaptationActionResult {
  error?: string;
  success?: boolean;
  content?: unknown;
  adaptationId?: string;
}

async function buildContent(type: AdaptationType, text: string, rateLimitKey: string) {
  const ai = getAIService(rateLimitKey);
  switch (type) {
    case "accessible": {
      const result = await ai.adaptText({ text });
      return { sections: result.data.sections };
    }
    case "breakdown": {
      const result = await ai.adaptText({ text });
      const steps = result.data.sections.flatMap((s) => s.paragraphs);
      return { steps };
    }
    case "explain": {
      const result = await ai.explainText({ text });
      return { text: result.data };
    }
    case "vocabulary": {
      const result = await ai.generateVocabulary({ text });
      return { entries: result.data };
    }
    case "audio": {
      return { text };
    }
    case "practice": {
      const result = await ai.generatePractice({ text, count: 5 });
      return { questions: result.data };
    }
    case "revision": {
      const result = await ai.generateRevisionGuide({ text });
      return result.data;
    }
  }
}

export async function generateAdaptationAction(resourceId: string, type: AdaptationType): Promise<AdaptationActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { data: resource } = await supabase.from("resources").select("extracted_text").eq("id", resourceId).maybeSingle();
  if (!resource?.extracted_text) return { error: "This resource doesn't have readable text yet." };

  try {
    const content = await buildContent(type, resource.extracted_text, user.profile.id);
    const { data, error } = await supabase
      .from("resource_adaptations")
      .insert({ resource_id: resourceId, type, content, created_by: user.profile.id, approved: false })
      .select("id")
      .single();

    if (error) return { error: "Couldn't save the generated content." };

    revalidatePath(`/teacher/resources/${resourceId}/adapt`);
    return { success: true, content, adaptationId: data.id };
  } catch {
    return { error: "The AI service is unavailable right now. Try again shortly." };
  }
}

export async function updateAdaptationAction(adaptationId: string, content: unknown, resourceId: string): Promise<AdaptationActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { error } = await supabase.from("resource_adaptations").update({ content }).eq("id", adaptationId);
  if (error) return { error: "Couldn't save your changes." };

  revalidatePath(`/teacher/resources/${resourceId}/adapt`);
  return { success: true };
}

export async function setAdaptationApprovedAction(adaptationId: string, approved: boolean, resourceId: string): Promise<AdaptationActionResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  const supabase = await createClient();
  const { error } = await supabase.from("resource_adaptations").update({ approved }).eq("id", adaptationId);
  if (error) return { error: "Couldn't update publish status." };

  revalidatePath(`/teacher/resources/${resourceId}/adapt`);
  revalidatePath("/student/learning");
  return { success: true };
}
