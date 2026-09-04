"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { respondToTeacherRequestAction } from "@/lib/actions/school";

export function TeacherRequestActions({ membershipId }: { membershipId: string }) {
  const [pending, startTransition] = useTransition();

  function respond(approve: boolean) {
    startTransition(async () => {
      const result = await respondToTeacherRequestAction(membershipId, approve);
      if (result.error) toast.error(result.error);
      else toast.success(approve ? "Teacher approved" : "Request declined");
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => respond(true)}>Approve</Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => respond(false)}>Decline</Button>
    </div>
  );
}
