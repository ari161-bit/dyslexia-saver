"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { markSubmissionReviewedAction } from "@/lib/actions/assignments";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning-foreground",
  submitted: "bg-accent text-accent-foreground",
  reviewed: "bg-success/20 text-success",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

export function SubmissionReviewRow({
  studentName,
  status,
  submissionId,
  assignmentId,
  content,
}: {
  studentName: string;
  status: string;
  submissionId: string;
  assignmentId: string;
  content: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-border/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{studentName}</p>
        <Badge className={cn("border-none font-normal", STATUS_STYLE[status])}>{STATUS_LABEL[status] ?? status}</Badge>
      </div>
      {content ? <p className="mt-2 text-sm text-muted-foreground">{content}</p> : null}
      {status === "submitted" ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await markSubmissionReviewedAction(submissionId, assignmentId);
              if (result?.error) toast.error(result.error);
              else toast.success("Marked as reviewed");
            })
          }
        >
          Mark reviewed
        </Button>
      ) : null}
    </div>
  );
}
