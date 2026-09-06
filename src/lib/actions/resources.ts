"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAIService } from "@/lib/ai/service";
import { extractTextFromFile } from "@/lib/text-extraction";

export interface UploadResult {
  error?: string;
  resourceId?: string;
}

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

  const { error: uploadError } = await supabase.storage.from("bp_resources").upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: fileUrl } = supabase.storage.from("bp_resources").getPublicUrl(path);

  const { data: resource, error: insertError } = await supabase
    .from("bp_resources")
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
    const rawText = await extractTextFromFile(file);
    const ai = getAIService(user.profile.id);
    const extracted = await ai.extractContent({ text: rawText, fileType: file.type });

    await supabase
      .from("bp_resources")
      .update({
        title: title || extracted.title,
        extracted_text: extracted.rawText || "We couldn't read any text from this file — it may be a scanned image or photo, which isn't supported yet. Try a text-based PDF, Word document, or plain text file, or paste the content directly.",
        extracted_structure: extracted,
        status: "ready",
      })
      .eq("id", resource.id);
  } catch {
    await supabase.from("bp_resources").update({ status: "failed" }).eq("id", resource.id);
  }

  revalidatePath("/teacher/resources");
  revalidatePath("/student/learning");

  redirect(destination === "teacher" ? `/teacher/resources/${resource.id}/adapt` : `/read/${resource.id}`);
}
