"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { respondToLinkRequestAction } from "@/lib/actions/parent-links";

export function LinkRequestActions({ linkId, studentId }: { linkId: string; studentId: string }) {
  const [pending, startTransition] = useTransition();

  function respond(approve: boolean) {
    startTransition(async () => {
      const result = await respondToLinkRequestAction(linkId, approve, studentId);
      if (result.error) toast.error(result.error);
      else toast.success(approve ? "Approved" : "Declined");
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => respond(true)}>Approve</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => respond(false)}>Decline</Button>
    </div>
  );
}
