"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { recordProgressEvent } from "@/lib/data/student";

export async function recordProgressEventAction(
  eventType: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
) {
  const user = await getCurrentUser();
  if (!user?.profile) return;
  await recordProgressEvent(user.profile.id, eventType, resourceId, metadata);
}
