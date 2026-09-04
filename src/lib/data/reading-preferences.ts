import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type ReadingPreferences = Tables<"reading_preferences">;

export const DEFAULT_READING_PREFERENCES: Omit<ReadingPreferences, "user_id" | "updated_at"> = {
  font_size: 19,
  line_spacing: 1.7,
  letter_spacing: 0.02,
  word_spacing: 0.08,
  content_width: "comfortable",
  alignment: "left",
  background: "cream",
  reading_speed: 1,
  highlight_mode: "sentence",
  dyslexia_font: true,
};

export async function getReadingPreferences(userId: string): Promise<ReadingPreferences> {
  const supabase = await createClient();
  const { data } = await supabase.from("reading_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data;
  return { user_id: userId, updated_at: new Date().toISOString(), ...DEFAULT_READING_PREFERENCES };
}
