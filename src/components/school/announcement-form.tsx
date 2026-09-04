"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncementAction, type SchoolActionResult } from "@/lib/actions/school";

export function AnnouncementForm({ schoolId }: { schoolId: string }) {
  const [state, formAction, pending] = useActionState<SchoolActionResult, FormData>(createAnnouncementAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="schoolId" value={schoolId} />
      <Input name="title" placeholder="Announcement title" required />
      <Textarea name="body" placeholder="Details (optional)" rows={3} />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">Sent to the whole school.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
        Send announcement
      </Button>
    </form>
  );
}
