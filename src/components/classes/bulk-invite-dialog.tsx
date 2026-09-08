"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { bulkInviteStudentsAction, type BulkInviteResult } from "@/lib/actions/invites";

export function BulkInviteDialog({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<BulkInviteResult, FormData>(bulkInviteStudentsAction, {});

  useEffect(() => {
    if (state.sent !== undefined) {
      toast.success(`${state.sent} of ${state.total} invited`, {
        description: state.skipped ? `${state.skipped} skipped (already invited or invalid).` : undefined,
      });
    }
  }, [state.sent, state.total, state.skipped]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4" /> Bulk invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a whole roster</DialogTitle>
        </DialogHeader>

        {state.sent !== undefined ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sent {state.sent} of {state.total} invites{state.skipped ? ` — ${state.skipped} skipped (already invited or invalid address).` : "."}
            </p>
            <Button className="w-full" variant="outline" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="classId" value={classId} />
            <div className="space-y-1.5">
              <Label htmlFor="emails">Student emails</Label>
              <Textarea
                id="emails"
                name="emails"
                rows={6}
                placeholder={"One per line, pasted straight from a spreadsheet:\nava@school.edu\nliam@school.edu\nmia@school.edu"}
                required
              />
              <p className="text-xs text-muted-foreground">Each student gets their own invite email to create an account and join this class.</p>
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send invites
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
