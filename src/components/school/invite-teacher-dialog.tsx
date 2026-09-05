"use client";

import { useActionState, useEffect, useState } from "react";
import { Copy, Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { inviteTeacherAction, type InviteActionResult } from "@/lib/actions/invites";

export function InviteTeacherDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<InviteActionResult, FormData>(inviteTeacherAction, {});

  useEffect(() => {
    if (state.success) toast.success("Invite sent — they'll join already approved once they accept it.");
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4" /> Invite teacher
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teacher</DialogTitle>
        </DialogHeader>

        {state.success && state.acceptUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Invite created for this email. Since they&apos;re invited directly, they&apos;ll be approved
              automatically the moment they accept — no separate approval step needed.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">{state.acceptUrl}</span>
              <button
                type="button"
                className="ml-auto flex-shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(state.acceptUrl!);
                  toast.success("Link copied");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              If email delivery isn&apos;t configured yet, share this link with them directly.
            </p>
            <Button className="w-full" variant="outline" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Teacher&apos;s email</Label>
              <Input id="email" name="email" type="email" placeholder="teacher@school.edu" required />
            </div>
            <input type="hidden" name="role" value="teacher" />
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send invite
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
