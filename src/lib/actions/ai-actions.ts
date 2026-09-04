"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAIService } from "@/lib/ai/service";
import { revalidatePath } from "next/cache";

export interface ExplainResult {
  explanation?: string;
  error?: string;
}

export async function explainSelectionAction(text: string, question?: string): Promise<ExplainResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };
  if (!text.trim()) return { error: "Select some text first." };

  try {
    const ai = getAIService(user.profile.id);
    const result = await ai.explainText({ text, question });
    return { explanation: result.data };
  } catch {
    return { error: "The tutor is unavailable right now. Try again shortly." };
  }
}

export interface VocabLookupResult {
  term?: string;
  definition?: string;
  example?: string;
  error?: string;
}

export async function lookupWordAction(word: string, context: string): Promise<VocabLookupResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };

  try {
    const ai = getAIService(user.profile.id);
    const result = await ai.generateVocabulary({ text: context || word });
    const match = result.data.find((v) => v.term.toLowerCase() === word.toLowerCase()) ?? result.data[0];
    if (!match) return { term: word, definition: "No definition available from this passage yet.", example: "" };
    return match;
  } catch {
    return { error: "Couldn't look that up right now." };
  }
}

export interface PracticeResult {
  questions?: { question: string; answer: string; sourceQuote: string }[];
  error?: string;
}

export async function generatePracticeAction(resourceText: string, count = 5): Promise<PracticeResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };
  if (!resourceText.trim()) return { error: "This resource doesn't have enough text yet." };

  try {
    const ai = getAIService(user.profile.id);
    const result = await ai.generatePractice({ text: resourceText, count });
    return { questions: result.data };
  } catch {
    return { error: "Couldn't generate practice questions right now." };
  }
}

export interface SaveNoteResult {
  error?: string;
  success?: boolean;
}

export async function saveNoteAction(resourceId: string, content: string, position?: string): Promise<SaveNoteResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "Please sign in." };
  if (!content.trim()) return { error: "Write something before saving." };

  const supabase = await createClient();
  const { error } = await supabase.from("bp_notes").insert({
    user_id: user.profile.id,
    resource_id: resourceId,
    content,
    position: position ? { quote: position } : null,
  });
  if (error) return { error: "Couldn't save your note." };

  revalidatePath(`/read/${resourceId}`);
  return { success: true };
}
