"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestChildLinkAction, type LinkActionResult } from "@/lib/actions/parent-links";

export function RequestLinkForm() {
  const [state, formAction, pending] = useActionState<LinkActionResult, FormData>(requestChildLinkAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="code">Student code</Label>
        <Input id="code" name="code" placeholder="e.g. 8F3K2Q" className="uppercase" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="relationship">Relationship (optional)</Label>
        <Input id="relationship" name="relationship" placeholder="Parent, guardian..." />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send request
      </Button>
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="w-full text-sm text-success">Request sent — a teacher or school admin will confirm it.</p> : null}
    </form>
  );
}
