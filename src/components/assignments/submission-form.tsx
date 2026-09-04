"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveSubmissionAction } from "@/lib/actions/submissions";

export function SubmissionForm({
  assignmentId,
  initialContent,
  status,
}: {
  assignmentId: string;
  initialContent: string;
  status: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [pending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  function save(submit: boolean) {
    startTransition(async () => {
      const result = await saveSubmissionAction(assignmentId, content, submit);
      if (result.error) toast.error(result.error);
      else {
        toast.success(submit ? "Submitted!" : "Draft saved");
        setCurrentStatus(submit ? "submitted" : "in_progress");
      }
    });
  }

  const locked = currentStatus === "submitted" || currentStatus === "reviewed";

  return (
    <div className="space-y-3">
      <Textarea
        rows={8}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your response here..."
        disabled={locked}
      />
      {locked ? (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> Submitted — your teacher will review it soon.
        </p>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save(false)} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button onClick={() => save(true)} disabled={pending || !content.trim()}>
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}
