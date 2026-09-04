"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAIService } from "@/lib/ai/service";

export interface UploadResult {
  error?: string;
  resourceId?: string;
}

const TEXT_TYPES = new Set(["text/plain", "text/markdown"]);

export async function uploadResourceAction(_prev: UploadResult, formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user?.profile) return { error: "You need to be signed in to upload." };

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "student");

  if (!file || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > 25 * 1024 * 1024) return { error: "File is too large (max 25MB)." };

  const supabase = await createClient();
  const path = `${user.profile.id}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("resources").upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: fileUrl } = supabase.storage.from("resources").getPublicUrl(path);

  const { data: resource, error: insertError } = await supabase
    .from("resources")
    .insert({
      owner_id: user.profile.id,
      title: title || file.name.replace(/\.[^.]+$/, ""),
      original_file_url: fileUrl?.publicUrl ?? path,
      original_file_type: file.type,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError || !resource) return { error: "Could not save this resource." };

  try {
    const rawText = TEXT_TYPES.has(file.type) ? await file.text() : "";
    const ai = getAIService(user.profile.id);
    const extracted = await ai.extractContent({ text: rawText, fileType: file.type });

    await supabase
      .from("resources")
      .update({
        title: title || extracted.title,
        extracted_text: extracted.rawText || "This file type needs OCR to extract text — connect a real OCR/vision provider in src/lib/ai/service.ts to read PDFs, DOCX, and photos automatically. For now, paste or type the content of this resource to unlock adaptations.",
        extracted_structure: extracted,
        status: "ready",
      })
      .eq("id", resource.id);
  } catch {
    await supabase.from("resources").update({ status: "failed" }).eq("id", resource.id);
  }

  revalidatePath("/teacher/resources");
  revalidatePath("/student/learning");

  redirect(destination === "teacher" ? `/teacher/resources/${resource.id}/adapt` : `/read/${resource.id}`);
}
